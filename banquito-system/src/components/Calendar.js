import React, { useState, useEffect } from 'react';
import { formatLocalDate } from '../utils/dateUtils';
import './Calendar.css';

const Calendar = ({ loans, members, loanRequests, onUpdateLoan, onUpdateLoanRequest, currentUser, darkMode, settings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState('payments');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Forzar actualización cuando cambian las solicitudes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [loanRequests]);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Función para verificar si es día de operaciones (miércoles)
  const isOperationDay = (date = new Date()) => {
    const operationDay = settings?.operationDay || 'wednesday';
    const dayOfWeek = date.getDay(); // 0=Domingo, 3=Miércoles
    
    switch(operationDay) {
      case 'wednesday':
        return dayOfWeek === 3;
      case 'monday':
        return dayOfWeek === 1;
      case 'friday':
        return dayOfWeek === 5;
      default:
        return dayOfWeek === 3; // Por defecto miércoles
    }
  };


  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = formatLocalDate(date);
    const events = [];

    // Filtrar préstamos según el rol del usuario (igual que Dashboard)
    const filteredLoans = currentUser.role === 'member' && currentUser.memberId
      ? loans.filter(loan => 
          loan.memberId === currentUser.memberId && 
          loan.status !== 'Por aprobar' && 
          loan.status !== 'Rechazada'
        )
      : loans;


    // DATOS PARA CALENDARIO
    if (date.getDate() === new Date().getDate() && activeView === 'payments') {
      const calendarioData = filteredLoans.map(loan => ({
        seccion: 'CALENDARIO',
        nombre: loan.memberName,
        fechaVencimiento: loan.dueDate,
        montoOriginal: loan.originalAmount,
        montoPendiente: loan.remainingAmount,
        estado: loan.status,
        semanaActual: loan.currentWeek || loan.currentInstallment,
        totalSemanas: loan.totalWeeks || loan.installments
      }));
      
    }

    if (activeView === 'payments') {
      // Eventos de pagos y vencimientos
      filteredLoans.forEach(loan => {
        // Si el préstamo tiene cronograma de pagos, usar esas fechas
        if (loan.paymentSchedule && loan.paymentSchedule.length > 0) {
          // Revisar TODOS los pagos del cronograma, no solo el próximo
          loan.paymentSchedule.forEach(payment => {
            if (!payment.dueDate) return;
            
            // Asegurar que ambas fechas están en formato YYYY-MM-DD
            const paymentDateStr = payment.dueDate.includes('T') ? payment.dueDate.split('T')[0] : payment.dueDate;
            
            if (paymentDateStr === dateStr) {
              // NUEVA LÓGICA: Verificar si esta cuota ya está cubierta por pagos realizados
              // Obtener todos los pagos realizados para este préstamo
              const allPayments = loan.paymentHistory || [];
              const backendPayments = loan._backend?.payments || [];
              
              // ⚠️ CORREGIDO: Evitar duplicación de pagos
              // Solo usar backendPayments si no hay allPayments, o viceversa
              const frontendTotal = allPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
              const backendTotal = backendPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
              
              // Usar el total más alto para evitar duplicación
              const totalPaid = Math.max(frontendTotal, backendTotal);
              
              // Obtener todas las cuotas del cronograma hasta esta fecha (ordenadas por fecha)
              const cuotasHastaAhora = loan.paymentSchedule
                ? loan.paymentSchedule
                    .filter(p => new Date(p.dueDate) <= new Date(paymentDateStr))
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                : [];
              
              // Calcular cuántas cuotas están cubiertas por los pagos realizados
              const montoPorCuota = payment.amount || payment.weeklyPayment || loan.weeklyPayment || 0;
              const cuotasCubiertas = Math.floor(totalPaid / montoPorCuota);
              
              // Si esta cuota está entre las cubiertas, NO mostrarla
              const numeroDeEstaCuota = cuotasHastaAhora.findIndex(p => p.dueDate === payment.dueDate) + 1;
              if (numeroDeEstaCuota <= cuotasCubiertas) {
                // ✅ CUOTA OCULTA CORRECTAMENTE
                return; // ⛔ NO MOSTRAR ESTA CUOTA (YA ESTÁ PAGADA)
              }
              
              const member = (members || []).find(m => m.id === loan.memberId);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              const paymentDate = new Date(payment.dueDate);
              if (isNaN(paymentDate.getTime())) {
                console.warn('⚠️ Fecha de pago inválida en cronograma:', loan.id, loan.memberName, payment.dueDate);
                return;
              }
              
              paymentDate.setHours(0, 0, 0, 0);
              const isOverdue = paymentDate < today;
              
              
              const eventAmount = parseFloat(payment.amount || payment.weeklyPayment || loan.weeklyPayment || 0);
              events.push({
                type: isOverdue ? 'payment_overdue' : 'payment',
                title: `${loan.memberName}`,
                amount: eventAmount,
                amountStr: `S/ ${eventAmount.toLocaleString()}`,
                detail: isOverdue ? `⚠️ VENCIDO - Semana #${payment.week}` : `Vencimiento semana #${payment.week}`,
                memberId: loan.memberId,
                loanId: loan.id,
                creditRating: member?.creditRating || 'unrated',
                isOverdue: isOverdue
              });
            }
          });
        } else {
          // Fallback: usar dueDate si no hay cronograma
          if (!loan.dueDate) {
            console.warn('⚠️ Préstamo sin fecha de vencimiento:', loan.id, loan.memberName);
            return;
          }
          
          const dueDate = new Date(loan.dueDate);
          if (isNaN(dueDate.getTime())) {
            console.warn('⚠️ Fecha de vencimiento inválida para préstamo:', loan.id, loan.memberName, loan.dueDate);
            return;
          }
          
          const dueDateStr = formatLocalDate(dueDate);
          
          if (dueDateStr === dateStr && loan.status !== 'paid' && 
              loan.status !== 'Por aprobar' && loan.status !== 'Rechazada') {
            
            // Verificar si ya existe un pago realizado para esta fecha
            const paymentAlreadyMade = loan.paymentHistory && loan.paymentHistory.some(historyPayment => {
              const historyDateStr = historyPayment.date?.includes('T') ? 
                historyPayment.date.split('T')[0] : historyPayment.date;
              return historyDateStr === dateStr;
            });
            
            // TAMBIÉN verificar en los datos originales del backend por si el mapeo falla
            const backendPaymentMade = loan._backend?.payments && loan._backend.payments.some(backendPayment => {
              const backendDateStr = backendPayment.payment_date?.includes('T') ? 
                backendPayment.payment_date.split('T')[0] : backendPayment.payment_date;
              return backendDateStr === dateStr;
            });
            
            // Si ya hay un pago realizado para esta fecha, no mostrar como pendiente
            if (paymentAlreadyMade || backendPaymentMade) {
              return;
            }
            
            const paymentAmount = parseFloat(loan.weeklyPayment || loan.monthlyPayment || 0);
            const currentWeek = loan.currentWeek || loan.currentInstallment || 1;
            const member = members && members.find(m => m.id === loan.memberId);
          
            
            events.push({
              type: 'payment',
              title: `${loan.memberName}`,
              amount: paymentAmount,
              amountStr: `S/ ${paymentAmount.toLocaleString()}`,
              detail: `Vencimiento semana #${currentWeek}`,
              memberId: loan.memberId,
              loanId: loan.id,
              creditRating: member?.creditRating || 'unrated'
            });
          }
        }

        // 💰 PAGOS REALIZADOS - MOSTRAR TODOS (sin deduplicar)
        // Solo usar los pagos del backend (son los reales de la base de datos)
        const backendPaymentsForLoan = loan._backend?.payments || [];
        
        // Mostrar TODOS los pagos del backend para esta fecha
        backendPaymentsForLoan.forEach(payment => {
          const paymentDate = payment.payment_date?.includes('T') ? 
            payment.payment_date.split('T')[0] : payment.payment_date;
            
          if (paymentDate === dateStr) {
            const member = members && members.find(m => m.id === loan.memberId);
            const paymentAmount = parseFloat(payment.amount) || 0;
            events.push({
              type: 'payment_made',
              title: `${loan.memberName}`,
              amount: paymentAmount,
              amountStr: `S/ ${paymentAmount.toLocaleString()}`,
              detail: 'Pago realizado',
              memberId: loan.memberId,
              loanId: loan.id,
              creditRating: member?.creditRating || 'unrated',
              timestamp: payment.created_at || payment.payment_date // Para distinguir pagos
            });
          }
        });
      });
    } else {
      // Eventos de solicitudes y desembolsos - SOLO PENDIENTES
      // Filtrar solicitudes según el rol del usuario
      const filteredRequests = currentUser.role === 'member' && currentUser.memberId
        ? loanRequests.filter(request => request.memberId === currentUser.memberId)
        : loanRequests;

      filteredRequests.forEach(request => {
        // Usar requiredDate en lugar de requestDate para mostrar el evento cuando se necesita el dinero
        const eventDate = request.requiredDate ? new Date(request.requiredDate) : new Date(request.requestDate);
        if (formatLocalDate(eventDate) === dateStr) {
          // SOLO mostrar solicitudes pendientes para poder aprobar/rechazar
          if (request.status === 'pending') {
            const requestAmount = parseFloat(request.requestedAmount) || 0;
            events.push({
              type: 'request',
              title: `${request.memberName}`,
              amount: requestAmount,
              amountStr: `S/ ${requestAmount.toLocaleString()}`,
              detail: `Solicitud pendiente`,
              memberId: request.memberId,
              requestId: request.id,
              requiredDate: request.requiredDate,
              requestDate: request.requestDate
            });
          }
          // NO mostrar solicitudes aprobadas, rechazadas o procesadas
        }
      });
    }

    return events;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getMonthlyStats = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Filtrar préstamos según el rol del usuario (igual que en getEventsForDate)
    const filteredLoans = currentUser.role === 'member' && currentUser.memberId
      ? loans.filter(loan => 
          loan.memberId === currentUser.memberId && 
          loan.status !== 'Por aprobar' && 
          loan.status !== 'Rechazada'
        )
      : loans;


    if (activeView === 'payments') {
      let vencimientosDelMes = 0;
      let totalPorCobrar = 0; // Total programado para cobrar en el mes
      let totalPagosRecibidos = 0; // Total efectivamente recibido en el mes
      let cantidadPagosRecibidos = 0;

      // Calcular todos los vencimientos programados para este mes usando el cronograma específico
      filteredLoans.forEach(loan => {
        // Asegurar que los valores sean números válidos
        const weeklyPayment = parseFloat(loan.weeklyPayment || loan.weekly_payment || loan.monthlyPayment || loan.monthly_payment || 0);
        
        if (isNaN(weeklyPayment) || weeklyPayment <= 0) {
          console.warn('⚠️ Pago semanal inválido para préstamo:', loan.id, loan.memberName, 'valor:', weeklyPayment);
          return; // Saltar este préstamo
        }

        // Usar el cronograma específico del préstamo si existe
        if (loan.paymentSchedule && loan.paymentSchedule.length > 0) {
          loan.paymentSchedule.forEach(payment => {
            if (!payment.dueDate) return;
            
            const paymentDate = new Date(payment.dueDate);
            if (isNaN(paymentDate.getTime())) return; // Fecha inválida
            
            // Si esta fecha de pago está en el mes actual
            if (paymentDate >= firstDay && paymentDate <= lastDay) {
              vencimientosDelMes++;
              totalPorCobrar += weeklyPayment;
              
            }
          });
        } else {
          // Fallback: solo para préstamos sin cronograma específico
          console.log('⚠️ Préstamo sin cronograma específico:', loan.memberName);
        }

        // Calcular pagos efectivamente recibidos en este mes
        if (loan.paymentHistory && loan.paymentHistory.length > 0) {
          loan.paymentHistory.forEach(payment => {
            if (!payment.date || !payment.amount) return;
            
            const paymentDate = new Date(payment.date);
            const paymentAmount = parseFloat(payment.amount);
            
            if (isNaN(paymentDate.getTime()) || isNaN(paymentAmount)) return;
            
            if (paymentDate >= firstDay && paymentDate <= lastDay && paymentAmount > 0) {
              totalPagosRecibidos += paymentAmount;
              cantidadPagosRecibidos++;
            }
          });
        }
      });


      // Asegurar que todos los valores sean números válidos
      const vencimientosValidados = Math.max(0, vencimientosDelMes || 0);
      const porCobrarValidado = Math.max(0, totalPorCobrar || 0);
      const pagosRecibidosValidado = Math.max(0, totalPagosRecibidos || 0);
      const pendienteValidado = Math.max(0, porCobrarValidado - pagosRecibidosValidado);

      return {
        label1: 'Vencimientos del Mes',
        value1: vencimientosValidados,
        label2: 'Por Cobrar',
        value2: `S/ ${porCobrarValidado.toFixed(2)}`,
        label3: 'Pagos Recibidos',
        value3: `S/ ${pagosRecibidosValidado.toFixed(2)}`,
        label4: 'Pendiente por Cobrar',
        value4: `S/ ${pendienteValidado.toFixed(2)}`
      };
    } else {
      // Estadísticas para la sección de Solicitudes - SOLO PENDIENTES
      // Filtrar solicitudes según el rol del usuario
      const filteredRequests = currentUser.role === 'member' && currentUser.memberId
        ? loanRequests.filter(request => request.memberId === currentUser.memberId)
        : loanRequests;

      console.log('🔍 Debug filteredRequests:', filteredRequests.map(r => ({ 
        id: r.id, 
        status: r.status, 
        requestedAmount: r.requestedAmount,
        memberName: r.memberName 
      })));
      
      const solicitudesPendientes = filteredRequests.filter(r => r.status === 'pending');
      
      console.log('✅ Solicitudes pendientes encontradas:', solicitudesPendientes.map(r => ({ 
        id: r.id, 
        status: r.status, 
        requestedAmount: r.requestedAmount,
        memberName: r.memberName 
      })));
      
      const montoTotalPendiente = solicitudesPendientes.reduce((sum, req) => sum + (req.requestedAmount || 0), 0);
      
      // Solicitudes pendientes del mes actual
      const solicitudesPendientesDelMes = solicitudesPendientes.filter(request => {
        const requestDate = new Date(request.requestDate);
        return requestDate >= firstDay && requestDate <= lastDay;
      }).length;

      console.log('📊 Estadísticas de Solicitudes Pendientes:', {
        totalPendientes: solicitudesPendientes.length,
        solicitudesPendientesDelMes,
        montoTotalPendiente
      });

      return {
        label1: 'Solicitudes Pendientes',
        value1: solicitudesPendientes.length,
        label2: 'Monto Total Pendiente',
        value2: `S/ ${(montoTotalPendiente || 0).toLocaleString()}`,
        label3: 'Del Mes Actual',
        value3: solicitudesPendientesDelMes,
        label4: 'Promedio por Solicitud',
        value4: solicitudesPendientes.length > 0 ? 
          `S/ ${Math.round(montoTotalPendiente / solicitudesPendientes.length).toLocaleString()}` : 
          'S/ 0'
      };
    }
  };

  const handleDayClick = (date) => {
    const events = getEventsForDate(date);
    if (events.length > 0) {
      setSelectedDate(date);
      setShowDayDetail(true);
    }
  };

  const closeDayDetail = () => {
    setShowDayDetail(false);
    setSelectedDate(null);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const closeEventDetail = () => {
    setShowEventDetail(false);
    setSelectedEvent(null);
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

  // Función para calcular semanas de atraso
  const calculateWeeksLate = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    // Evitar problemas de zona horaria
    const dueDateStr = dueDate.includes('T') ? 
      formatLocalDate(dueDate) : 
      dueDate;
    const due = new Date(dueDateStr + 'T00:00:00');
    
    const diffTime = today - due;
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.max(0, diffWeeks);
  };

  const handleEventAction = async (action, eventData) => {
    try {
      if (action === 'pay') {
        // Registrar pago en el backend primero
        const loan = loans.find(l => l.id === eventData.loanId);
        if (loan && onUpdateLoan) {
          // Importar loanService
          const { default: loanService } = await import('../services/loanService');
          
          const paymentData = {
            amount: eventData.amount,
            paymentDate: formatLocalDate(new Date()),
            lateFee: 0,
            notes: 'Pago registrado desde calendario'
          };
          
          console.log('💾 Guardando pago en backend:', {
            loanId: eventData.loanId,
            paymentData: paymentData
          });
          
          // Registrar pago en backend
          const response = await loanService.registerPayment(eventData.loanId, paymentData);
          
          console.log('✅ Pago guardado exitosamente en PaymentHistory');
          console.log('📄 Respuesta del backend:', response);
          
          // Obtener el préstamo actualizado desde el backend
          const updatedLoan = await loanService.getLoanById(eventData.loanId);
          console.log('📋 Préstamo actualizado desde backend:', updatedLoan);
          
          // Actualizar el array de préstamos con los datos reales del backend
          const updatedLoansFromBackend = loans.map(l => l.id === eventData.loanId ? updatedLoan : l);
          onUpdateLoan(updatedLoansFromBackend);
          
          // Forzar actualización del componente
          setRefreshKey(prev => prev + 1);
          
          // Nota: El backend ya actualizó todos los datos del préstamo
          // No necesitamos hacer cálculos locales, los datos vienen del backend
          console.log(`📊 Pago registrado exitosamente para ${loan.memberName}`);
        }
      } else if (action === 'approve_request') {
        // Aprobar solicitud y crear préstamo con cronograma específico
        const request = loanRequests.find(r => r.id === eventData.requestId);
        if (request && onUpdateLoanRequest && onUpdateLoan) {
          // Generar cronograma de pagos usando la fecha requerida directamente
          const { generateMockPaymentSchedule } = await import('../data/mockDataFinal');
          const startDate = request.requiredDate || request.requestDate;
          
          console.log('🔍 Debug Calendar - Aprobando solicitud:', {
            memberName: request.memberName,
            amount: request.requestedAmount,
            requiredDate: request.requiredDate,
            requestDate: request.requestDate,
            startDate: startDate
          });
          
          const paymentSchedule = generateMockPaymentSchedule(
            request.requestedAmount,
            request.totalWeeks || request.installments,
            request.monthlyInterestRate,
            startDate
          );

          console.log('📅 Debug Calendar - Cronograma generado:', {
            firstPayment: paymentSchedule[0],
            totalPayments: paymentSchedule.length,
            allPayments: paymentSchedule.slice(0, 3).map(p => ({ week: p.week, dueDate: p.dueDate }))
          });

          // La primera fecha de pago viene del cronograma
          const firstPaymentDate = paymentSchedule[0]?.dueDate || new Date().toISOString().split('T')[0];
          
          console.log('✅ Debug Calendar - Primera fecha de pago:', firstPaymentDate);

          // Actualizar el préstamo existente en lugar de crear uno nuevo
          const updatedLoans = loans.map(loan => {
            if (loan.requestId === request.id || loan.id === request.id) {
              return {
                ...loan,
                status: 'current', // Cambiar de "Por aprobar" a "current"
                dueDate: firstPaymentDate,
                paymentSchedule: paymentSchedule,
                approvedDate: new Date().toISOString(),
                approvedBy: 'admin',
                currentInstallment: 1,
                currentWeek: 1,
                interestRate: request.monthlyInterestRate,
                monthlyPayment: request.weeklyPayment || request.monthlyPayment || 0,
                weeklyPayment: request.weeklyPayment || request.monthlyPayment || 0
              };
            }
            return loan;
          });
          onUpdateLoan(updatedLoans);

          // Marcar la solicitud como aprobada
          const updatedRequests = loanRequests.map(r => r.id === request.id ? {
            ...r,
            status: 'approved',
            approvedDate: new Date().toISOString().split('T')[0],
            approvedBy: 'admin'
          } : r);
          onUpdateLoanRequest(updatedRequests);
        }
      } else if (action === 'reject_request') {
        // Rechazar solicitud
        const request = loanRequests.find(r => r.id === eventData.requestId);
        if (request && onUpdateLoanRequest) {
          const updatedRequests = loanRequests.map(r => r.id === request.id ? {
            ...r,
            status: 'rejected',
            rejectedDate: new Date().toISOString().split('T')[0],
            rejectionReason: eventData.reason || 'Sin motivo especificado'
          } : r);
          onUpdateLoanRequest(updatedRequests);
        }
      }
      
      // Cerrar modales y forzar actualización
      closeEventDetail();
      if (showDayDetail) {
        setShowDayDetail(false);
        setSelectedDate(null);
      }
      
      // Pequeño delay para asegurar que se procese el cambio de estado
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
      
    } catch (error) {
      console.error('Error al procesar la acción:', error);
    }
  };

  const getDayDetailData = () => {
    if (!selectedDate) return { events: [], totalAmount: 0 };
    
    const events = getEventsForDate(selectedDate);
    
    const totalAmount = events.reduce((sum, event) => {
      // Asegurar que amount sea un número, no string
      const amount = parseFloat(event.amount) || 0;
      return sum + amount;
    }, 0);
    
    return { events, totalAmount };
  };

  const renderCalendarDay = (date) => {
    const events = getEventsForDate(date);
    
    let dayClasses = 'calendar-day';
    if (!isCurrentMonth(date)) dayClasses += ' other-month';
    if (isToday(date)) dayClasses += ' today';
    if (events.length > 0) dayClasses += ' has-events';
    if (isOperationDay(date)) dayClasses += ' operation-day';

    return (
      <div 
        key={`${date.toISOString()}-${refreshKey}`} 
        className={dayClasses}
        onClick={() => handleDayClick(date)}
      >
        <div className="day-number">
          {date.getDate()}
          {isOperationDay(date) && <span className="operation-indicator">💼</span>}
        </div>
        
        <div className="day-events">
          {events.length > 0 ? (
            events.slice(0, 2).map((event, index) => (
              <div 
                key={index} 
                className={`event-item event-${event.type} ${event.creditRating ? `credit-${event.creditRating}` : ''}`}
                title={`${event.title} - ${event.amountStr} - ${event.detail}`}
              >
                {event.title}
              </div>
            ))
          ) : (
            <div className="no-events">Sin eventos</div>
          )}
          
          {events.length > 2 && (
            <div className="event-count-badge">+{events.length - 2}</div>
          )}
        </div>
      </div>
    );
  };

  const days = getDaysInMonth();
  const stats = getMonthlyStats();
  const dayDetailData = getDayDetailData();

  return (
    <div className={`calendar-container ${darkMode ? 'dark' : ''}`}>
      <div className="calendar-wrapper">
        <div className="calendar-header">
          <div className="calendar-navigation">
            <button className="nav-button" onClick={() => navigateMonth(-1)}>
              ←
            </button>
            <button className="nav-button" onClick={() => navigateMonth(1)}>
              →
            </button>
          </div>

          <h2 className="current-month">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <div className="view-tabs">
            <button 
              className={`view-tab ${activeView === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveView('payments')}
            >
              Pagos
            </button>
            <button 
              className={`view-tab ${activeView === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveView('requests')}
            >
              Solicitudes
            </button>
          </div>
        </div>

        <div className="calendar-stats">
          <div className="stat-item">
            <div className="stat-label">{stats.label1}</div>
            <div className="stat-value">{stats.value1}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{stats.label2}</div>
            <div className="stat-value">{stats.value2}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{stats.label3}</div>
            <div className="stat-value">{stats.value3}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">{stats.label4}</div>
            <div className="stat-value">{stats.value4}</div>
          </div>
        </div>

        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          
          {days.map(day => renderCalendarDay(day))}
        </div>
      </div>

      {showDayDetail && selectedDate && (
        <div className="modal-overlay" onClick={closeDayDetail}>
          <div className="day-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Detalle del {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
              </h3>
              <button className="close-btn" onClick={closeDayDetail}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="day-summary">
                <div className="summary-item">
                  <span className="summary-label">Total de eventos:</span>
                  <span className="summary-value">{dayDetailData.events.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total del día:</span>
                  <span className="summary-value total-amount">
                    S/ {dayDetailData.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="events-list">
                <h4>
                  {activeView === 'payments' ? 'Pagos y Vencimientos' : 'Solicitudes y Desembolsos'}
                </h4>
                
                {dayDetailData.events.map((event, index) => {
                  const member = members && members.find(m => m.id === event.memberId);
                  return (
                    <div 
                      key={index} 
                      className={`event-detail-item event-${event.type} clickable`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="event-member-info">
                        <div className="member-name">{event.title}</div>
                        <div className="member-details">
                          {member && (
                            <>
                              <span className={`credit-rating ${member.creditRating}`}>
                                ● {member.creditRating?.toUpperCase()}
                              </span>
                              <span className="credit-score">
                                {member.creditScore || 0}/90
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="event-details">
                        <div className="event-amount">{event.amountStr}</div>
                        <div className="event-description">{event.detail}</div>
                      </div>
                      
                      <div className={`event-type-badge ${event.type}`}>
                        {event.type === 'payment' && '💰 Pago Programado'}
                        {event.type === 'payment_made' && '✅ Pago Realizado'}
                        {event.type === 'request' && '📝 Aprobar/Rechazar'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEventDetail && selectedEvent && (
        <div className="modal-overlay" onClick={closeEventDetail}>
          <div className="event-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Detalle del Evento - {selectedEvent.title}
              </h3>
              <button className="close-btn" onClick={closeEventDetail}>×</button>
            </div>
            
            <div className="modal-content">
              <EventDetailContent 
                event={selectedEvent}
                member={members && members.find(m => m.id === selectedEvent.memberId)}
                onAction={handleEventAction}
                onClose={closeEventDetail}
                isOperationDay={isOperationDay}
                settings={settings}
                loans={loans}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EventDetailContent = ({ event, member, onAction, onClose, isOperationDay, settings, loans, currentUser }) => {
  const [paymentAmount, setPaymentAmount] = useState(event.amount);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);


  const handleAction = async (actionType) => {
    setLoading(true);
    try {
      if (actionType === 'pay') {
        await onAction('pay', { 
          ...event, 
          amount: paymentAmount 
        });
      } else if (actionType === 'approve') {
        await onAction('approve_request', event);
      } else if (actionType === 'reject') {
        await onAction('reject_request', { 
          ...event, 
          reason: rejectionReason 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-detail-content">
      {/* Información del miembro */}
      <div className="member-section">
        <h4>👤 Información del Asociado</h4>
        <div className="member-info-grid">
          <div className="info-item">
            <span className="label">Nombre:</span>
            <span className="value">{member?.name || 'No encontrado'}</span>
          </div>
          <div className="info-item">
            <span className="label">Teléfono:</span>
            <span className="value">{member?.phone || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Garantía:</span>
            <span className="value">{member?.guarantee || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Calificación:</span>
            <div className="rating-info">
              <span className={`credit-rating ${member?.creditRating}`}>
                ● {member?.creditRating?.toUpperCase()}
              </span>
              <span className="credit-score">
                {member?.creditScore || 0}/90
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Información del evento */}
      <div className="event-section">
        <h4>📋 Detalles del Evento</h4>
        <div className="event-info-grid">
          <div className="info-item">
            <span className="label">Tipo:</span>
            <span className={`event-type-label ${event.type}`}>
              {event.type === 'payment' && '💰 Pago Programado (Registrar)'}
              {event.type === 'payment_made' && '✅ Pago Realizado'}
              {event.type === 'request' && '📝 Solicitud Pendiente (Aprobar/Rechazar)'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Monto:</span>
            <span className="value amount">{event.amountStr}</span>
          </div>
          <div className="info-item">
            <span className="label">Descripción:</span>
            <span className="value">{event.detail}</span>
          </div>
          {event.requiredDate && (
            <div className="info-item">
              <span className="label">Fecha Requerida:</span>
              <span className="value date-required">{event.requiredDate}</span>
            </div>
          )}
          {event.requestDate && (
            <div className="info-item">
              <span className="label">Fecha de Solicitud:</span>
              <span className="value date-original">{event.requestDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Acciones según el tipo de evento */}
      <div className="actions-section">
        <h4>⚡ Acciones Disponibles</h4>
        
        {event.type === 'payment' && (
          <div className="action-form">
            <div className="form-group">
              <label>Monto a pagar:</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                min="0"
                step="0.01"
                className="amount-input"
              />
            </div>
            <div className="action-buttons">
              {currentUser.role !== 'admin' && (
                <div className="operation-day-warning">
                  ⚠️ Solo el administrador puede registrar pagos
                </div>
              )}
              <button 
                className="action-btn pay-btn"
                onClick={() => handleAction('pay')}
                disabled={loading || paymentAmount <= 0 || currentUser.role !== 'admin'}
              >
                {loading ? 'Procesando...' : 
                 currentUser.role !== 'admin' ? '🚫 Solo administrador' : '💰 Registrar Pago'}
              </button>
            </div>
          </div>
        )}

        {event.type === 'request' && (
          <div className="action-form">
            <div className="action-buttons">
              <button 
                className="action-btn approve-btn"
                onClick={() => handleAction('approve')}
                disabled={loading}
              >
                {loading ? 'Procesando...' : '✅ Aprobar Solicitud'}
              </button>
              
              <div className="reject-section">
                <textarea
                  placeholder="Motivo del rechazo (opcional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="rejection-textarea"
                  rows="3"
                />
                <button 
                  className="action-btn reject-btn"
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : '❌ Rechazar Solicitud'}
                </button>
              </div>
            </div>
          </div>
        )}

        {event.type === 'payment_made' && (
          <div className="info-message">
            <p>ℹ️ Este pago ya ha sido registrado. No hay acciones disponibles.</p>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="close-modal-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default Calendar;