import React, { useState, useEffect } from 'react';
import './AdminPanel.css';
import { getCreditScoreDescription } from '../data/mockDataFinal';
import PaymentHistoryModal from './PaymentHistoryModal';
import loanRequestService from '../services/loanRequestService';

const AdminPanel = ({
  loanRequests,
  setLoanRequests,
  loans,
  setLoans,
  members,
  setMembers,
  getPaymentWithLateFee,
  settings
}) => {
  const [activeSection, setActiveSection] = useState('requests');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sortBy, setSortBy] = useState('requestDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedLoanForHistory, setSelectedLoanForHistory] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [selectedLoanForDate, setSelectedLoanForDate] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState('');
  const [searchTermPayments, setSearchTermPayments] = useState('');
  const [filterByPayments, setFilterByPayments] = useState('all');
  const [sortByPayments, setSortByPayments] = useState('dueDate');
  const [sortOrderPayments, setSortOrderPayments] = useState('asc');

  // Actualizar estados de préstamos basado en fecha actual
  useEffect(() => {
    const updateLoanStatuses = () => {
      const today = new Date();
      
      setLoans(prevLoans => prevLoans.map(loan => {
        if (loan.status === 'paid') return loan;
        
        const dueDate = new Date(loan.dueDate);
        let newStatus = loan.status;
        
        if (loan.remainingAmount === 0) {
          newStatus = 'paid';
        } else if (dueDate < today) {
          newStatus = 'overdue';
        } else {
          newStatus = 'current';
        }
        
        return loan.status !== newStatus ? { ...loan, status: newStatus } : loan;
      }));
    };

    updateLoanStatuses();
  }, []); // Solo ejecutar al montar el componente

  // Función helper para calcular el pago mensual (Amortización Francesa)
  const calculateMonthlyPayment = (amount, installments, monthlyInterestRate) => {
    // Tasa de interés mensual en decimal
    const TEM = monthlyInterestRate / 100;
    
    // Si la tasa es 0, dividir el monto entre las cuotas
    if (TEM === 0) {
      return amount / installments;
    }
    
    // Aplicar fórmula de amortización francesa
    // Cuota = [Monto * (TEM x (1 + TEM)^n)] / [(1 + TEM)^n - 1]
    const potencia = Math.pow(1 + TEM, installments);
    const monthlyPayment = amount * (TEM * potencia) / (potencia - 1);
    
    return monthlyPayment;
  };

  // Función para calcular la fecha del próximo miércoles
  const getNextWednesday = (date) => {
    // Manejar correctamente la zona horaria
    let d;
    if (typeof date === 'string' && date.includes('-')) {
      // Si es una fecha ISO string (YYYY-MM-DD), crear la fecha en hora local
      const [year, month, day] = date.split('T')[0].split('-').map(Number);
      d = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
    } else {
      d = new Date(date);
    }
    
    const dayOfWeek = d.getDay(); // 0 = domingo, 3 = miércoles
    
    // Calcular días hasta el próximo miércoles
    let daysToAdd;
    if (dayOfWeek === 3) {
      // Si es miércoles, ir al siguiente miércoles (7 días)
      daysToAdd = 7;
    } else if (dayOfWeek < 3) {
      // Domingo (0), Lunes (1), Martes (2): ir al miércoles de esta semana
      daysToAdd = 3 - dayOfWeek;
    } else {
      // Jueves (4), Viernes (5), Sábado (6): ir al miércoles de la próxima semana
      daysToAdd = 10 - dayOfWeek;
    }
    
    const nextDate = new Date(d);
    nextDate.setDate(d.getDate() + daysToAdd);
    return nextDate;
  };

  // Función para determinar la calificación crediticia basada en el puntaje
  const getCreditRatingFromScore = (score) => {
    if (score >= 70) return 'green';   // Verde (Excelente): 70-90
    if (score >= 40) return 'yellow';  // Amarillo (Regular): 40-69
    return 'red';                      // Rojo (Riesgo): 0-39
  };

  // Función para actualizar la calificación crediticia de un miembro
  const updateMemberCreditScore = (memberId, scoreChange, reason) => {
    setMembers(prevMembers => prevMembers.map(member => {
      if (member.id === memberId) {
        // Calcular nuevo puntaje con límites 0-90
        const newScore = Math.max(0, Math.min(90, (member.creditScore || 90) + scoreChange));
        const newRating = getCreditRatingFromScore(newScore);
        
        console.log(`📊 Actualizando calificación crediticia para ${member.name}:`, {
          puntajeAnterior: member.creditScore || 90,
          cambio: scoreChange,
          nuevoPuntaje: newScore,
          nuevaCalificacion: newRating,
          motivo: reason
        });

        return {
          ...member,
          creditScore: newScore,
          creditRating: newRating
        };
      }
      return member;
    }));
  };

  // Función para calcular días de atraso
  const calculateDaysLate = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
    return Math.max(0, diffDays);
  };

  // Función para calcular semanas de atraso (para calificación crediticia)
  const calculateWeeksLate = (dueDate) => {
    const daysLate = calculateDaysLate(dueDate);
    return Math.floor(daysLate / 7);
  };

  const handleApproveRequest = async (requestId) => {
    const request = loanRequests.find(r => r.id === requestId);
    if (!request) {
      console.error('❌ No se encontró la solicitud de préstamo con ID:', requestId);
      return;
    }

    console.log('✅ Aprobando solicitud de préstamo:', request);

    // Generar cronograma de pagos usando la fecha requerida
    const { generateMockPaymentSchedule } = await import('../data/mockDataFinal');
    const startDate = request.requiredDate || request.requestDate;
    const paymentSchedule = generateMockPaymentSchedule(
      request.requestedAmount,
      request.totalWeeks || request.installments,
      request.monthlyInterestRate,
      startDate
    );

    // La primera fecha de pago viene del cronograma
    const firstPaymentDate = paymentSchedule[0]?.dueDate || new Date().toISOString().split('T')[0];

    // Generar un nuevo ID para el préstamo
    const newLoanId = Math.max(...loans.map(l => l.id || 0), 0) + 1;
    
    console.log('✅ Creando nuevo préstamo con ID:', newLoanId);
    
    // Crear un nuevo préstamo basado en la solicitud aprobada
    const newLoan = {
      id: newLoanId,
      memberId: request.memberId,
      memberName: request.memberName,
      requestId: request.id, // Relacionar con la solicitud original
      originalAmount: request.requestedAmount,
      remainingAmount: request.requestedAmount,
      weeklyPayment: request.weeklyPayment,
      monthlyPayment: request.monthlyPayment,
      totalWeeks: request.totalWeeks,
      installments: request.installments,
      startDate: startDate,
      dueDate: firstPaymentDate,
      status: 'current', // Estado activo
      monthlyInterestRate: request.monthlyInterestRate,
      paymentSchedule: paymentSchedule,
      paymentHistory: [],
      approvedDate: new Date().toISOString(),
      approvedBy: 'admin',
      currentInstallment: 1,
      currentWeek: 1,
      interestRate: request.monthlyInterestRate
    };
    
    // Enviar el préstamo al backend para persistir en base de datos
    try {
      console.log('📤 Enviando solicitud de creación de préstamo al backend');
      console.log('📤 Request ID:', request.id, 'Approved by: admin');
      
      const { default: loanService } = await import('../services/loanService');
      
      // Llamar al servicio con los parámetros correctos
      const savedLoanResponse = await loanService.createLoanFromRequest(request.id, 'admin');
      console.log('✅ Respuesta del backend:', savedLoanResponse);
      
      // Extraer el préstamo de la respuesta del backend
      const savedLoan = savedLoanResponse.data || savedLoanResponse;
      console.log('✅ Préstamo guardado en backend:', savedLoan);
      
      // Mapear datos del backend al formato del frontend usando el mapper
      const { mapLoanFromBackend } = await import('../utils/loanDataMapper');
      const mappedLoan = mapLoanFromBackend(savedLoan);
      console.log('✅ Préstamo mapeado para frontend:', mappedLoan);
      
      // Actualizar lista con el préstamo mapeado
      if (mappedLoan) {
        setLoans(prev => [...prev, mappedLoan]);
      } else {
        // Si el mapping falla, usar newLoan como fallback
        setLoans(prev => [...prev, newLoan]);
      }
      
    } catch (error) {
      console.error('❌ Error guardando préstamo en backend:', error);
      console.error('❌ Detalles del error:', error.response?.data);
      
      // Fallback: agregar solo en memoria si falla el backend
      setLoans(prev => [...prev, newLoan]);
      
      // Mostrar un mensaje más específico al usuario
      if (error.response?.status === 404) {
        alert('❌ Error: La solicitud de préstamo no se encontró en el backend.');
      } else if (error.response?.status === 400) {
        alert('❌ Error: ' + (error.response.data?.message || 'Datos de solicitud inválidos.'));
      } else {
        alert('❌ Error al guardar el préstamo en el backend. Se guardó solo en memoria temporalmente.');
      }
    }
    
    // Marcar la solicitud como aprobada en lugar de eliminarla
    setLoanRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: 'approved', approvedDate: new Date().toISOString() }
        : r
    ));
    
    console.log(`✅ Préstamo aprobado para ${request.memberName} por S/ ${(request.requestedAmount || 0).toLocaleString()}`);
  };

  const handleRejectRequest = async (requestId, reason = '') => {
    const request = loanRequests.find(r => r.id === requestId);
    if (!request) {
      console.error('Solicitud no encontrada');
      return;
    }

    // Validar que el motivo tenga al menos 10 caracteres (requerido por backend)
    if (!reason || reason.trim().length < 10) {
      alert('El motivo del rechazo debe tener al menos 10 caracteres');
      return;
    }

    try {
      console.log('🔄 Enviando rechazo al backend:', {
        requestId,
        rejectedBy: 'Administrador',
        rejectionReason: reason.trim()
      });

      // Llamar al backend para rechazar la solicitud
      const response = await loanRequestService.rejectLoanRequest(requestId, {
        rejectedBy: 'Administrador',
        rejectionReason: reason.trim()
      });

      console.log('✅ Rechazo exitoso:', response);

      // Actualizar el estado local solo después del éxito del backend
      setLoanRequests(prev => prev.map(r =>
        r.id === requestId
          ? { 
              ...r, 
              status: 'rejected', 
              rejectionReason: reason.trim(), 
              rejectedDate: new Date().toISOString(),
              rejectedBy: 'Administrador'
            }
          : r
      ));

      // Actualizar también la lista de préstamos si existe
      setLoans(prev => prev.map(loan => {
        if (loan.id === requestId || loan.id === Number(requestId) || String(loan.id) === String(requestId)) {
          console.log(`Rechazando préstamo existente ID: ${loan.id} para ${request.memberName}`);
          return {
            ...loan,
            status: 'Rechazada',
            rejectionReason: reason.trim(),
            rejectedDate: new Date().toISOString()
          };
        }
        return loan;
      }));

      console.log(`✅ Solicitud rechazada exitosamente para ${request.memberName}`);

      // Recargar las solicitudes desde el backend para sincronizar
      try {
        console.log('🔄 Recargando solicitudes desde el backend...');
        const updatedRequests = await loanRequestService.getLoanRequests();
        console.log('✅ Solicitudes recargadas:', updatedRequests);
        
        if (Array.isArray(updatedRequests)) {
          setLoanRequests(updatedRequests);
          console.log('📊 Total solicitudes actualizadas:', updatedRequests.length);
        }
      } catch (reloadError) {
        console.error('⚠️ Error recargando solicitudes:', reloadError);
        // No fallar si la recarga falla, solo loggear
      }

    } catch (error) {
      console.error('❌ Error rechazando solicitud:', error);
      
      // Mostrar mensaje de error específico
      let errorMessage = 'Error al rechazar la solicitud';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
    }
  };

  const getFilteredAndSortedRequests = (requests) => {
    let filtered = requests;

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro por calificación crediticia
    if (filterBy !== 'all') {
      filtered = filtered.filter(request => {
        const member = members && members.find(m => m.id === request.memberId);
        return member?.creditRating === filterBy;
      });
    }

    // Aplicar ordenamiento
    return filtered.sort((a, b) => {
      let aValue, bValue;
      const memberA = members && members.find(m => m.id === a.memberId);
      const memberB = members && members.find(m => m.id === b.memberId);

      switch (sortBy) {
        case 'memberName':
          aValue = a.memberName;
          bValue = b.memberName;
          break;
        case 'amount':
          aValue = a.requestedAmount;
          bValue = b.requestedAmount;
          break;
        case 'requestDate':
          aValue = new Date(a.requestDate);
          bValue = new Date(b.requestDate);
          break;
        case 'creditRating':
          const ratingOrder = { 'green': 1, 'yellow': 2, 'red': 3 };
          aValue = ratingOrder[memberA?.creditRating] || 4;
          bValue = ratingOrder[memberB?.creditRating] || 4;
          break;
        case 'creditScore':
          aValue = memberA?.creditScore || 0;
          bValue = memberB?.creditScore || 0;
          break;
        case 'guarantee':
          aValue = ((memberA?.shares || 0) * 500) || 0;
          bValue = ((memberB?.shares || 0) * 500) || 0;
          break;
        case 'priority':
          aValue = a.priority || 2;
          bValue = b.priority || 2;
          break;
        default:
          aValue = new Date(a.requestDate);
          bValue = new Date(b.requestDate);
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });
  };

  const getPendingRequests = () => {
    console.log('🔍 AdminPanel - Debug getPendingRequests:');
    console.log('📋 Total loanRequests recibidas:', loanRequests.length);
    console.log('📊 loanRequests completas:', loanRequests);
    
    // Debug: Ver todos los status
    loanRequests.forEach((req, index) => {
      console.log(`📄 Solicitud ${index + 1}: ID=${req.id}, Status="${req.status}", Monto=${req.requestedAmount}`);
    });
    
    const pending = loanRequests.filter(request => request.status === 'pending');
    console.log('✅ Solicitudes pendientes encontradas:', pending.length);
    console.log('📋 Solicitudes pendientes:', pending);
    
    const filtered = getFilteredAndSortedRequests(pending);
    console.log('🔄 Solicitudes después de filtros:', filtered.length);
    console.log('📊 Solicitudes filtradas:', filtered);
    
    return filtered;
  };

  const getProcessedRequests = () => {
    const processed = loanRequests.filter(request => request.status !== 'pending');
    return getFilteredAndSortedRequests(processed);
  };

  const registerPayment = (loanId, amount, date = new Date().toISOString()) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === loanId) {
        const paymentDate = new Date(date.split('T')[0]);
        const dueDate = new Date(loan.dueDate);
        
        // Calcular si el pago es puntual o tardío
        const weeksLate = calculateWeeksLate(loan.dueDate);
        let scoreChange = 0;
        let reason = '';

        if (weeksLate === 0) {
          // Pago puntual: +2 puntos
          scoreChange = 2;
          reason = 'Pago puntual';
        } else if (weeksLate === 1) {
          // 1 semana de atraso: -5 puntos
          scoreChange = -5;
          reason = `Pago con 1 semana de atraso`;
        } else if (weeksLate >= 2) {
          // 2+ semanas de atraso: -10 puntos
          scoreChange = -10;
          reason = `Pago con ${weeksLate} semanas de atraso`;
        }

        // Actualizar calificación crediticia del miembro
        if (scoreChange !== 0) {
          updateMemberCreditScore(loan.memberId, scoreChange, reason);
        }

        // Calcular la mora si el pago es tardío (diariamente)
        const daysLate = calculateDaysLate(loan.dueDate);
        const lateFee = daysLate > 0 ? 
          (loan.weeklyPayment || loan.monthlyPayment) * ((settings.delinquencyRate / 100) * daysLate) : 0;
        
        const newPaymentHistory = [...loan.paymentHistory, {
          date: date.split('T')[0],
          amount: parseFloat(amount),
          type: 'payment',
          weeksLate: weeksLate,
          scoreChange: scoreChange,
          lateFee: lateFee
        }];

        const newRemainingAmount = Math.max(0, loan.remainingAmount - parseFloat(amount));
        const newCurrentInstallment = amount >= (loan.weeklyPayment || loan.monthlyPayment) ?
          loan.currentInstallment + 1 : loan.currentInstallment;

        let newStatus = 'current';
        if (newRemainingAmount === 0) {
          newStatus = 'paid';
        } else {
          const today = new Date();
          if (dueDate < today) {
            newStatus = 'overdue';
          }
        }

        // Calcular la próxima fecha de vencimiento desde el cronograma
        let nextDueDate = loan.dueDate;
        if (newCurrentInstallment <= loan.installments && loan.paymentSchedule) {
          // Usar la fecha del cronograma si existe
          const nextPayment = loan.paymentSchedule[newCurrentInstallment - 1];
          if (nextPayment) {
            nextDueDate = nextPayment.dueDate;
          }
        } else if (newCurrentInstallment <= loan.installments) {
          // Fallback: calcular próximo miércoles solo si no hay cronograma
          const currentDueDate = new Date(loan.dueDate);
          currentDueDate.setDate(currentDueDate.getDate() + 7);
          const nextWednesday = getNextWednesday(currentDueDate);
          nextDueDate = nextWednesday.toISOString().split('T')[0];
        }

        return {
          ...loan,
          remainingAmount: newRemainingAmount,
          currentInstallment: newCurrentInstallment,
          paymentHistory: newPaymentHistory,
          status: newStatus,
          dueDate: nextDueDate
        };
      }
      return loan;
    }));
  };

  const modifyLoanTerms = (loanId, modifications) => {
    setLoans(prev => prev.map(loan =>
      loan.id === loanId ? { ...loan, ...modifications } : loan
    ));
  };

  const renderRequestsSection = () => {
    const pendingRequests = getPendingRequests();
    const processedRequests = getProcessedRequests();

    return (
      <div className="requests-section">
        <div className="section-header">
          <h3>📋 Solicitudes de Préstamo</h3>
          <div className="requests-summary">
            <span className="pending-count">
              {pendingRequests.length} pendientes
            </span>
            <span className="processed-count">
              {processedRequests.length} procesadas
            </span>
            {pendingRequests.length > 0 && (
              <div className="notification-badge">
                🔔 {pendingRequests.length} nueva{pendingRequests.length > 1 ? 's' : ''} solicitud{pendingRequests.length > 1 ? 'es' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="requests-tabs">
          <button
            className={`tab-btn ${activeSection === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveSection('requests')}
          >
            ⏳ Pendientes ({pendingRequests.length})
          </button>
          <button
            className={`tab-btn ${activeSection === 'processed' ? 'active' : ''}`}
            onClick={() => setActiveSection('processed')}
          >
            ✅ Procesadas ({processedRequests.length})
          </button>
        </div>

        <div className="requests-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o propósito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label>Filtrar por calificación:</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="filter-select"
              >
                <option value="all">🔘 Todas</option>
                <option value="green">🟢 Verde (Excelente)</option>
                <option value="yellow">🟡 Amarilla (Regular)</option>
                <option value="red">🔴 Roja (Riesgo)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="requestDate">📅 Fecha de solicitud</option>
                <option value="memberName">👤 Nombre del miembro</option>
                <option value="amount">💰 Monto solicitado</option>
                <option value="creditRating">⭐ Calificación crediticia</option>
                <option value="creditScore">📊 Puntaje crediticio</option>
                <option value="guarantee">🏛️ Garantía disponible</option>
                <option value="priority">🔥 Prioridad</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Orden:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-select"
              >
                <option value="asc">⬆️ Ascendente</option>
                <option value="desc">⬇️ Descendente</option>
              </select>
            </div>
          </div>

          <div className="filter-summary">
            {searchTerm && (
              <span className="filter-chip">
                🔍 "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>❌</button>
              </span>
            )}
            {filterBy !== 'all' && (
              <span className="filter-chip">
                {filterBy === 'green' && '🟢 Verde'}
                {filterBy === 'yellow' && '🟡 Amarilla'}
                {filterBy === 'red' && '🔴 Roja'}
                <button onClick={() => setFilterBy('all')}>❌</button>
              </span>
            )}
            {(searchTerm || filterBy !== 'all') && (
              <button
                className="clear-filters"
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
              >
                🗑️ Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {activeSection === 'requests' && (
          <div className="pending-requests">
            {(searchTerm || filterBy !== 'all') && (
              <div className="filter-results-info">
                <span>📊 Mostrando {pendingRequests.length} de {loanRequests.filter(r => r.status === 'pending').length} solicitudes pendientes</span>
              </div>
            )}
            {pendingRequests.length > 0 ? (
              pendingRequests.map(request => {
                const member = members && members.find(m => m.id === request.memberId);
                const priorityLabels = { 1: 'Alta', 2: 'Media', 3: 'Baja' };

                return (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <div className="member-info">
                        <h4>{request.memberName}</h4>
                        <div className="member-details">
                          <span className={`credit-rating ${member?.creditRating}`}>
                            {member?.creditRating === 'green' && '🟢'}
                            {member?.creditRating === 'yellow' && '🟡'}
                            {member?.creditRating === 'red' && '🔴'}
                            <span className="credit-score">
                              {member?.creditScore || 0}/90
                            </span>
                          </span>
                          <span className="credit-description">
                            {member?.creditScore ? getCreditScoreDescription(member.creditScore) : 'Sin Calificar'}
                          </span>
                          <span className="guarantee">
                            Garantía: S/ {((member?.shares || 0) * 500).toLocaleString()}
                          </span>
                          <span className={`priority priority-${request.priority || 2}`}>
                            Prioridad: {priorityLabels[request.priority || 2]}
                          </span>
                        </div>
                      </div>
                      <div className="request-amount">
                        <div className="amount">S/ {(request.requestedAmount || 0).toLocaleString()}</div>
                        <div className="installments">{request.installments} semanas</div>
                      </div>
                    </div>

                    <div className="request-details">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="label">Tasa de interés:</span>
                          <span className="value">{request.monthlyInterestRate}% mensual</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Plazo:</span>
                          <span className="value">{request.installments} semanas</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Monto solicitado:</span>
                          <span className="value">S/ {(request.requestedAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Pago semanal:</span>
                          <span className="value">S/ {(request.weeklyPayment || 0).toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Fecha solicitud:</span>
                          <span className="value">
                            {new Date(request.requestDate).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="request-actions">
                      <button
                        className="approve-btn"
                        onClick={() => {
                          handleApproveRequest(request.id);
                          setSuccessMessage(`Solicitud de préstamo aprobada para ${request.memberName}`);
                          setSuccessType('approved');
                          setShowSuccessModal(true);
                        }}
                      >
                        ✅ Aprobar
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => {
                          setRequestToReject(request);
                          setShowRejectionModal(true);
                        }}
                      >
                        ❌ Rechazar
                      </button>
                      <button
                        className="details-btn"
                        onClick={() => setSelectedRequest(request)}
                      >
                        👁️ Ver detalles
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-requests">
                <div className="no-requests-icon">📭</div>
                <h4>No hay solicitudes pendientes</h4>
                <p>Todas las solicitudes han sido procesadas</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'processed' && (
          <div className="processed-requests">
            {processedRequests.map(request => (
              <div key={request.id} className={`request-card processed ${request.status}`}>
                <div className="request-summary">
                  <div className="member-name">{request.memberName}</div>
                  <div className="amount">S/ {(request.requestedAmount || 0).toLocaleString()}</div>
                  <div className={`status ${request.status}`}>
                    {request.status === 'approved' && '✅ Aprobado'}
                    {request.status === 'rejected' && '❌ Rechazado'}
                  </div>
                  <div className="date">
                    {new Date(request.approvedDate || request.rejectedDate).toLocaleDateString('es-ES')}
                  </div>
                  <button
                    className="details-btn"
                    onClick={() => setSelectedRequest(request)}
                    title="Ver detalles de la solicitud"
                  >
                    👁️ Ver detalles
                  </button>
                </div>
                {request.rejectionReason && (
                  <div className="rejection-reason">
                    <strong>Motivo:</strong> {request.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Calcular monto con mora (tasa diaria por cada día vencido)
  const calculateAmountWithLateFee = (loan) => {
    if (loan.status !== 'overdue' && loan.status !== 'late') {
      return loan.weeklyPayment || loan.monthlyPayment;
    }

    // Calcular días de atraso
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const daysLate = Math.ceil((today - dueDate) / (24 * 60 * 60 * 1000));

    if (daysLate <= 0) return loan.weeklyPayment || loan.monthlyPayment;

    // Aplicar tasa de mora diaria configurada en settings
    const payment = loan.weeklyPayment || loan.monthlyPayment;
    const dailyLateFeePercentage = (settings.delinquencyRate / 100) * daysLate;
    const lateFeeAmount = payment * dailyLateFeePercentage;

    return Math.ceil(payment + lateFeeAmount);
  };

  // Función para obtener información del estado del préstamo
  const getStatusInfo = (loan) => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

    if (loan.status === 'paid') {
      return { label: 'Pagado', class: 'paid', icon: '✅' };
    } else if (daysDiff < 0) {
      return { label: `Vencido (${Math.abs(daysDiff)} días)`, class: 'overdue', icon: '🔴' };
    } else if (daysDiff <= 3) {
      return { label: `Vence en ${daysDiff} días`, class: 'due-soon', icon: '🟡' };
    } else {
      return { label: 'Al día', class: 'current', icon: '🟢' };
    }
  };

  const getFilteredAndSortedPayments = (loans) => {
    let filtered = loans;

    // Aplicar filtro de búsqueda
    if (searchTermPayments) {
      filtered = filtered.filter(loan =>
        loan.memberName.toLowerCase().includes(searchTermPayments.toLowerCase())
      );
    }

    // Aplicar filtro por estado
    if (filterByPayments !== 'all') {
      filtered = filtered.filter(loan => {
        const today = new Date();
        const dueDate = new Date(loan.dueDate);
        const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (filterByPayments === 'overdue') {
          return daysDiff < 0; // Vencidos: fecha de vencimiento pasada
        }
        if (filterByPayments === 'current') {
          return daysDiff > 3; // Al día: más de 3 días para vencer
        }
        if (filterByPayments === 'due-soon') {
          return daysDiff >= 0 && daysDiff <= 3; // Por vencer: entre 0 y 3 días
        }
        
        return true;
      });
    }

    // Aplicar ordenamiento
    return filtered.sort((a, b) => {
      let aValue, bValue;
      const memberA = members && members.find(m => m.id === a.memberId);
      const memberB = members && members.find(m => m.id === b.memberId);

      switch (sortByPayments) {
        case 'memberName':
          aValue = a.memberName;
          bValue = b.memberName;
          break;
        case 'amount':
          aValue = a.originalAmount;
          bValue = b.originalAmount;
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'status':
          const getStatusPriority = (loan) => {
            const today = new Date();
            const dueDate = new Date(loan.dueDate);
            const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
            if (daysDiff < 0) return 3; // overdue
            if (daysDiff <= 3) return 2; // due-soon
            return 1; // current
          };
          aValue = getStatusPriority(a);
          bValue = getStatusPriority(b);
          break;
        default:
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrderPayments === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue - bValue;
        return sortOrderPayments === 'asc' ? comparison : -comparison;
      }
    });
  };

  const renderPaymentsSection = () => {
    const activeLoans = loans.filter(loan => loan.status !== 'paid');
    const filteredActiveLoans = getFilteredAndSortedPayments(activeLoans);

    return (
      <div className="payments-section">
        <div className="section-header">
          <h3>💳 Gestión de Pagos</h3>
          <div className="payments-summary">
            <span>Total préstamos activos: {activeLoans.length}</span>
          </div>
        </div>

        <div className="requests-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre..."
              value={searchTermPayments}
              onChange={(e) => setSearchTermPayments(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label>Filtrar por estado:</label>
              <select
                value={filterByPayments}
                onChange={(e) => setFilterByPayments(e.target.value)}
                className="filter-select"
              >
                <option value="all">🔘 Todos</option>
                <option value="overdue">🔴 Vencidos</option>
                <option value="current">🟢 Al día</option>
                <option value="due-soon">🟡 Por vencer</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Ordenar por:</label>
              <select
                value={sortByPayments}
                onChange={(e) => setSortByPayments(e.target.value)}
                className="filter-select"
              >
                <option value="dueDate">📅 Fecha de vencimiento</option>
                <option value="memberName">👤 Nombre del miembro</option>
                <option value="amount">💰 Monto del préstamo</option>
                <option value="status">⚡ Estado</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Orden:</label>
              <select
                value={sortOrderPayments}
                onChange={(e) => setSortOrderPayments(e.target.value)}
                className="filter-select"
              >
                <option value="asc">⬆️ Ascendente</option>
                <option value="desc">⬇️ Descendente</option>
              </select>
            </div>
          </div>

          <div className="filter-summary">
            {searchTermPayments && (
              <span className="filter-chip">
                🔍 "{searchTermPayments}"
                <button onClick={() => setSearchTermPayments('')}>❌</button>
              </span>
            )}
            {filterByPayments !== 'all' && (
              <span className="filter-chip">
                {filterByPayments === 'overdue' && '🔴 Vencidos'}
                {filterByPayments === 'current' && '🟢 Al día'}
                {filterByPayments === 'due-soon' && '🟡 Por vencer'}
                <button onClick={() => setFilterByPayments('all')}>❌</button>
              </span>
            )}
            {(searchTermPayments || filterByPayments !== 'all') && (
              <>
                <span className="filter-chip">
                  📊 {filteredActiveLoans.length} de {activeLoans.length}
                </span>
                <button
                  className="clear-filters"
                  onClick={() => {
                    setSearchTermPayments('');
                    setFilterByPayments('all');
                  }}
                >
                  🗑️ Limpiar filtros
                </button>
              </>
            )}
          </div>
        </div>

        <div className="loans-grid">
          {filteredActiveLoans.map(loan => {
            const statusInfo = getStatusInfo(loan);
            const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
            
            return (
              <div key={loan.id} className={`loan-card ${loan.status}`}>
                <div className="loan-header">
                  <h4>{loan.memberName}</h4>
                  <div className={`status-badge ${loan.status}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </div>
                </div>

                <div className="loan-details">
                  {(loan.status === 'overdue' || loan.status === 'late') && (() => {
                    const today = new Date();
                    const dueDate = new Date(loan.dueDate);
                    const weeksLate = Math.ceil((today - dueDate) / (7 * 24 * 60 * 60 * 1000));
                    return weeksLate > 0 ? (
                      <div className="late-warning">
                        <span className="warning-icon">⚠️</span>
                        <span className="late-text">{weeksLate} {weeksLate === 1 ? 'semana' : 'semanas'} de atraso</span>
                      </div>
                    ) : null;
                  })()}
                  <div className="loan-amounts">
                    <div className="amount-item">
                      <span className="label">Monto original:</span>
                      <span className="value">S/ {(loan.originalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="amount-item">
                      <span className="label">Saldo pendiente:</span>
                      <span className="value">S/ {(loan.remainingAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="amount-item">
                      <span className="label">Pago semanal:</span>
                      <span className="value">S/ {Math.ceil(weeklyPayment)}</span>
                    </div>
                    {(loan.status === 'overdue' || loan.status === 'late') && (
                      <div className="amount-item late-fee">
                        <span className="label">Con mora:</span>
                        <span className="value late-amount">
                          S/ {Math.ceil(calculateAmountWithLateFee(loan)).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="loan-progress">
                    <div className="progress-info">
                      <span>Semana {loan.currentWeek || loan.currentInstallment || 1} de {loan.totalWeeks || loan.installments}</span>
                      <span>
                        {loan.status === 'overdue' || loan.status === 'late' ? (
                          <span className="overdue-text">
                            ⚠️ Vencido: {new Date(loan.dueDate).toLocaleDateString('es-ES')}
                          </span>
                        ) : (
                          <>Próximo vencimiento: {new Date(loan.dueDate).toLocaleDateString('es-ES')}</>
                        )}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="loan-actions">
                  <div className="action-row">
                    <button
                      className="payment-btn"
                      onClick={() => {
                        setSelectedLoanForPayment(loan);
                        setShowPaymentModal(true);
                      }}
                    >
                      💵 Registrar pago
                    </button>
                    <button
                      className="modify-btn"
                      onClick={() => {
                        setSelectedLoanForDate(loan);
                        setShowDateModal(true);
                      }}
                    >
                      📅 Modificar fecha
                    </button>
                  </div>
                  <button
                    className="history-btn full-width"
                    onClick={() => {
                      setSelectedLoanForHistory(loan);
                      setShowPaymentHistory(true);
                    }}
                  >
                    📊 Historial
                  </button>
                </div>

                {loan.paymentHistory && loan.paymentHistory.length > 0 && (
                  <div className="payment-history">
                    <h5>Historial reciente:</h5>
                    <div className="history-list">
                      {loan.paymentHistory
                        .slice()
                        .reverse()
                        .slice(0, 3)
                        .map((payment, index) => (
                          <div key={index} className="history-item">
                            <span className="date">{new Date(payment.date).toLocaleDateString('es-ES')}</span>
                            <span className="amount">S/ {(payment.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <h2>⚙️ Panel de Gestión Administrativa</h2>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeSection === 'requests' || activeSection === 'processed' ? 'active' : ''}`}
            onClick={() => setActiveSection('requests')}
          >
            📋 Solicitudes
          </button>
          <button
            className={`admin-tab ${activeSection === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveSection('payments')}
          >
            💳 Pagos
          </button>
        </div>
      </div>

      <div className="admin-content">
        {(activeSection === 'requests' || activeSection === 'processed') && renderRequestsSection()}
        {activeSection === 'payments' && renderPaymentsSection()}
      </div>

      {selectedRequest && (() => {
        const member = members && members.find(m => m.id === selectedRequest.memberId);
        console.log('🔍 Modal Debug - selectedRequest:', selectedRequest);
        console.log('🔍 Modal Debug - members array:', members);
        console.log('🔍 Modal Debug - member encontrado:', member);
        return (
          <div className="modal-overlay">
            <div className="detail-modal">
              <div className="modal-header">
                <h3>👁️ Detalle de Solicitud de Préstamo</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedRequest(null)}
                >
                  ✖
                </button>
              </div>
              
              <div className="modal-content">
                {/* Header con información del solicitante */}
                <div className="detail-header">
                  <div className="member-avatar">
                    {selectedRequest.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <h4>{selectedRequest.memberName}</h4>
                    <div className="member-meta">
                      <span className="member-id">ID: {selectedRequest.memberId}</span>
                      <span className={`credit-badge ${member?.creditRating}`}>
                        {member?.creditRating === 'green' && '🟢 Excelente'}
                        {member?.creditRating === 'yellow' && '🟡 Regular'}
                        {member?.creditRating === 'red' && '🔴 Observado'}
                      </span>
                      <span className="credit-score">Puntaje: {member?.creditScore || 0}/90</span>
                    </div>
                  </div>
                  <div className="request-date">
                    <span className="date-label">Fecha de solicitud</span>
                    <span className="date-value">{new Date(selectedRequest.requestDate).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                {/* Información financiera */}
                <div className="financial-section">
                  <h5>💰 Información Financiera</h5>
                  <div className="financial-grid">
                    <div className="financial-card primary">
                      <div className="card-icon">💵</div>
                      <div className="card-content">
                        <div className="card-label">Monto Solicitado</div>
                        <div className="card-value">S/ {(selectedRequest.requestedAmount || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="card-icon">📅</div>
                      <div className="card-content">
                        <div className="card-label">Plazo</div>
                        <div className="card-value">{selectedRequest.installments} semanas</div>
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="card-icon">📊</div>
                      <div className="card-content">
                        <div className="card-label">Tasa de Interés</div>
                        <div className="card-value">{selectedRequest.monthlyInterestRate}% mensual</div>
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="card-icon">💳</div>
                      <div className="card-content">
                        <div className="card-label">Pago Semanal</div>
                        <div className="card-value">S/ {(selectedRequest.weeklyPayment || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="card-icon">🏦</div>
                      <div className="card-content">
                        <div className="card-label">Total a Pagar</div>
                        <div className="card-value">S/ {(selectedRequest.totalAmount || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="financial-card">
                      <div className="card-icon">📈</div>
                      <div className="card-content">
                        <div className="card-label">Total Intereses</div>
                        <div className="card-value">S/ {(selectedRequest.totalInterest || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Análisis de riesgo */}
                <div className="risk-section">
                  <h5>⚖️ Análisis de Riesgo</h5>
                  <div className="risk-grid">
                    <div className="risk-card">
                      <div className="risk-label">Garantía Disponible</div>
                      <div className="risk-value">S/ {(member?.guarantee || 0).toLocaleString()}</div>
                      <div className="risk-usage">
                        Uso: {((selectedRequest.requestedAmount / (member?.guarantee || 1)) * 100).toFixed(1)}% de garantía
                      </div>
                    </div>
                    <div className="risk-card">
                      <div className="risk-label">Nivel de Riesgo</div>
                      <div className={`risk-level ${member?.creditRating}`}>
                        {member?.creditRating === 'green' && 'Bajo'}
                        {member?.creditRating === 'yellow' && 'Medio'}
                        {member?.creditRating === 'red' && 'Alto'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Propósito */}
                <div className="purpose-section">
                  <h5>📝 Propósito del Préstamo</h5>
                  <div className="purpose-content">
                    {selectedRequest.purpose}
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button
                  className="approve-detail-btn"
                  onClick={() => {
                    handleApproveRequest(selectedRequest.id);
                    setSelectedRequest(null);
                    setSuccessMessage(`Solicitud de préstamo aprobada para ${selectedRequest.memberName}`);
                    setSuccessType('approved');
                    setShowSuccessModal(true);
                  }}
                >
                  <span className="btn-icon">✅</span>
                  <span className="btn-text">Aprobar</span>
                </button>
                <button
                  className="reject-detail-btn"
                  onClick={() => {
                    setRequestToReject(selectedRequest);
                    setShowRejectionModal(true);
                    setSelectedRequest(null);
                  }}
                >
                  <span className="btn-icon">❌</span>
                  <span className="btn-text">Rechazar</span>
                </button>
                <button
                  className="close-detail-btn"
                  onClick={() => setSelectedRequest(null)}
                >
                  <span className="btn-icon">👁️</span>
                  <span className="btn-text">Solo Ver</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showPaymentHistory && selectedLoanForHistory && (
        <PaymentHistoryModal
          loan={selectedLoanForHistory}
          member={(members || []).find(m => m.id === selectedLoanForHistory.memberId)}
          onClose={() => {
            setShowPaymentHistory(false);
            setSelectedLoanForHistory(null);
          }}
        />
      )}

      {/* Modal de Registro de Pago */}
      {showPaymentModal && selectedLoanForPayment && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h3>💵 Registrar Pago - {selectedLoanForPayment.memberName}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedLoanForPayment(null);
                }}
              >
                ✖
              </button>
            </div>
            <div className="modal-content">
              <div className="payment-info">
                <div className="info-row">
                  <span className="label">Monto del préstamo:</span>
                  <span className="value">S/ {selectedLoanForPayment.originalAmount.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="label">Saldo pendiente:</span>
                  <span className="value">S/ {selectedLoanForPayment.remainingAmount.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="label">Pago semanal:</span>
                  <span className="value">S/ {(selectedLoanForPayment.weeklyPayment || selectedLoanForPayment.monthlyPayment).toLocaleString()}</span>
                </div>
                {selectedLoanForPayment.status === 'overdue' && (
                  <div className="info-row late-info">
                    <span className="label">Pago con mora:</span>
                    <span className="value">S/ {calculateAmountWithLateFee(selectedLoanForPayment).toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const amount = e.target.amount.value;
                const date = e.target.date.value;
                if (amount && parseFloat(amount) > 0) {
                  registerPayment(selectedLoanForPayment.id, amount, date);
                  setShowPaymentModal(false);
                  setSelectedLoanForPayment(null);
                }
              }}>
                <div className="form-group">
                  <label>Monto del pago:</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    defaultValue={selectedLoanForPayment.status === 'overdue' ? 
                      calculateAmountWithLateFee(selectedLoanForPayment) : 
                      (selectedLoanForPayment.weeklyPayment || selectedLoanForPayment.monthlyPayment)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Fecha del pago:</label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="submit" className="confirm-btn">
                    ✅ Registrar Pago
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedLoanForPayment(null);
                    }}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Modificación de Fecha */}
      {showDateModal && selectedLoanForDate && (
        <div className="modal-overlay">
          <div className="date-modal">
            <div className="modal-header">
              <h3>📅 Modificar Fecha de Vencimiento - {selectedLoanForDate.memberName}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowDateModal(false);
                  setSelectedLoanForDate(null);
                }}
              >
                ✖
              </button>
            </div>
            <div className="modal-content">
              <div className="date-info">
                <div className="info-row">
                  <span className="label">Fecha actual de vencimiento:</span>
                  <span className="value">{new Date(selectedLoanForDate.dueDate).toLocaleDateString('es-ES')}</span>
                </div>
                <div className="info-row">
                  <span className="label">Estado actual:</span>
                  <span className={`value status-${selectedLoanForDate.status}`}>
                    {selectedLoanForDate.status === 'current' && '🟢 Al día'}
                    {selectedLoanForDate.status === 'overdue' && '🔴 Vencido'}
                    {selectedLoanForDate.status === 'late' && '🟡 Atrasado'}
                  </span>
                </div>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const newDate = e.target.newDate.value;
                if (newDate) {
                  modifyLoanTerms(selectedLoanForDate.id, { dueDate: newDate });
                  setShowDateModal(false);
                  setSelectedLoanForDate(null);
                }
              }}>
                <div className="form-group">
                  <label>Nueva fecha de vencimiento:</label>
                  <input
                    type="date"
                    name="newDate"
                    defaultValue={selectedLoanForDate.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <small className="help-text">Formato: día/mes/año</small>
                </div>
                
                <div className="modal-actions">
                  <button type="submit" className="confirm-btn">
                    ✅ Actualizar Fecha
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => {
                      setShowDateModal(false);
                      setSelectedLoanForDate(null);
                    }}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Modal de Rechazo */}
      {showRejectionModal && requestToReject && (
        <div className="modal-overlay">
          <div className="rejection-modal">
            <div className="modal-header">
              <h3>❌ Rechazar Solicitud de Préstamo</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowRejectionModal(false);
                  setRequestToReject(null);
                  setRejectionReason('');
                }}
              >
                ✖
              </button>
            </div>
            
            <div className="modal-content">
              <div className="rejection-info">
                <div className="rejection-header">
                  <div className="rejection-icon">⚠️</div>
                  <div className="rejection-details">
                    <h4>¿Está seguro de rechazar esta solicitud?</h4>
                    <p>
                      Solicitante: <strong>{requestToReject.memberName}</strong><br/>
                      Monto: <strong>S/ {(requestToReject.requestedAmount || 0).toLocaleString()}</strong><br/>
                      Plazo: <strong>{requestToReject.installments} semanas</strong>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="rejection-form">
                <div className="form-section">
                  <label className="rejection-label">
                    Motivo del rechazo (obligatorio - mínimo 10 caracteres)
                  </label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Escriba el motivo del rechazo (mínimo 10 caracteres)..."
                    className={`rejection-textarea required ${rejectionReason.trim().length < 10 ? 'invalid' : 'valid'}`}
                    rows="3"
                    required
                  />
                  <div className="character-counter">
                    <span className={rejectionReason.trim().length < 10 ? 'counter-invalid' : 'counter-valid'}>
                      {rejectionReason.trim().length}/10 caracteres mínimos
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="rejection-warning">
                <div className="warning-content">
                  <span className="warning-icon-small">⚠️</span>
                  <span className="warning-message">
                    Esta acción no se puede deshacer. El solicitante será notificado del rechazo.
                  </span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className={`confirm-reject-btn ${rejectionReason.trim().length < 10 ? 'disabled' : ''}`}
                disabled={rejectionReason.trim().length < 10}
                onClick={async () => {
                  if (rejectionReason.trim().length < 10) {
                    alert('El motivo del rechazo debe tener al menos 10 caracteres');
                    return;
                  }
                  
                  try {
                    await handleRejectRequest(requestToReject.id, rejectionReason);
                    setShowRejectionModal(false);
                    setRequestToReject(null);
                    setRejectionReason('');
                    setSuccessMessage(`Solicitud de préstamo rechazada para ${requestToReject.memberName}`);
                    setSuccessType('rejected');
                    setShowSuccessModal(true);
                  } catch (error) {
                    // El error ya se maneja en handleRejectRequest
                    console.error('Error en el rechazo:', error);
                  }
                }}
              >
                <span className="btn-icon">❌</span>
                <span className="btn-text">
                  {rejectionReason.trim().length < 10 ? 'Motivo requerido' : 'Confirmar Rechazo'}
                </span>
              </button>
              <button 
                className="cancel-reject-btn"
                onClick={() => {
                  setShowRejectionModal(false);
                  setRequestToReject(null);
                  setRejectionReason('');
                }}
              >
                <span className="btn-icon">↩️</span>
                <span className="btn-text">Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-content">
              <div className="success-icon">
                {successType === 'approved' ? '✅' : '❌'}
              </div>
              <h3 className="success-title">
                {successType === 'approved' ? 'Solicitud Aprobada' : 'Solicitud Rechazada'}
              </h3>
              <p className="success-message">{successMessage}</p>
              <button 
                className="success-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                  setSuccessType('');
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;