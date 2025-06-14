import React, { useState } from 'react';
import './Dashboard.css';
import LoansTable from './LoansTable';
import LoanRequest from './LoanRequest';
import MembersTable from './MembersTable';
import AdminPanel from './AdminPanel';
import Reports from './Reports';
import Settings from './Settings';
import Calendar from './Calendar';
import SavingsPlan from './SavingsPlan';
import TestComponent from './TestComponent';

const MemberLoansSection = ({ userLoans, getStatusInfo, formatCurrency }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all'); // all, recent, overdue
  const itemsPerPage = 5;

  const getFilteredLoans = () => {
    let filtered = [...userLoans];
    
    if (dateFilter === 'recent') {
      // Préstamos de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(loan => new Date(loan.startDate || loan.requestDate) >= thirtyDaysAgo);
    } else if (dateFilter === 'overdue') {
      // Solo préstamos vencidos
      filtered = filtered.filter(loan => {
        const statusInfo = getStatusInfo(loan);
        return statusInfo.class === 'overdue';
      });
    } else if (dateFilter === 'current') {
      // Solo préstamos al día
      filtered = filtered.filter(loan => {
        const statusInfo = getStatusInfo(loan);
        return statusInfo.class === 'current' || statusInfo.class === 'due-soon';
      });
    }
    
    return filtered;
  };

  const filteredLoans = getFilteredLoans();
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLoans = filteredLoans.slice(startIndex, startIndex + itemsPerPage);

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
    
    const dayOfWeek = d.getDay();
    const nextDate = new Date(d);
    let daysToAdd;
    
    // Calcular días hasta el próximo miércoles
    if (dayOfWeek < 3) {
      // Domingo (0), Lunes (1), Martes (2): calcular días hasta el miércoles
      daysToAdd = 3 - dayOfWeek;
    } else if (dayOfWeek === 3) {
      // Si es miércoles, ir al siguiente miércoles (7 días)
      daysToAdd = 7;
    } else {
      // Jueves (4), Viernes (5), Sábado (6): calcular días hasta el próximo miércoles
      daysToAdd = 10 - dayOfWeek;
    }
    
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  };

  return (
    <>
      <div className="loans-header" style={{background:"#ffffff"}}>
        <h3>Filtrar Préstamos</h3>
        <div className="loans-filters">
          <select 
            value={dateFilter} 
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="date-filter"
          >
            <option value="all">📋 Todos los préstamos</option>
            <option value="recent">📅 Recientes (30 días)</option>
            <option value="overdue">⚠️ Vencidos</option>
            <option value="current">✅ Al día</option>
          </select>
        </div>
      </div>

      {currentLoans.length > 0 ? (
        <>
          <div className="loans-summary">
            {currentLoans.map(loan => {
              const progress = ((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100;
              const statusInfo = getStatusInfo(loan);
              const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
              
              return (
                <div key={loan.id} className="loan-summary-item">
                  <div className="loan-header">
                    <div className="loan-amount">
                      <span className="label">Monto original:</span>
                      <span className="value">S/ {formatCurrency(loan?.originalAmount || 0)}</span>
                    </div>
                    <div className={`status-indicator ${statusInfo.class}`}>
                      {statusInfo.icon} {statusInfo.label}
                    </div>
                  </div>
                  
                  <div className="loan-details">
                    <div className="detail-row">
                      <span className="label">Saldo pendiente:</span>
                      <span className="value">S/ {formatCurrency(loan?.remainingAmount || 0)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Pago semanal:</span>
                      <span className="value">S/ {Math.ceil(weeklyPayment)}</span>
                    </div>
                    {statusInfo.class === 'overdue' && (
                      <div className="detail-row overdue">
                        <span className="label">Total con mora:</span>
                        <span className="value">S/ {Math.ceil(weeklyPayment * 1.05)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="loan-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-info">
                      <span className="progress-text">{progress.toFixed(1)}% pagado</span>
                      <span className="weeks-text">
                        Semana {loan.currentWeek || loan.currentInstallment} de {loan.totalWeeks || loan.installments}
                      </span>
                    </div>
                  </div>
                  
                  <div className="next-payment-info">
                    <div className="payment-date">
                      <span className="label">Próximo pago: </span>
                      <span className="value">
                        {new Date(loan.dueDate).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="loans-pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {currentPage} de {totalPages} ({filteredLoans.length} préstamos)
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-data">
          {dateFilter === 'overdue' ? 'No tienes préstamos vencidos' : 
           dateFilter === 'recent' ? 'No tienes préstamos recientes' : 
           dateFilter === 'current' ? 'No tienes préstamos al día' :
           'No tienes préstamos activos'}
        </div>
      )}
    </>
  );
};

const MemberNotificationsSection = ({ userNotifications, formatCurrency }) => {
  const [notificationFilter, setNotificationFilter] = useState('all');
  
  const getFilteredNotifications = () => {
    let filtered = [...userNotifications];
    
    if (notificationFilter === 'approved') {
      filtered = filtered.filter(notification => notification.type === 'approved');
    } else if (notificationFilter === 'rejected') {
      filtered = filtered.filter(notification => notification.type === 'rejected');
    }
    
    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <>
      <div className="notifications-header">
        <h3>🔔 Notificaciones</h3>
        <div className="notifications-filters">
          <select 
            value={notificationFilter} 
            onChange={(e) => setNotificationFilter(e.target.value)}
            className="notification-filter"
          >
            <option value="all">📋 Todas</option>
            <option value="approved">✅ Aprobadas</option>
            <option value="rejected">❌ Rechazadas</option>
          </select>
        </div>
      </div>

      {filteredNotifications.length > 0 ? (
        <div className="notifications-list">
          {filteredNotifications.map(notification => (
            <div key={notification.id} className={`notification-item ${notification.type}`}>
              <div className="notification-header">
                <div className="notification-status">
                  {notification.type === 'approved' && (
                    <span className="status-badge approved">✅ Solicitud Aprobada</span>
                  )}
                  {notification.type === 'rejected' && (
                    <span className="status-badge rejected">❌ Solicitud Rechazada</span>
                  )}
                </div>
                <div className="notification-date">
                  {new Date(notification.date).toLocaleDateString('es-ES')}
                </div>
              </div>
              
              <div className="notification-content">
                <div className="notification-message">{notification.message}</div>
                
                {notification.type === 'approved' && (
                  <div className="approval-details">
                    <div className="details-grid">
                      <div className="detail-card">
                        <div className="detail-icon">💰</div>
                        <div className="detail-info">
                          <span className="detail-label">Monto</span>
                          <span className="detail-value">S/ {formatCurrency(notification.amount || 0)}</span>
                        </div>
                      </div>
                      
                      <div className="detail-card">
                        <div className="detail-icon">📅</div>
                        <div className="detail-info">
                          <span className="detail-label">Plazo</span>
                          <span className="detail-value">{notification.totalWeeks || notification.installments} semanas</span>
                        </div>
                      </div>
                      
                      <div className="detail-card">
                        <div className="detail-icon">💳</div>
                        <div className="detail-info">
                          <span className="detail-label">Pago Semanal</span>
                          <span className="detail-value">S/ {formatCurrency(notification.weeklyPayment || notification.monthlyPayment || 0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="success-alert">
                      <div className="alert-icon">🎉</div>
                      <div className="alert-content">
                        <strong>¡Felicidades!</strong> Tu préstamo será procesado el próximo miércoles (día de operaciones).
                      </div>
                    </div>
                  </div>
                )}
                
                {notification.type === 'rejected' && notification.reason && (
                  <div className="rejection-details">
                    <div className="rejection-reason">
                      <div className="reason-icon">📝</div>
                      <div className="reason-content">
                        <span className="reason-label">Motivo del rechazo:</span>
                        <span className="reason-text">{notification.reason}</span>
                      </div>
                    </div>
                    
                    <div className="info-alert">
                      <div className="alert-icon">💡</div>
                      <div className="alert-content">
                        Puedes realizar una nueva solicitud después de mejorar tu situación crediticia.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">
          {notificationFilter === 'approved' ? 'No tienes solicitudes aprobadas' : 
           notificationFilter === 'rejected' ? 'No tienes solicitudes rechazadas' : 
           'No tienes notificaciones nuevas'}
        </div>
      )}
    </>
  );
};

const Dashboard = ({ 
  user, 
  loans, 
  setLoans, 
  loanRequests, 
  setLoanRequests, 
  members,
  setMembers,
  settings, 
  setSettings,
  calculateTotalCapital,
  calculateAvailableCapital,
  getBankingStatistics,
  getMonthlyInterestRate,
  calculateLateFee,
  getPaymentWithLateFee,
  users,
  setUsers 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);

  // Función helper para formatear números correctamente
  const formatCurrency = (value) => {
    // Limpiar el valor primero si es string con caracteres extraños
    let cleanValue = value;
    if (typeof value === 'string') {
      cleanValue = value.replace(/[^0-9.-]/g, '');
    }
    
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return '0.00';
    
    // Formatear con separadores de miles y 2 decimales
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getOverdueLoans = () => {
    const today = new Date();
    return loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      return dueDate < today && loan.status !== 'paid';
    });
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      return dueDate >= today && dueDate <= nextWeek && loan.status !== 'paid';
    });
  };

  const getUserMember = () => {
    if (user.role === 'member' && user.memberId && members) {
      const member = members.find(member => member.id === user.memberId);
      console.log('🔍 getUserMember - Buscando miembro con ID:', user.memberId);
      console.log('🔍 getUserMember - Miembros disponibles:', members.length);
      console.log('🔍 getUserMember - Miembro encontrado:', member);
      return member || null;
    }
    return null;
  };

  const getUserLoans = () => {
    if (user.role === 'member' && user.memberId) {
      // Solo préstamos realmente activos (excluir solicitudes pendientes y rechazadas)
      const userActiveLoans = loans.filter(loan => 
        loan.memberId === user.memberId && 
        loan.status !== 'Por aprobar' && 
        loan.status !== 'Rechazada'
      );
      
      // DATOS PARA DASHBOARD
      const dashboardData = userActiveLoans.map(loan => ({
        seccion: 'DASHBOARD',
        nombre: loan.memberName,
        fechaVencimiento: loan.dueDate,
        montoOriginal: loan.originalAmount,
        montoPendiente: loan.remainingAmount,
        estado: loan.status,
        semanaActual: loan.currentWeek || loan.currentInstallment,
        totalSemanas: loan.totalWeeks || loan.installments
      }));
      
      // Guardar en window para comparación
      window.dashboardLoansData = dashboardData;
      
      return userActiveLoans;
    }
    return [];
  };

  const getAllUserLoans = () => {
    if (user.role === 'member' && user.memberId) {
      // Todos los préstamos del usuario (incluyendo solicitudes pendientes)
      return loans.filter(loan => loan.memberId === user.memberId);
    }
    return [];
  };

  const getUserNotifications = () => {
    if (user.role !== 'member' || !user.memberId) return [];
    
    const userRequests = loanRequests
      .filter(request => request.memberId === user.memberId)
      .filter(request => request.status === 'approved' || request.status === 'rejected');
    
    console.log('🔍 User notifications - requests:', userRequests);
    
    return userRequests.map(request => ({
        id: request.id,
        type: request.status,
        title: request.status === 'approved' ? '✅ Solicitud Aprobada' : '❌ Solicitud Rechazada',
        message: request.status === 'approved' 
          ? `Tu solicitud de préstamo por S/ ${formatCurrency(request?.requestedAmount || 0)} ha sido aprobada.`
          : `Tu solicitud de préstamo por S/ ${formatCurrency(request?.requestedAmount || 0)} ha sido rechazada.`,
        amount: request.requestedAmount,
        date: request.status === 'approved' ? request.approvalDate : request.rejectionDate,
        reason: request.rejectionReason || null,
        installments: request.installments,
        monthlyPayment: request.monthlyPayment,
        weeklyPayment: request.weeklyPayment,
        totalWeeks: request.totalWeeks
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Función para calcular el próximo miércoles
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
    let daysToAdd;
    
    // Calcular días hasta el próximo miércoles
    if (dayOfWeek < 3) {
      // Domingo (0), Lunes (1), Martes (2): calcular días hasta el miércoles
      daysToAdd = 3 - dayOfWeek;
    } else if (dayOfWeek === 3) {
      // Si es miércoles, ir al siguiente miércoles (7 días)
      daysToAdd = 7;
    } else {
      // Jueves (4), Viernes (5), Sábado (6): calcular días hasta el próximo miércoles
      daysToAdd = 10 - dayOfWeek;
    }
    
    const nextWednesday = new Date(d);
    nextWednesday.setDate(d.getDate() + daysToAdd);
    return nextWednesday;
  };

  const getStatusInfo = (loan) => {
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const daysDiff = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

    if (loan.status === 'paid') {
      return { label: 'Pagado', class: 'paid', icon: '●' };
    } else if (daysDiff < 0) {
      return { label: `Vencido (${Math.abs(daysDiff)} días)`, class: 'overdue', icon: '●' };
    } else if (daysDiff <= 3) {
      return { label: `Vence en ${daysDiff} días`, class: 'due-soon', icon: '●' };
    } else {
      return { label: 'Al día', class: 'current', icon: '●' };
    }
  };

  const renderDashboardContent = () => {
    const rawBankingStats = getBankingStatistics ? getBankingStatistics() : {
      totalCapital: calculateTotalCapital ? calculateTotalCapital() : 0,
      availableCapital: calculateAvailableCapital ? calculateAvailableCapital() : 0,
      capitalUtilization: 0,
      totalShares: 0,
      memberCount: members ? members.length : 0
    };
    
    console.log('🔍 DEBUG Dashboard - rawBankingStats:', rawBankingStats);
    
    // Validar y limpiar los valores numéricos
    const bankingStats = {
      ...rawBankingStats,
      totalCapital: Number(String(rawBankingStats.totalCapital).replace(/[^0-9.-]/g, '')) || 0,
      availableCapital: Number(String(rawBankingStats.availableCapital).replace(/[^0-9.-]/g, '')) || 0,
      baseCapital: Number(String(rawBankingStats.baseCapital).replace(/[^0-9.-]/g, '')) || 0,
      loanedCapital: Number(String(rawBankingStats.loanedCapital).replace(/[^0-9.-]/g, '')) || 0,
      capitalUtilization: Number(String(rawBankingStats.capitalUtilization).replace(/[^0-9.-]/g, '')) || 0,
      profitMargin: Number(String(rawBankingStats.profitMargin).replace(/[^0-9.-]/g, '')) || 0
    };
    
    const totalCapital = bankingStats.totalCapital;
    const availableCapital = bankingStats.availableCapital;
    
    const overdueLoans = getOverdueLoans();
    const upcomingPayments = getUpcomingPayments();
    const userMember = getUserMember();
    const userLoans = getUserLoans();
    const userNotifications = getUserNotifications();

    return (
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>
            {user.role === 'admin' && '📊 Dashboard Administrativo'}
            {user.role === 'member' && '👤 Mi Dashboard'}
            {user.role === 'external' && '🌐 Portal Cliente Externo'}
          </h2>
          <div className="current-date">
            📅 {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className={`stats-grid ${user.role === 'external' ? 'external-grid' : ''}`}>
          {user.role === 'admin' && (
            <>
              <div className="stat-card total">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Capital Total</h3>
                  <div className="stat-value">S/ {formatCurrency(totalCapital)}</div>
                  <div className="stat-subtitle">
                    Base: S/ {formatCurrency(bankingStats.baseCapital)}
                  </div>
                  <div className="stat-detail">
                    <div style={{ marginTop: '4px', fontWeight: 'bold', color: '#27ae60' }}>
                      📈 Rentabilidad: {formatCurrency(bankingStats.profitMargin)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card available">
                <div className="stat-icon">💵</div>
                <div className="stat-content">
                  <h3>Capital Disponible</h3>
                  <div className="stat-value">S/ {formatCurrency(availableCapital)}</div>
                  <div className="stat-subtitle">
                    {formatCurrency(bankingStats.capitalUtilization)}% en préstamos
                  </div>
                  <div className="stat-detail">
                    Prestado: S/ {formatCurrency(bankingStats.loanedCapital)}
                  </div>
                </div>
              </div>

              <div className="stat-card loans">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>Préstamos Activos</h3>
                  <div className="stat-value">{loans.filter(loan => loan.status !== 'paid').length}</div>
                  <div className="stat-subtitle">
                    S/ {formatCurrency(bankingStats.loanedCapital)} pendiente
                  </div>
                </div>
              </div>

              <div className="stat-card alerts">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <h3>Alertas</h3>
                  <div className="stat-value">{overdueLoans.length}</div>
                  <div className="stat-subtitle">préstamos vencidos</div>
                </div>
              </div>
            </>
          )}

          {user.role === 'member' && userMember && (
            <>
              <div className="stat-card member-info">
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <h3>Mi Información</h3>
                  <div className="stat-value">{userMember.name}</div>
                  <div className="stat-subtitle">
                    Calificación: <span className={`credit-rating ${userMember.creditRating}`}>
                      {userMember.creditRating === 'green' && '🟢'}
                      {userMember.creditRating === 'yellow' && '🟡'}
                      {userMember.creditRating === 'red' && '🔴'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card guarantee">
                <div className="stat-icon">🏛️</div>
                <div className="stat-content">
                  <h3>Mi Garantía</h3>
                  <div className="stat-value">S/ {formatCurrency((userMember?.shares || 0) * (settings?.shareValue || 500))}</div>
                  <div className="stat-subtitle">{userMember?.shares || 0} acciones</div>
                </div>
              </div>

              <div className="stat-card my-loans">
                <div className="stat-icon">💳</div>
                <div className="stat-content">
                  <h3>Mis Préstamos</h3>
                  <div className="stat-value">{userLoans.filter(loan => loan.status !== 'paid').length}</div>
                  <div className="stat-subtitle">
                    S/ {formatCurrency(userLoans.filter(loan => loan.status !== 'paid').reduce((sum, loan) => sum + parseFloat(loan.remainingAmount || 0), 0))} pendiente
                  </div>
                </div>
              </div>

              <div className="stat-card limit">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Límite Disponible</h3>
                  <div className="stat-value">
                    S/ {formatCurrency(Math.max(0, 
                      Math.min(
                        settings?.loanLimits?.individual || 8000, 
                        ((userMember?.shares || 0) * (settings?.shareValue || 500)) * 0.8
                      ) - userLoans.filter(loan => 
                        loan.status !== 'paid' && 
                        loan.status !== 'Rechazada' && 
                        loan.status !== 'Por aprobar'
                      ).reduce((sum, loan) => sum + parseFloat(loan.remainingAmount || 0), 0)
                    ))}
                  </div>
                  <div className="stat-subtitle">límite de préstamo</div>
                </div>
              </div>
            </>
          )}

          {user.role === 'external' && (
            <>
              <div className="stat-card external-info">
                <div className="stat-icon">🏛️</div>
                <div className="stat-content">
                  <h3>Sistema Banquito</h3>
                  <div className="stat-value">Préstamos Asociativos</div>
                  <div className="stat-subtitle">Información pública</div>
                </div>
              </div>

              <div className="stat-card rates">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Tasas de Interés</h3>
                  <div className="stat-value">{settings?.monthlyInterestRates?.high || 3}% - {settings?.monthlyInterestRates?.low || 10}%</div>
                  <div className="stat-subtitle">mensual según calificación</div>
                </div>
              </div>

              <div className="stat-card guarantee">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Valor de Acciones</h3>
                  <div className="stat-value">S/ {settings?.shareValue || 500}</div>
                  <div className="stat-subtitle">por acción</div>
                </div>
              </div>

              <div className="stat-card limit">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Límite Máximo</h3>
                  <div className="stat-value">S/ {settings?.loanLimits?.maxAmount || 8000}</div>
                  <div className="stat-subtitle">por préstamo</div>
                </div>
              </div>

              <div className="stat-card savings">
                <div className="stat-icon">🏦</div>
                <div className="stat-content">
                  <h3>Plan de Ahorro</h3>
                  <div className="stat-value">2.00% TEA</div>
                  <div className="stat-subtitle">tasa efectiva anual</div>
                </div>
              </div>

              <div className="stat-card operation">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>Día de Operaciones</h3>
                  <div className="stat-value">Miércoles</div>
                  <div className="stat-subtitle">pagos y desembolsos</div>
                </div>
              </div>
            </>
          )}
        </div>

        {user.role === 'admin' && (
          <div className="dashboard-sections">
            <div className="section upcoming-payments">
              <h3>🗓️ Próximos Vencimientos (7 días)</h3>
              {upcomingPayments.length > 0 ? (
                <div className="payments-list">
                  {upcomingPayments.map(loan => (
                    <div key={loan.id} className="payment-item">
                      <div className="payment-member">{loan.memberName}</div>
                      <div className="payment-amount">S/ {formatCurrency(loan.weeklyPayment || loan.monthlyPayment || 0)}</div>
                      <div className="payment-date">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No hay pagos próximos en los siguientes 7 días</div>
              )}
            </div>

            <div className="section overdue-loans">
              <h3>⚠️ Préstamos Vencidos</h3>
              {overdueLoans.length > 0 ? (
                <div className="overdue-list">
                  {overdueLoans.map(loan => (
                    <div key={loan.id} className="overdue-item">
                      <div className="overdue-member">{loan.memberName}</div>
                      <div className="overdue-amount">S/ {formatCurrency(loan.weeklyPayment || loan.monthlyPayment || 0)}</div>
                      <div className="overdue-days">
                        {Math.floor((new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))} días
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">✅ No hay préstamos vencidos</div>
              )}
            </div>
          </div>
        )}

        {user.role === 'member' && (
          <div className="dashboard-sections-member">
            <div className="loans-column">
              <div className="section my-loans-detail">
                <h3>💳 Mis Préstamos Activos</h3>
                <MemberLoansSection 
                  userLoans={userLoans} 
                  getStatusInfo={getStatusInfo}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>

            <div className="notifications-column">
              {/* Sección de Notificaciones para Miembros */}
              <div className="section member-notifications">
                <MemberNotificationsSection 
                  userNotifications={userNotifications}
                  formatCurrency={formatCurrency}
                />
              </div>

              {/* Sección de Plan de Ahorro para Miembros */}
              <div className="section member-savings-plan">
                <h3>💰 Mi Plan de Ahorro a Plazo Fijo</h3>
                <div className="savings-plan-info">
                  <p className="savings-intro">
                    Haz crecer tu garantía con nuestro plan de ahorro a plazo fijo con una TEA del 2%
                  </p>
                  <button 
                    className="view-savings-plan-btn"
                    onClick={() => {
                      console.log('🔍 Botón Plan de Ahorro clickeado');
                      console.log('🔍 Usuario actual:', user);
                      console.log('🔍 Miembro actual:', getUserMember());
                      console.log('🔍 Cambiando activeTab a: savings');
                      setActiveTab('savings');
                    }}
                  >
                    Ver Plan de Ahorro
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role === 'external' && (
          <div className="dashboard-sections-external">
            <div className="section external-info">
              <h3>🏛️ ¿Cómo funciona nuestro Banquito?</h3>
              <div className="info-content">
                <div className="info-card">
                  <h4>💰 Sistema de Garantías</h4>
                  <p>Los miembros aportan acciones de S/ {settings?.shareValue || 500} cada una como garantía. Pueden solicitar préstamos hasta el 80% del valor de sus acciones.</p>
                </div>
                <div className="info-card">
                  <h4>📊 Calificación Crediticia</h4>
                  <p>
                    <span className="rating-green">🟢 Excelente:</span> {settings?.monthlyInterestRates?.high || 3}% mensual<br/>
                    <span className="rating-yellow">🟡 Buena:</span> {settings?.monthlyInterestRates?.medium || 5}% mensual<br/>
                    <span className="rating-red">🔴 Regular:</span> {settings?.monthlyInterestRates?.low || 10}% mensual
                  </p>
                </div>
                <div className="info-card">
                  <h4>📅 Proceso de Préstamos</h4>
                  <p>Las solicitudes se procesan y desembolsan los miércoles (día de operaciones). Los pagos también se reciben los miércoles de cada semana.</p>
                </div>
                <div className="info-card">
                  <h4>🏦 Plan de Ahorro Fijo</h4>
                  <p>Ofrecemos planes de ahorro a plazo fijo de 90, 180 o 365 días con una TEA del 2.00%. El dinero es externo al capital del grupo.</p>
                </div>
              </div>
            </div>

            <div className="section external-calculator">
              <h3>🧮 Simulador de Préstamos</h3>
              <div className="calculator-content">
                <div className="calculator-example">
                  <h4>Ejemplo de Préstamo:</h4>
                  <div className="example-data">
                    <div className="example-row">
                      <span>Monto solicitado:</span>
                      <span>S/ 3,000</span>
                    </div>
                    <div className="example-row">
                      <span>Plazo:</span>
                      <span>12 semanas</span>
                    </div>
                    <div className="example-row">
                      <span>Tasa (calificación buena):</span>
                      <span>{settings?.monthlyInterestRates?.medium || 5}% mensual</span>
                    </div>
                    <div className="example-row highlight">
                      <span>Pago semanal aproximado:</span>
                      <span>S/ 275</span>
                    </div>
                    <div className="example-row">
                      <span>Total a pagar:</span>
                      <span>S/ 3,300</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section external-requirements">
              <h3>📋 Requisitos para ser Miembro</h3>
              <div className="requirements-content">
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span>Aportar mínimo 1 acción (S/ {settings?.shareValue || 500})</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span>Compromiso con los pagos semanales</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span>Participación en reuniones del grupo</span>
                </div>
                <div className="requirement-item">
                  <span className="requirement-icon">✅</span>
                  <span>Documentos de identidad válidos</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    const userMember = getUserMember();
    
    console.log('🔍 renderTabContent - activeTab:', activeTab);
    console.log('🔍 renderTabContent - userMember:', userMember);
    console.log('🔍 renderTabContent - user.role:', user.role);
    
    switch(activeTab) {
      case 'dashboard':
        return renderDashboardContent();
      case 'loans':
        return <LoansTable 
          loans={user.role === 'member' ? getUserLoans() : loans}
          setLoans={setLoans}
          userRole={user.role}
          currentUser={user}
          calculateLateFee={calculateLateFee}
          getPaymentWithLateFee={getPaymentWithLateFee}
        />;
      case 'request':
        return <LoanRequest 
          user={user}
          members={members}
          loans={loans}
          setLoans={setLoans}
          settings={settings}
          getMonthlyInterestRate={getMonthlyInterestRate}
          calculateAvailableCapital={calculateAvailableCapital}
          loanRequests={loanRequests}
          setLoanRequests={setLoanRequests}
          darkMode={darkMode}
        />;
      case 'members':
        return <MembersTable 
          members={members}
          setMembers={setMembers}
          settings={settings}
          darkMode={darkMode}
        />;
      case 'admin':
        return <AdminPanel 
          loanRequests={loanRequests}
          setLoanRequests={setLoanRequests}
          loans={loans}
          setLoans={setLoans}
          members={members}
          setMembers={setMembers}
          settings={settings}
          getPaymentWithLateFee={getPaymentWithLateFee}
        />;
      case 'reports':
        return <Reports loans={loans} members={members} darkMode={darkMode} />;
      case 'settings':
        return <Settings 
          settings={settings} 
          setSettings={setSettings} 
          loans={loans} 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />;
      case 'calendar':
        return <Calendar 
          loans={loans} 
          loanRequests={loanRequests}
          members={members}
          onUpdateLoan={setLoans}
          onUpdateLoanRequest={setLoanRequests}
          currentUser={user}
          darkMode={darkMode}
          settings={settings}
        />;
      case 'savings':
        console.log('💰 CASE SAVINGS - Evaluando condiciones:');
        console.log('💰 user.role === member:', user.role === 'member');
        console.log('💰 userMember exists:', !!userMember);
        console.log('💰 userMember data:', userMember);
        
        if (user.role === 'member' && userMember) {
          console.log('🔥 RENDERIZANDO SAVINGS PLAN');
          return <SavingsPlan 
            memberName={userMember.name}
            memberId={user.memberId}
            memberData={userMember}
            settings={settings}
            onSavingsUpdate={(savingsData) => {
              console.log('Nuevo plan de ahorro:', savingsData);
              // Aquí se podría guardar en el estado si es necesario
            }}
          />;
        }
        console.log('⚠️ NO se cumplen condiciones, renderizando dashboard');
        return renderDashboardContent();
      default:
        return renderDashboardContent();
    }
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
      {user.role !== 'external' && (
        <div className="dashboard-tabs">
        {(user.role === 'admin' || user.role === 'member') && (
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
        )}
        
        {(user.role === 'admin' || user.role === 'member') && (
          <button 
            className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            💰 Préstamos
          </button>
        )}
        
        {user.role === 'member' && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              📝 Solicitar
            </button>
            <button 
              className={`tab-btn ${activeTab === 'savings' ? 'active' : ''}`}
              onClick={() => setActiveTab('savings')}
            >
              💰 Plan de Ahorro
            </button>
          </>
        )}
        
        {(user.role === 'admin' || user.role === 'member') && (
          <button 
            className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            📅 Calendario
          </button>
        )}
        
        {user.role === 'admin' && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              👥 Miembros
            </button>
            <button 
              className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              ⚙️ Gestión
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              📈 Reportes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              🔧 Configuración
            </button>
          </>
        )}
        </div>
      )}

      <div className={`dashboard-main ${darkMode ? 'dark' : ''}`}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;