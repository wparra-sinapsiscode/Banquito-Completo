import React, { useState } from 'react';
import './Reports.css';
import * as XLSX from 'xlsx';
import { 
  EXCEL_STYLES, 
  createStyledHeader, 
  exportTableToExcel,
  generateCompleteReport,
  saveExcelFile,
  formatNumber,
  formatDate
} from '../utils/excelUtils';
import { exportTableToExcelWithColors } from '../utils/excelUtilsEnhanced';
import { 
  exportCollectionReport,
  exportMembersAnalysis,
  exportSchedule,
  exportWeeklyCollections
} from '../utils/excelColorExport';

const Reports = ({ loans, members, darkMode }) => {
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Estados para los filtros del cronograma
  const [filterMember, setFilterMember] = useState('');
  const [filterWeeks, setFilterWeeks] = useState('all');
  const [showOnlyWithPayments, setShowOnlyWithPayments] = useState(false);
  
  // Estado para el modal de detalles
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [showWeekModal, setShowWeekModal] = useState(false);

  const calculateOverviewStats = () => {
    if (!loans || !Array.isArray(loans)) {
      return {
        totalLoans: 0,
        totalLoanAmount: 0,
        totalPendingAmount: 0,
        totalPaidAmount: 0,
        overdueCount: 0,
        averageLoanAmount: 0,
        collectionRate: 0,
        paidLoansCount: 0,
        currentLoansCount: 0,
        overdueLoans: [],
        upcomingPayments: []
      };
    }
    
    console.log('🔍 calculateOverviewStats - Calculando estadísticas de:', loans.length, 'préstamos');
    
    const totalLoans = loans.length;
    
    // Calcular total prestado (monto original de todos los préstamos)
    const totalLoanAmount = loans.reduce((sum, loan) => {
      const amount = parseFloat(loan.originalAmount || loan.original_amount || 0);
      if (isNaN(amount)) {
        console.log('⚠️ Valor inválido en originalAmount:', loan.originalAmount, loan);
        return sum;
      }
      return sum + amount;
    }, 0);
    
    // Calcular total pagado basado en el historial de pagos real
    const totalPaidAmount = loans.reduce((total, loan) => {
      // Sumar pagos del paymentHistory (frontend)
      const frontendPaid = (loan.paymentHistory || []).reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      
      // Sumar pagos del backend (_backend.payments)
      const backendPaid = (loan._backend?.payments || []).reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      
      // Usar el mayor valor para evitar duplicación
      const paidAmount = Math.max(frontendPaid, backendPaid);
      
      return total + paidAmount;
    }, 0);
    
    // Calcular total pendiente considerando el monto total con intereses menos lo ya pagado
    const totalPendingAmount = loans.reduce((sum, loan) => {
      // Para préstamos pagados completamente, el pendiente es 0
      if (loan.status === 'paid') {
        return sum;
      }
      
      // Calcular monto total con intereses
      let totalAmountWithInterest;
      const originalAmount = parseFloat(loan.originalAmount || loan.original_amount || 0);
      const monthlyInterestRate = parseFloat(loan.monthlyInterestRate || loan.monthly_interest_rate || 0);
      const totalWeeks = parseInt(loan.totalWeeks || loan.total_weeks || loan.installments || 0);
      
      if (monthlyInterestRate > 0 && totalWeeks > 0) {
        const totalMonths = Math.ceil(totalWeeks / 4);
        const TEM = monthlyInterestRate / 100;
        const potencia = Math.pow(1 + TEM, totalMonths);
        const monthlyPayment = originalAmount * (TEM * potencia) / (potencia - 1);
        totalAmountWithInterest = Math.round(monthlyPayment * totalMonths * 100) / 100;
      } else {
        totalAmountWithInterest = originalAmount;
      }
      
      // Calcular lo ya pagado para este préstamo
      const frontendPaid = (loan.paymentHistory || []).reduce((paidSum, payment) => {
        return paidSum + (parseFloat(payment.amount) || 0);
      }, 0);
      
      const backendPaid = (loan._backend?.payments || []).reduce((paidSum, payment) => {
        return paidSum + (parseFloat(payment.amount) || 0);
      }, 0);
      
      // Usar el mayor valor para evitar duplicación
      const paidAmount = Math.max(frontendPaid, backendPaid);
      
      // El pendiente es el total con intereses menos lo pagado
      const pendingAmount = Math.max(0, totalAmountWithInterest - paidAmount);
      
      return sum + pendingAmount;
    }, 0);
    
    console.log('💰 Totales calculados (Reports):', {
      totalLoanAmount: totalLoanAmount.toFixed(2),
      totalPendingAmount: totalPendingAmount.toFixed(2), 
      totalPaidAmount: totalPaidAmount.toFixed(2),
      calculationMethod: 'basedOnPaymentHistory'
    });
    
    const overdueLo = loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      const today = new Date();
      return dueDate < today && loan.status !== 'paid';
    });

    const paidLoans = loans.filter(loan => loan.status === 'paid');
    const currentLoans = loans.filter(loan => loan.status === 'current');

    return {
      totalLoans,
      totalLoanAmount,
      totalPendingAmount,
      totalPaidAmount,
      overdueLoans: overdueLo.length,
      paidLoans: paidLoans.length,
      currentLoans: currentLoans.length,
      collectionRate: totalLoanAmount > 0 ? (totalPaidAmount / totalLoanAmount) * 100 : 0,
      delinquencyRate: totalLoans > 0 ? (overdueLo.length / totalLoans) * 100 : 0
    };
  };

  const generateCollectionReport = () => {
    const today = new Date();
    const overdueLoans = loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      return dueDate < today && loan.status !== 'paid';
    });

    const upcomingPayments = loans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= today && dueDate <= nextWeek && loan.status !== 'paid';
    });

    return {
      overdueLoans: overdueLoans.map(loan => ({
        ...loan,
        daysPastDue: Math.floor((today - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24))
      })),
      upcomingPayments,
      totalOverdueAmount: overdueLoans.reduce((sum, loan) => sum + (loan.weeklyPayment || loan.monthlyPayment || 0), 0),
      totalUpcomingAmount: upcomingPayments.reduce((sum, loan) => sum + (loan.weeklyPayment || loan.monthlyPayment || 0), 0)
    };
  };

  const generateMemberAnalysis = () => {
    if (!members || !Array.isArray(members)) {
      return [];
    }
    const memberStats = members.map(member => {
      const memberLoans = loans.filter(loan => loan.memberId === member.id);
      const totalBorrowed = memberLoans.reduce((sum, loan) => sum + loan.originalAmount, 0);
      const totalPending = memberLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
      const hasOverdue = memberLoans.some(loan => {
        const dueDate = new Date(loan.dueDate);
        return dueDate < new Date() && loan.status !== 'paid';
      });

      return {
        ...member,
        totalLoans: memberLoans.length,
        totalBorrowed,
        totalPending,
        hasOverdue,
        utilizationRate: (totalBorrowed / (((member.shares || 0) * 500) * 0.8)) * 100
      };
    });

    return memberStats.sort((a, b) => b.totalBorrowed - a.totalBorrowed);
  };

  const generatePaymentSchedule = () => {
    const schedule = [];
    const allScheduledPayments = [];
    
    // Recopilar todos los pagos programados de todos los préstamos
    loans.forEach(loan => {
      if (loan.paymentSchedule && Array.isArray(loan.paymentSchedule)) {
        // Usar el cronograma de pagos del préstamo
        loan.paymentSchedule.forEach((payment, index) => {
          allScheduledPayments.push({
            loanId: loan.id,
            memberId: loan.memberId,
            memberName: loan.memberName,
            dueDate: payment.dueDate,
            weekNumber: payment.week || (index + 1),
            amount: parseFloat(payment.amount || payment.weeklyPayment || 0),
            weeklyPayment: parseFloat(payment.weeklyPayment || payment.amount || 0),
            originalAmount: loan.originalAmount,
            status: loan.status,
            isPaid: index < (loan.paymentHistory?.length || 0),
            isOverdue: new Date(payment.dueDate) < new Date() && index >= (loan.paymentHistory?.length || 0) && loan.status !== 'paid'
          });
        });
      } else if (loan.totalWeeks > 0) {
        // Generar cronograma si no existe
        const startDate = new Date(loan.startDate || loan.createdAt);
        for (let week = 1; week <= loan.totalWeeks; week++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(startDate.getDate() + (week * 7));
          
          allScheduledPayments.push({
            loanId: loan.id,
            memberId: loan.memberId,
            memberName: loan.memberName,
            dueDate: dueDate.toISOString().split('T')[0],
            weekNumber: week,
            amount: parseFloat(loan.weeklyPayment || 0),
            weeklyPayment: parseFloat(loan.weeklyPayment || 0),
            originalAmount: loan.originalAmount,
            status: loan.status,
            isPaid: week <= (loan.paymentHistory?.length || 0),
            isOverdue: dueDate < new Date() && week > (loan.paymentHistory?.length || 0) && loan.status !== 'paid'
          });
        }
      }
    });
    
    // Obtener rango de fechas para el cronograma
    const today = new Date();
    const startOfSchedule = new Date(today);
    startOfSchedule.setDate(today.getDate() - 60); // Mostrar desde 60 días atrás
    
    const endOfSchedule = new Date(today);
    endOfSchedule.setDate(today.getDate() + 84); // Mostrar hasta 12 semanas adelante
    
    // Obtener el lunes de la semana de inicio
    const scheduleMonday = new Date(startOfSchedule);
    scheduleMonday.setDate(startOfSchedule.getDate() - startOfSchedule.getDay() + 1);
    
    // Generar semanas del cronograma
    let weekCounter = 1;
    for (let weekDate = new Date(scheduleMonday); weekDate <= endOfSchedule; weekDate.setDate(weekDate.getDate() + 7)) {
      const weekStart = new Date(weekDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Filtrar pagos de esta semana
      const weekPayments = allScheduledPayments.filter(payment => {
        const paymentDate = new Date(payment.dueDate);
        return paymentDate >= weekStart && paymentDate <= weekEnd;
      });
      
      // Calcular total de la semana (solo pagos no realizados)
      const weeklyCollection = weekPayments
        .filter(p => !p.isPaid)
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      const monthName = weekStart.toLocaleDateString('es-ES', { month: 'long' });
      const isCurrentWeek = today >= weekStart && today <= weekEnd;
      
      schedule.push({
        week: `Semana ${weekCounter} - ${monthName}`,
        weekRange: `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`,
        paymentsCount: weekPayments.filter(p => !p.isPaid).length,
        totalPaymentsCount: weekPayments.length,
        expectedAmount: weeklyCollection,
        loans: weekPayments.map(payment => ({
          id: payment.loanId,
          memberId: payment.memberId,
          memberName: payment.memberName,
          dueDate: payment.dueDate,
          weeklyPayment: payment.weeklyPayment,
          paymentAmount: payment.amount,
          originalAmount: payment.originalAmount,
          status: payment.isPaid ? 'paid' : payment.isOverdue ? 'overdue' : 'pending',
          paymentStatus: payment.isPaid ? 'Pagado' : payment.isOverdue ? 'Vencido' : 'Pendiente',
          weekNumber: payment.weekNumber
        })),
        weekStart: weekStart,
        weekEnd: weekEnd,
        isCurrentWeek: isCurrentWeek,
        isPastWeek: weekEnd < today
      });
      
      weekCounter++;
    }
    
    return schedule;
  };

  const exportToExcel = (data, filename) => {
    if (activeReport === 'collection') {
      // Enriquecer los datos con información de miembros
      const enrichedData = {
        ...data,
        overdueLoans: data.overdueLoans?.map(loan => {
          const member = members.find(m => m.id === loan.memberId);
          return {
            ...loan,
            memberDNI: member?.dni,
            memberPhone: member?.phone,
            memberEmail: member?.email
          };
        }),
        upcomingPayments: data.upcomingPayments?.map(loan => {
          const member = members.find(m => m.id === loan.memberId);
          return {
            ...loan,
            memberDNI: member?.dni,
            memberPhone: member?.phone,
            memberEmail: member?.email
          };
        })
      };
      exportCollectionReport(enrichedData, filename);
    } else if (activeReport === 'members') {
      exportMembersAnalysis(data, filename);
    }
  };

  const exportCollectionToExcel = (data, filename) => {
    try {
      console.log('🔍 Exportando datos de cobranza:', data);
      
      const wb = XLSX.utils.book_new();
      
      // Configurar el reporte completo
      const reportData = {
        title: 'REPORTE DE COBRANZA - BANQUITO SYSTEM',
        summary: [
          {
            title: 'RESUMEN EJECUTIVO',
            data: [
              { label: 'Préstamos Vencidos', value: data?.overdueLoans?.length || 0 },
              { label: 'Monto Total Vencido', value: `S/ ${formatNumber(data?.totalOverdueAmount || 0)}` },
              { label: 'Próximos Vencimientos (7 días)', value: data?.upcomingPayments?.length || 0 },
              { label: 'Monto Próximos Vencimientos', value: `S/ ${formatNumber(data?.totalUpcomingAmount || 0)}` },
              { label: 'Total a Cobrar', value: `S/ ${formatNumber((data?.totalOverdueAmount || 0) + (data?.totalUpcomingAmount || 0))}` }
            ]
          }
        ],
        sheets: [
          {
            name: 'Préstamos Vencidos',
            title: 'PRÉSTAMOS VENCIDOS - DETALLE DE COBRANZA',
            headers: ['Nombre', 'DNI', 'Monto Cuota', 'Días Vencido', 'Fecha Vencimiento', 'Teléfono', 'Email', 'Monto Total Vencido'],
            columnTypes: ['text', 'text', 'currency', 'number', 'date', 'text', 'text', 'currency'],
            columnWidths: [30, 15, 18, 15, 20, 18, 30, 20],
            autoFilter: true,
            data: data?.overdueLoans?.map(loan => {
              const member = members.find(m => m.id === loan.memberId);
              const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
              return [
                loan.memberName || 'N/A',
                member?.dni || 'N/A',
                weeklyPayment,
                loan.daysPastDue || 0,
                formatDate(loan.dueDate),
                member?.phone || 'N/A',
                member?.email || 'N/A',
                weeklyPayment * (Math.max(1, Math.floor((loan.daysPastDue || 0) / 7)))
              ];
            }) || []
          },
          {
            name: 'Próximos Vencimientos',
            title: 'PRÓXIMOS VENCIMIENTOS (7 DÍAS)',
            headers: ['Nombre', 'DNI', 'Monto Cuota', 'Fecha Vencimiento', 'Días Restantes', 'Teléfono', 'Email', 'Estado'],
            columnTypes: ['text', 'text', 'currency', 'date', 'number', 'text', 'text', 'status'],
            columnWidths: [30, 15, 18, 20, 15, 18, 30, 15],
            autoFilter: true,
            data: data?.upcomingPayments?.map(loan => {
              const member = members.find(m => m.id === loan.memberId);
              const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
              const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              return [
                loan.memberName || 'N/A',
                member?.dni || 'N/A',
                weeklyPayment,
                formatDate(loan.dueDate),
                daysUntilDue,
                member?.phone || 'N/A',
                member?.email || 'N/A',
                daysUntilDue <= 3 ? 'Urgente' : 'Próximo'
              ];
            }) || []
          }
        ]
      };
      
      // Generar el reporte completo
      generateCompleteReport(wb, reportData);
      
      // Guardar el archivo
      saveExcelFile(wb, filename.replace('.xlsx', ''));
      
    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      alert('❌ Error al generar el archivo Excel: ' + error.message);
    }
  };

  const exportMembersToExcel = (data, filename) => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Calcular estadísticas
      const greenMembers = data.filter(m => m.creditRating === 'green').length;
      const yellowMembers = data.filter(m => m.creditRating === 'yellow').length;
      const redMembers = data.filter(m => m.creditRating === 'red').length;
      const totalGuarantee = data.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0);
      const totalBorrowed = data.reduce((sum, m) => sum + (m.totalBorrowed || 0), 0);
      const totalPending = data.reduce((sum, m) => sum + (m.totalPending || 0), 0);
      const totalLoans = data.reduce((sum, m) => sum + m.totalLoans, 0);
      const membersWithOverdue = data.filter(m => m.hasOverdue).length;
      
      // Configurar el reporte completo
      const reportData = {
        title: 'ANÁLISIS DE MIEMBROS - BANQUITO SYSTEM',
        summary: [
          {
            title: 'DISTRIBUCIÓN POR CALIFICACIÓN CREDITICIA',
            data: [
              { label: 'Verde (Excelente)', value: greenMembers },
              { label: 'Amarilla (Regular)', value: yellowMembers },
              { label: 'Roja (Riesgo)', value: redMembers },
              { label: 'Total de Miembros', value: data.length }
            ]
          },
          {
            title: 'ESTADÍSTICAS FINANCIERAS',
            data: [
              { label: 'Total de Garantías', value: `S/ ${formatNumber(totalGuarantee)}` },
              { label: 'Total Prestado Histórico', value: `S/ ${formatNumber(totalBorrowed)}` },
              { label: 'Total Pendiente de Cobro', value: `S/ ${formatNumber(totalPending)}` },
              { label: 'Capital Disponible', value: `S/ ${formatNumber(Math.max(0, (totalGuarantee * 0.8) - totalPending))}` },
              { label: 'Total de Préstamos Activos', value: totalLoans },
              { label: 'Miembros con Mora', value: membersWithOverdue },
              { label: 'Tasa de Morosidad', value: `${((membersWithOverdue / data.length) * 100).toFixed(1)}%` }
            ]
          }
        ],
        sheets: [
          {
            name: 'Detalle de Miembros',
            title: 'ANÁLISIS DETALLADO DE MIEMBROS',
            headers: ['Nombre', 'DNI', 'Calificación', 'Garantía', '# Préstamos', 'Total Prestado', 'Pendiente', 'Utilización %', 'Estado', 'Teléfono', 'Email'],
            columnTypes: ['text', 'text', 'status', 'currency', 'number', 'currency', 'currency', 'number', 'status', 'text', 'text'],
            columnWidths: [30, 15, 15, 18, 15, 20, 18, 15, 20, 18, 30],
            autoFilter: true,
            data: data.map(member => {
              let creditRatingText = 'Riesgo';
              if (member.creditRating === 'green') creditRatingText = 'Excelente';
              else if (member.creditRating === 'yellow') creditRatingText = 'Regular';
              
              let statusText = 'Sin préstamos';
              if (member.hasOverdue) statusText = 'Mora';
              else if (member.totalLoans > 0) statusText = 'Activo';
              
              return [
                member.name,
                member.dni,
                creditRatingText,
                (member.shares || 0) * 500,
                member.totalLoans,
                member.totalBorrowed || 0,
                member.totalPending || 0,
                member.utilizationRate.toFixed(1),
                statusText,
                member.phone || 'N/A',
                member.email || 'N/A'
              ];
            })
          },
          {
            name: 'Resumen por Calificación',
            title: 'RESUMEN POR CALIFICACIÓN CREDITICIA',
            headers: ['Calificación', 'Cantidad', 'Porcentaje', 'Garantía Total', 'Préstamos Activos', 'Monto Pendiente'],
            columnTypes: ['text', 'number', 'text', 'currency', 'number', 'currency'],
            columnWidths: [20, 15, 15, 20, 20, 20],
            data: [
              [
                'Excelente (Verde)',
                greenMembers,
                `${((greenMembers / data.length) * 100).toFixed(1)}%`,
                data.filter(m => m.creditRating === 'green').reduce((sum, m) => sum + ((m.shares || 0) * 500), 0),
                data.filter(m => m.creditRating === 'green').reduce((sum, m) => sum + m.totalLoans, 0),
                data.filter(m => m.creditRating === 'green').reduce((sum, m) => sum + (m.totalPending || 0), 0)
              ],
              [
                'Regular (Amarillo)',
                yellowMembers,
                `${((yellowMembers / data.length) * 100).toFixed(1)}%`,
                data.filter(m => m.creditRating === 'yellow').reduce((sum, m) => sum + ((m.shares || 0) * 500), 0),
                data.filter(m => m.creditRating === 'yellow').reduce((sum, m) => sum + m.totalLoans, 0),
                data.filter(m => m.creditRating === 'yellow').reduce((sum, m) => sum + (m.totalPending || 0), 0)
              ],
              [
                'Riesgo (Rojo)',
                redMembers,
                `${((redMembers / data.length) * 100).toFixed(1)}%`,
                data.filter(m => m.creditRating === 'red').reduce((sum, m) => sum + ((m.shares || 0) * 500), 0),
                data.filter(m => m.creditRating === 'red').reduce((sum, m) => sum + m.totalLoans, 0),
                data.filter(m => m.creditRating === 'red').reduce((sum, m) => sum + (m.totalPending || 0), 0)
              ]
            ]
          }
        ]
      };
      
      // Generar el reporte completo
      generateCompleteReport(wb, reportData);
      
      // Guardar el archivo
      saveExcelFile(wb, filename.replace('.xlsx', ''));
      
    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      alert('❌ Error al generar el archivo Excel: ' + error.message);
    }
  };

  const exportScheduleToExcel = (scheduleData) => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Calcular estadísticas
      const weeksWithPayments = scheduleData.filter(week => week.paymentsCount > 0);
      const totalExpected = scheduleData.reduce((sum, week) => sum + (week.expectedAmount || 0), 0);
      const totalPayments = scheduleData.reduce((sum, week) => sum + week.paymentsCount, 0);
      
      // Obtener la semana con mayor cobranza
      const maxWeek = scheduleData.reduce((max, week) => 
        week.expectedAmount > (max?.expectedAmount || 0) ? week : max
      , null);
      
      // Configurar el reporte completo
      const reportData = {
        title: 'CRONOGRAMA SEMANAL DE COBROS - BANQUITO SYSTEM',
        summary: [
          {
            title: 'RESUMEN EJECUTIVO',
            data: [
              { label: 'Semanas con Cobros', value: weeksWithPayments.length },
              { label: 'Semanas Libres', value: scheduleData.length - weeksWithPayments.length },
              { label: 'Total de Pagos Programados', value: totalPayments },
              { label: 'Monto Total Esperado', value: `S/ ${formatNumber(totalExpected)}` },
              { label: 'Promedio Semanal', value: weeksWithPayments.length > 0 ? `S/ ${formatNumber(totalExpected / weeksWithPayments.length)}` : 'S/ 0' },
              { label: 'Semana de Mayor Cobranza', value: maxWeek ? `${maxWeek.week} - S/ ${formatNumber(maxWeek.expectedAmount)}` : 'N/A' }
            ]
          }
        ],
        sheets: []
      };
      
      // Hoja principal: Cronograma resumido
      reportData.sheets.push({
        name: 'Cronograma Resumido',
        title: 'CRONOGRAMA SEMANAL DE COBROS',
        headers: ['Semana', 'Período', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Total Semana', 'Cantidad Pagos'],
        columnTypes: ['text', 'text', 'currency', 'currency', 'currency', 'currency', 'currency', 'currency', 'currency', 'currency', 'number'],
        columnWidths: [15, 25, 15, 15, 15, 15, 15, 15, 15, 18, 15],
        autoFilter: true,
        data: scheduleData.map(week => {
          // Calcular pagos por día
          const paymentsByDay = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0
          };
          
          week.loans?.forEach(loan => {
            const dayOfWeek = new Date(loan.dueDate).getDay();
            const payment = loan.weeklyPayment || loan.monthlyPayment || 0;
            paymentsByDay[dayOfWeek] += payment;
          });
          
          return [
            week.week,
            week.weekRange,
            paymentsByDay[1], // Lunes
            paymentsByDay[2], // Martes
            paymentsByDay[3], // Miércoles
            paymentsByDay[4], // Jueves
            paymentsByDay[5], // Viernes
            paymentsByDay[6], // Sábado
            paymentsByDay[0], // Domingo
            week.expectedAmount || 0,
            week.paymentsCount
          ];
        })
      });
      
      // Hoja de detalle completo
      const detailData = [];
      scheduleData.forEach(week => {
        week.loans?.forEach(loan => {
          const member = members.find(m => m.id === loan.memberId);
          const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const dayOfWeek = new Date(loan.dueDate).getDay();
          
          detailData.push([
            week.week,
            formatDate(loan.dueDate),
            dayNames[dayOfWeek],
            loan.memberName,
            member?.dni || 'N/A',
            member?.phone || 'N/A',
            weeklyPayment,
            member?.email || 'N/A',
            loan.status,
            loan.currentWeek || loan.currentInstallment || 1,
            loan.originalAmount || 0
          ]);
        });
      });
      
      reportData.sheets.push({
        name: 'Detalle de Pagos',
        title: 'DETALLE COMPLETO DE PAGOS PROGRAMADOS',
        headers: ['Semana', 'Fecha', 'Día', 'Nombre', 'DNI', 'Teléfono', 'Monto Cuota', 'Email', 'Estado', 'Cuota #', 'Monto Total Préstamo'],
        columnTypes: ['text', 'date', 'text', 'text', 'text', 'text', 'currency', 'text', 'text', 'number', 'currency'],
        columnWidths: [15, 15, 12, 30, 15, 18, 15, 30, 15, 10, 20],
        autoFilter: true,
        data: detailData
      });
      
      // Hoja de análisis por miembro
      const memberPayments = {};
      scheduleData.forEach(week => {
        week.loans?.forEach(loan => {
          if (!memberPayments[loan.memberId]) {
            const member = members.find(m => m.id === loan.memberId);
            memberPayments[loan.memberId] = {
              name: loan.memberName,
              dni: member?.dni || 'N/A',
              phone: member?.phone || 'N/A',
              email: member?.email || 'N/A',
              payments: [],
              totalAmount: 0,
              paymentCount: 0,
              weeks: []
            };
          }
          const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
          memberPayments[loan.memberId].payments.push({
            date: loan.dueDate,
            amount: weeklyPayment,
            week: week.week
          });
          memberPayments[loan.memberId].totalAmount += weeklyPayment;
          memberPayments[loan.memberId].paymentCount++;
          memberPayments[loan.memberId].weeks.push(week.week);
        });
      });
      
      reportData.sheets.push({
        name: 'Análisis por Miembro',
        title: 'ANÁLISIS CONSOLIDADO POR MIEMBRO',
        headers: ['Nombre', 'DNI', 'Teléfono', 'Email', 'Total Pagos', 'Monto Total', 'Primera Fecha', 'Última Fecha', 'Semanas'],
        columnTypes: ['text', 'text', 'text', 'text', 'number', 'currency', 'date', 'date', 'text'],
        columnWidths: [30, 15, 18, 30, 15, 18, 15, 15, 40],
        autoFilter: true,
        data: Object.values(memberPayments).map(member => [
          member.name,
          member.dni,
          member.phone,
          member.email,
          member.paymentCount,
          member.totalAmount,
          formatDate(Math.min(...member.payments.map(p => new Date(p.date)))),
          formatDate(Math.max(...member.payments.map(p => new Date(p.date)))),
          [...new Set(member.weeks)].join(', ')
        ])
      });
      
      // Generar el reporte completo
      generateCompleteReport(wb, reportData);
      
      // Guardar el archivo
      saveExcelFile(wb, 'Cronograma_Cobros');
      
    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      alert('❌ Error al generar el archivo Excel: ' + error.message);
    }
  };

  const exportScheduleToCSV = (scheduleData) => {
    let csv = '\uFEFF'; // BOM para UTF-8
    csv += '"CRONOGRAMA SEMANAL DE COBROS - BANQUITO SYSTEM"\n';
    csv += `"Fecha de Generación: ${new Date().toLocaleString('es-ES')}"\n`;
    csv += '"Período: Próximas 12 semanas"\n\n';
    
    // Resumen ejecutivo del cronograma
    const weeksWithPayments = scheduleData.filter(week => week.paymentsCount > 0);
    const totalExpected = scheduleData.reduce((sum, week) => sum + (week.expectedAmount || 0), 0);
    const totalPayments = scheduleData.reduce((sum, week) => sum + week.paymentsCount, 0);
    
    csv += '"RESUMEN EJECUTIVO"\n';
    csv += `"Semanas con Cobros: ${weeksWithPayments.length}"\n`;
    csv += `"Semanas Libres: ${scheduleData.length - weeksWithPayments.length}"\n`;
    csv += `"Total de Pagos Programados: ${totalPayments}"\n`;
    csv += `"Monto Total Esperado: S/ ${totalExpected.toLocaleString()}"\n`;
    if (weeksWithPayments.length > 0) {
      csv += `"Promedio Semanal: S/ ${Math.round(totalExpected / weeksWithPayments.length).toLocaleString()}"\n`;
    }
    csv += '\n';
    
    // Tabla resumen por semana
    csv += '"CRONOGRAMA SEMANAL RESUMIDO"\n';
    csv += '"Semana","Período","Cantidad Pagos","Monto Total Esperado","Estado"\n';
    scheduleData.forEach(week => {
      const status = week.paymentsCount > 0 ? 'Con Pagos' : 'Libre';
      csv += `"${week.week}","${week.weekRange}","${week.paymentsCount}","S/ ${(week.expectedAmount || 0).toLocaleString()}","${status}"\n`;
    });
    csv += '\n';
    
    // Detalle completo de todos los pagos
    csv += '"DETALLE COMPLETO DE PAGOS PROGRAMADOS"\n';
    csv += '"Semana","Fecha del Pago","Nombre del Deudor","DNI","Teléfono","Monto de Cuota","Email","Estado del Préstamo","Semana del Préstamo","Total Préstamo"\n';
    
    scheduleData.forEach(week => {
      week.loans.forEach(loan => {
        const member = members.find(m => m.id === loan.memberId);
        const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
        csv += `"${week.week}","${new Date(loan.dueDate).toLocaleDateString('es-ES')}","${loan.memberName}","${member?.dni || 'N/A'}","${member?.phone || 'N/A'}","S/ ${weeklyPayment.toLocaleString()}","${member?.email || 'N/A'}","${loan.status}","${loan.currentWeek || loan.currentInstallment || 1}","S/ ${(loan.originalAmount || 0).toLocaleString()}"\n`;
      });
    });
    
    // Análisis por miembro (consolidado)
    csv += '\n"ANÁLISIS CONSOLIDADO POR MIEMBRO"\n';
    csv += '"Nombre","DNI","Teléfono","Total de Pagos en Período","Monto Total a Cobrar","Fechas de Pago","Email"\n';
    
    const memberPayments = {};
    scheduleData.forEach(week => {
      week.loans.forEach(loan => {
        if (!memberPayments[loan.memberId]) {
          memberPayments[loan.memberId] = {
            name: loan.memberName,
            member: members.find(m => m.id === loan.memberId),
            payments: [],
            totalAmount: 0,
            paymentCount: 0
          };
        }
        const weeklyPayment = loan.weeklyPayment || loan.monthlyPayment || 0;
        memberPayments[loan.memberId].payments.push(new Date(loan.dueDate).toLocaleDateString('es-ES'));
        memberPayments[loan.memberId].totalAmount += weeklyPayment;
        memberPayments[loan.memberId].paymentCount++;
      });
    });
    
    Object.values(memberPayments).forEach(memberData => {
      const paymentDates = memberData.payments.join('; ');
      csv += `"${memberData.name}","${memberData.member?.dni || 'N/A'}","${memberData.member?.phone || 'N/A'}","${memberData.paymentCount}","S/ ${memberData.totalAmount.toLocaleString()}","${paymentDates}","${memberData.member?.email || 'N/A'}"\n`;
    });
    
    // Crear y descargar el archivo
    const blob = new Blob([csv], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `Cronograma_Cobros_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const printReport = () => {
    window.print();
  };

  // Función para exportar una semana específica a Excel
  const exportWeekToExcel = (weekData) => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Configurar el reporte de la semana
      const columns = [
        { header: 'Nombre', accessor: 'memberName', width: 30 },
        { header: 'DNI', accessor: 'dni', width: 15 },
        { header: 'Fecha de Pago', accessor: 'dueDate', type: 'date', width: 15 },
        { header: 'Día', accessor: 'dayOfWeek', width: 12 },
        { header: 'Monto Cuota', accessor: 'amount', type: 'currency', width: 15 },
        { header: 'Teléfono', accessor: 'phone', width: 18 },
        { header: 'Email', accessor: 'email', width: 30 },
        { header: 'Cuota #', accessor: 'installmentNumber', type: 'number', width: 10 },
        { header: 'Estado', accessor: 'status', width: 15 },
        { header: 'Monto Total Préstamo', accessor: 'totalLoan', type: 'currency', width: 20 }
      ];
      
      // Preparar los datos
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const data = weekData.loans?.map(loan => {
        const member = members.find(m => m.id === loan.memberId);
        const dayOfWeek = new Date(loan.dueDate).getDay();
        
        return {
          memberName: loan.memberName,
          dni: member?.dni || 'N/A',
          dueDate: loan.dueDate,
          dayOfWeek: dayNames[dayOfWeek],
          amount: loan.weeklyPayment || loan.monthlyPayment || 0,
          phone: member?.phone || 'N/A',
          email: member?.email || 'N/A',
          installmentNumber: loan.currentWeek || loan.currentInstallment || 1,
          status: loan.status === 'current' ? 'Al día' : loan.status === 'overdue' ? 'Vencido' : loan.status,
          totalLoan: loan.originalAmount || 0
        };
      }) || [];
      
      // Calcular totales por día
      const dailyTotals = {
        0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
      };
      
      data.forEach(row => {
        const dayIndex = dayNames.indexOf(row.dayOfWeek);
        if (dayIndex >= 0) {
          dailyTotals[dayIndex] += row.amount;
        }
      });
      
      // Crear el reporte con resumen
      const reportData = {
        title: `CRONOGRAMA DE COBROS - ${weekData.week}`,
        summary: [
          {
            title: 'RESUMEN DE LA SEMANA',
            data: [
              { label: 'Período', value: weekData.weekRange },
              { label: 'Total de Pagos', value: weekData.paymentsCount },
              { label: 'Monto Total', value: `S/ ${formatNumber(weekData.expectedAmount || 0)}` },
              { label: 'Promedio por Pago', value: weekData.paymentsCount > 0 ? `S/ ${formatNumber((weekData.expectedAmount || 0) / weekData.paymentsCount)}` : 'S/ 0' }
            ]
          },
          {
            title: 'DISTRIBUCIÓN POR DÍA',
            data: dayNames.map((day, index) => ({
              label: day,
              value: `S/ ${formatNumber(dailyTotals[index])}`
            }))
          }
        ],
        sheets: [
          {
            name: 'Detalle de Pagos',
            title: `PAGOS PROGRAMADOS - ${weekData.week}`,
            headers: columns.map(col => col.header),
            columnTypes: columns.map(col => col.type || 'text'),
            columnWidths: columns.map(col => col.width),
            autoFilter: true,
            data: data.map(row => columns.map(col => row[col.accessor]))
          }
        ]
      };
      
      // Generar el reporte
      generateCompleteReport(wb, reportData);
      
      // Guardar el archivo
      saveExcelFile(wb, `Cobros_${weekData.week.replace(/ /g, '_')}`);
      
    } catch (error) {
      console.error('❌ Error al generar Excel:', error);
      alert('❌ Error al generar el archivo Excel: ' + error.message);
    }
  };

  // Función para exportar una semana a PDF/Imprimir
  const exportWeekToPDF = (weekData) => {
    // Crear una ventana nueva con el contenido formateado para impresión
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cronograma ${weekData.week}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          h1 { margin: 0 0 10px 0; }
          .info { margin: 5px 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .summary {
            margin-top: 20px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 5px;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BANQUITO SYSTEM</h1>
          <h2>Cronograma de Cobros - ${weekData.week}</h2>
          <div class="info">Período: ${weekData.weekRange}</div>
          <div class="info">Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</div>
        </div>
        
        <div class="summary">
          <strong>Resumen:</strong><br>
          Total de cobros: ${weekData.paymentsCount}<br>
          Monto total: S/ ${(weekData.expectedAmount || 0).toLocaleString()}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Fecha de Pago</th>
              <th>Monto</th>
              <th>Teléfono</th>
              <th>DNI</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${weekData.loans.map((loan, index) => {
              const member = members.find(m => m.id === loan.memberId);
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${loan.memberName}</td>
                  <td>${new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                  <td>S/ ${(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</td>
                  <td>${member?.phone || 'N/A'}</td>
                  <td>${member?.dni || 'N/A'}</td>
                  <td>${loan.status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que se cargue y luego imprimir
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Debug: Verificar datos de entrada
  console.log('🔍 DEBUG - Datos de entrada al componente Reports:');
  console.log('💰 Préstamos totales:', loans?.length || 0);
  console.log('👥 Miembros totales:', members?.length || 0);
  
  const overviewStats = calculateOverviewStats();
  const collectionData = generateCollectionReport();
  const memberAnalysis = generateMemberAnalysis();
  const paymentSchedule = generatePaymentSchedule();
  
  // Debug: Verificar datos procesados
  console.log('📊 CollectionData generado:', collectionData);

  const renderOverviewReport = () => (
    <div className="overview-report print-overview">
      {/* Header específico para impresión */}
      <div className="print-header">
        <div className="print-title">
          <h1>📊 REPORTE GENERAL BANQUITO SYSTEM</h1>
          <div className="print-date">Generado el: {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        <div className="print-logo">
          <div className="logo-placeholder">🏦 BANQUITO</div>
        </div>
      </div>

      {/* Estadísticas principales - Se muestran en pantalla y en impresión */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Prestado</h3>
            <div className="stat-value">S/ {(overviewStats.totalLoanAmount || 0).toFixed(2)}</div>
            <div className="stat-subtitle">{overviewStats.totalLoans} préstamos activos</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Total Cobrado</h3>
            <div className="stat-value">S/ {(overviewStats.totalPaidAmount || 0).toFixed(2)}</div>
            <div className="stat-subtitle">{overviewStats.collectionRate.toFixed(1)}% de recuperación</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pendiente de Cobro</h3>
            <div className="stat-value">S/ {(overviewStats.totalPendingAmount || 0).toFixed(2)}</div>
            <div className="stat-subtitle">{overviewStats.currentLoans} préstamos activos</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Préstamos Vencidos</h3>
            <div className="stat-value">{overviewStats.overdueLoans}</div>
            <div className="stat-subtitle">Requieren atención inmediata</div>
          </div>
        </div>

        <div className={`stat-card ${overviewStats.delinquencyRate > 5 ? 'danger' : overviewStats.delinquencyRate > 3 ? 'warning' : 'success'}`}>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Tasa de Morosidad</h3>
            <div className="stat-value">{overviewStats.delinquencyRate.toFixed(1)}%</div>
            <div className="stat-subtitle">
              {overviewStats.delinquencyRate > 5 && 'Crítica - Requiere acción'}
              {overviewStats.delinquencyRate > 3 && overviewStats.delinquencyRate <= 5 && 'Moderada - Monitorear'}
              {overviewStats.delinquencyRate <= 3 && 'Excelente - Bajo riesgo'}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de distribución por estado */}
      <div className="print-section">
        <h2 className="section-title">📊 DISTRIBUCIÓN POR ESTADO</h2>
        <div className="distribution-table">
          <table className="print-table">
            <thead>
              <tr>
                <th>Estado del Préstamo</th>
                <th>Cantidad</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              <tr className="status-current">
                <td>🟢 Al día</td>
                <td>{overviewStats.currentLoans}</td>
                <td>{overviewStats.totalLoans > 0 ? ((overviewStats.currentLoans / overviewStats.totalLoans) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className="status-paid">
                <td>✅ Pagados</td>
                <td>{overviewStats.paidLoans}</td>
                <td>{overviewStats.totalLoans > 0 ? ((overviewStats.paidLoans / overviewStats.totalLoans) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className="status-overdue">
                <td>🔴 Vencidos</td>
                <td>{overviewStats.overdueLoans}</td>
                <td>{overviewStats.totalLoans > 0 ? ((overviewStats.overdueLoans / overviewStats.totalLoans) * 100).toFixed(1) : 0}%</td>
              </tr>
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td><strong>{overviewStats.totalLoans}</strong></td>
                <td><strong>100%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de resumen financiero */}
      <div className="print-section">
        <h2 className="section-title">💰 RESUMEN FINANCIERO</h2>
        <div className="financial-table">
          <table className="print-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Garantías totales</td>
                <td>S/ {members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0).toFixed(2)}</td>
                <td>Base de capital del banquito</td>
              </tr>
              <tr>
                <td>Capital disponible para préstamos</td>
                <td>S/ {(members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8 - overviewStats.totalPendingAmount).toFixed(2)}</td>
                <td>80% de garantías menos pendientes</td>
              </tr>
              <tr>
                <td>Capital utilizado</td>
                <td>S/ {overviewStats.totalPendingAmount.toFixed(2)}</td>
                <td>Préstamos pendientes de cobro</td>
              </tr>
              <tr className="highlight-row">
                <td><strong>Utilización del capital</strong></td>
                <td><strong>{((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100).toFixed(1)}%</strong></td>
                <td><strong>Nivel de utilización actual</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de análisis */}
      <div className="print-section">
        <h2 className="section-title">📋 ANÁLISIS Y RECOMENDACIONES</h2>
        <div className="analysis-content">
          <div className="analysis-item">
            <h4>Estado de la Morosidad:</h4>
            <p>
              {overviewStats.delinquencyRate <= 3 && 'La tasa de morosidad está en niveles excelentes (≤3%). El banquito mantiene una gestión de riesgo efectiva.'}
              {overviewStats.delinquencyRate > 3 && overviewStats.delinquencyRate <= 5 && 'La tasa de morosidad está en niveles moderados (3-5%). Se recomienda monitorear de cerca.'}
              {overviewStats.delinquencyRate > 5 && 'La tasa de morosidad está en niveles críticos (>5%). Se requiere acción inmediata para la recuperación.'}
            </p>
          </div>
          <div className="analysis-item">
            <h4>Capacidad de Préstamo:</h4>
            <p>
              {((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) < 70 && 'El banquito tiene buena capacidad para nuevos préstamos.'}
              {((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) >= 70 && ((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) < 90 && 'La utilización del capital está alta. Evaluar nuevos préstamos cuidadosamente.'}
              {((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100) >= 90 && 'La utilización del capital está cerca del límite. Priorizar cobros antes de nuevos préstamos.'}
            </p>
          </div>
        </div>
      </div>

      {/* Mantener las secciones originales para pantalla */}
      <div className="charts-section screen-only">
        <div className="chart-card">
          <h3>📊 Distribución por Estado</h3>
          <div className="pie-chart-container">
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color current"></span>
                <span>Al día ({overviewStats.currentLoans})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color paid"></span>
                <span>Pagados ({overviewStats.paidLoans})</span>
              </div>
              <div className="legend-item">
                <span className="legend-color overdue"></span>
                <span>Vencidos ({overviewStats.overdueLoans})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>📈 Resumen Financiero</h3>
          <div className="financial-summary">
            <div className="summary-row">
              <span className="label">Capital disponible para préstamos:</span>
              <span className="value">S/ {(members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8 - overviewStats.totalPendingAmount).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span className="label">Garantías totales:</span>
              <span className="value">S/ {members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0).toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span className="label">Utilización del capital:</span>
              <span className="value">{((overviewStats.totalPendingAmount / (members.reduce((sum, m) => sum + ((m.shares || 0) * 500), 0) * 0.8)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollectionReport = () => (
    <div className="collection-report">
      <div className="report-header">
        <h3>💳 Reporte de Cobranza</h3>
        <button 
          className="export-btn"
          onClick={() => exportToExcel(collectionData, `Reporte_Cobranza_${new Date().toISOString().split('T')[0]}.xlsx`)}
        >
          📊 Exportar a Excel
        </button>
      </div>

      <div className="collection-summary">
        <div className="summary-card overdue">
          <h4>🔴 Préstamos Vencidos</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="number">{collectionData.overdueLoans.length}</span>
              <span className="label">préstamos</span>
            </div>
            <div className="stat">
              <span className="number">S/ {(collectionData.totalOverdueAmount || 0).toLocaleString()}</span>
              <span className="label">monto vencido</span>
            </div>
          </div>
        </div>

        <div className="summary-card upcoming">
          <h4>🟡 Próximos Vencimientos (7 días)</h4>
          <div className="summary-stats">
            <div className="stat">
              <span className="number">{collectionData.upcomingPayments.length}</span>
              <span className="label">pagos</span>
            </div>
            <div className="stat">
              <span className="number">S/ {(collectionData.totalUpcomingAmount || 0).toLocaleString()}</span>
              <span className="label">monto esperado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="tables-section">
        <div className="table-container">
          <h4>📋 Préstamos Vencidos</h4>
          <table className="collection-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Monto Cuota</th>
                <th>Días Vencido</th>
                <th>Fecha Vencimiento</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {collectionData.overdueLoans.map(loan => {
                const member = members.find(m => m.id === loan.memberId);
                return (
                  <tr key={loan.id} className="overdue-row">
                    <td className="member-name">{loan.memberName}</td>
                    <td className="amount">S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</td>
                    <td className="days-overdue">{loan.daysPastDue} días</td>
                    <td className="due-date">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                    <td className="phone">{member?.phone || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <h4>📅 Próximos Vencimientos</h4>
          <table className="collection-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Monto Cuota</th>
                <th>Fecha Vencimiento</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {collectionData.upcomingPayments.map(loan => {
                const member = members.find(m => m.id === loan.memberId);
                return (
                  <tr key={loan.id} className="upcoming-row">
                    <td className="member-name">{loan.memberName}</td>
                    <td className="amount">S/ {(loan.weeklyPayment || loan.monthlyPayment || 0).toLocaleString()}</td>
                    <td className="due-date">{new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                    <td className="phone">{member?.phone || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMembersReport = () => (
    <div className="members-report">
      <div className="report-header">
        <h3>👥 Análisis de Miembros</h3>
        <button 
          className="export-btn"
          onClick={() => exportToExcel(memberAnalysis, `Analisis_Miembros_${new Date().toISOString().split('T')[0]}.xlsx`)}
        >
          📊 Exportar a Excel
        </button>
      </div>

      <div className="members-table-container">
        <table className="members-analysis-table">
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Calificación</th>
              <th>Garantía</th>
              <th>Préstamos</th>
              <th>Total Prestado</th>
              <th>Pendiente</th>
              <th>Utilización</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {memberAnalysis.map(member => (
              <tr key={member.id} className={`member-row ${member.creditRating}`}>
                <td className="member-info">
                  <div className="name">{member.name}</div>
                  <div className="dni">DNI: {member.dni}</div>
                </td>
                <td className="rating">
                  <span className={`rating-badge ${member.creditRating}`}>
                    {member.creditRating === 'green' && '🟢'}
                    {member.creditRating === 'yellow' && '🟡'}
                    {member.creditRating === 'red' && '🔴'}
                  </span>
                </td>
                <td className="guarantee">S/ {((member.shares || 0) * 500).toLocaleString()}</td>
                <td className="loans-count">{member.totalLoans}</td>
                <td className="borrowed">S/ {(member.totalBorrowed || 0).toLocaleString()}</td>
                <td className="pending">S/ {(member.totalPending || 0).toLocaleString()}</td>
                <td className="utilization">
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill"
                      style={{ width: `${Math.min(member.utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                  <span className="utilization-text">{member.utilizationRate.toFixed(1)}%</span>
                </td>
                <td className="status">
                  {member.hasOverdue ? (
                    <span className="status-badge overdue">🔴 Mora</span>
                  ) : member.totalLoans > 0 ? (
                    <span className="status-badge active">🟢 Activo</span>
                  ) : (
                    <span className="status-badge inactive">⚪ Sin préstamos</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderScheduleReport = () => {
    // Filtrar el cronograma según los criterios
    const filteredSchedule = paymentSchedule.filter(week => {
      // Filtrar por semanas con/sin pagos
      if (showOnlyWithPayments && week.paymentsCount === 0) return false;
      
      // Filtrar por rango de semanas
      if (filterWeeks !== 'all') {
        const weekNumber = parseInt(week.week.match(/\d+/)[0]);
        if (filterWeeks === '4' && weekNumber > 4) return false;
        if (filterWeeks === '8' && weekNumber > 8) return false;
        if (filterWeeks === '12' && weekNumber > 12) return false;
      }
      
      // Filtrar por miembro
      if (filterMember) {
        const hasMatchingLoan = week.loans.some(loan => 
          loan.memberName.toLowerCase().includes(filterMember.toLowerCase())
        );
        if (!hasMatchingLoan) return false;
      }
      
      return true;
    });

    return (
      <div className="schedule-report">
        <div className="report-header">
          <h3>📅 Cronograma Semanal de Cobros</h3>
          <div className="schedule-actions">
            <button 
              className="export-btn"
              onClick={() => exportSchedule(paymentSchedule)}
            >
              📊 Exportar Cronograma a Excel
            </button>
          </div>
        </div>

        {/* Filtros del cronograma */}
        <div className="schedule-filters">
          <div className="filter-group">
            <label>Buscar miembro:</label>
            <input
              type="text"
              placeholder="Nombre del miembro..."
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>Período:</label>
            <select
              value={filterWeeks}
              onChange={(e) => setFilterWeeks(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas las semanas</option>
              <option value="4">Próximas 4 semanas</option>
              <option value="8">Próximas 8 semanas</option>
              <option value="12">Próximas 12 semanas</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showOnlyWithPayments}
                onChange={(e) => setShowOnlyWithPayments(e.target.checked)}
              />
              Solo semanas con pagos
            </label>
          </div>
        </div>

        <div className="schedule-grid">
        {filteredSchedule.map((week, index) => (
          <div key={index} className={`schedule-card ${week.paymentsCount === 0 ? 'no-payments' : ''}`}>
            <div className="week-header">
              <div className="week-title">
                <h4>{week.week}</h4>
                <div className="week-range">{week.weekRange}</div>
              </div>
              <div className="week-stats">
                <span className="payments-count">
                  {week.totalPaymentsCount === 0 ? 'Sin pagos' : 
                   week.paymentsCount === 0 ? `${week.totalPaymentsCount} pagos completados` :
                   `${week.paymentsCount} por cobrar de ${week.totalPaymentsCount} total`}
                </span>
                {week.expectedAmount > 0 && (
                  <>
                    <span className="expected-amount">S/ {week.expectedAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                    <span className="daily-average">S/ {Math.round(week.expectedAmount / 7).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}/día</span>
                  </>
                )}
              </div>
            </div>
            
            {week.loans.length > 0 ? (
              <div className="week-details">
                {week.loans.slice(0, 5).map(loan => (
                  <div key={`${loan.id}-${loan.weekNumber}`} className={`payment-item ${loan.status}`}>
                    <div className="payment-info">
                      <span className="member-name">{loan.memberName}</span>
                      <span className="payment-date">
                        {new Date(loan.dueDate).toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <span className={`payment-status-badge ${loan.status}`}>
                        {loan.paymentStatus} (Cuota {loan.weekNumber})
                      </span>
                    </div>
                    <span className="payment-amount">
                      S/ {(loan.paymentAmount || loan.weeklyPayment || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </span>
                  </div>
                ))}
                {week.loans.length > 5 && (
                  <div className="more-payments">
                    +{week.loans.length - 5} pagos más
                  </div>
                )}
              </div>
            ) : (
              <div className="week-details no-payments-message">
                <div className="empty-week">
                  <span className="empty-icon">📅</span>
                  <span className="empty-text">Semana libre de cobros</span>
                </div>
              </div>
            )}

            
            {/* Botones de acción */}
            <div className="card-actions">
              <button 
                className="action-btn details-btn"
                onClick={() => {
                  setSelectedWeek(week);
                  setShowWeekModal(true);
                }}
                title="Ver detalles"
              >
                👁️ Detalles
              </button>
              <button 
                className="action-btn excel-btn"
                onClick={() => exportWeeklyCollections(week)}
                title="Exportar a Excel"
              >
                📊 Excel
              </button>
              <button 
                className="action-btn pdf-btn"
                onClick={() => exportWeekToPDF(week)}
                title="Exportar a PDF/Imprimir"
              >
                📄 PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSchedule.length === 0 && (
        <div className="no-schedule">
          <div className="no-schedule-icon">📅</div>
          <h3>No hay pagos programados</h3>
          <p>No se encontraron pagos que coincidan con los filtros seleccionados</p>
        </div>
      )}

      {/* Resumen total del cronograma filtrado */}
      {filteredSchedule.length > 0 && (
        <div className="schedule-summary">
          <h4>📊 Resumen del Cronograma Filtrado</h4>
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="stat-label">Total de Semanas con Pagos:</span>
              <span className="stat-value">{filteredSchedule.filter(week => week.paymentsCount > 0).length}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Semanas Libres:</span>
              <span className="stat-value">{filteredSchedule.filter(week => week.paymentsCount === 0).length}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Total de Pagos Programados:</span>
              <span className="stat-value">{filteredSchedule.reduce((sum, week) => sum + week.paymentsCount, 0)}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Monto Total Esperado:</span>
              <span className="stat-value">S/ {filteredSchedule.reduce((sum, week) => sum + (week.expectedAmount || 0), 0).toLocaleString()}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Promedio Semanal (con pagos):</span>
              <span className="stat-value">
                S/ {(() => {
                  const weeksWithPayments = filteredSchedule.filter(week => week.paymentsCount > 0);
                  const totalAmount = filteredSchedule.reduce((sum, week) => sum + (week.expectedAmount || 0), 0);
                  return weeksWithPayments.length > 0 ? Math.round(totalAmount / weeksWithPayments.length).toLocaleString() : '0';
                })()}
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Semana de Mayor Cobranza:</span>
              <span className="stat-value">
                S/ {(() => {
                  const maxWeek = filteredSchedule.reduce((max, week) => 
                    week.expectedAmount > max.expectedAmount ? week : max, 
                    { expectedAmount: 0 }
                  );
                  return (maxWeek.expectedAmount || 0).toLocaleString();
                })()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className={`reports-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="reports-header">
        <h2>📈 Reportes y Análisis</h2>
        <div className="report-actions">
          <button className="print-btn" onClick={printReport}>
            🖨️ Imprimir
          </button>
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={`report-tab ${activeReport === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveReport('overview')}
        >
          📊 Resumen General
        </button>
        <button 
          className={`report-tab ${activeReport === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveReport('collection')}
        >
          💳 Cobranza
        </button>
        <button 
          className={`report-tab ${activeReport === 'members' ? 'active' : ''}`}
          onClick={() => setActiveReport('members')}
        >
          👥 Análisis Miembros
        </button>
        <button 
          className={`report-tab ${activeReport === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveReport('schedule')}
        >
          📅 Cronograma
        </button>
      </div>

      <div className="report-content">
        {activeReport === 'overview' && renderOverviewReport()}
        {activeReport === 'collection' && renderCollectionReport()}
        {activeReport === 'members' && renderMembersReport()}
        {activeReport === 'schedule' && renderScheduleReport()}
      </div>

      <div className="report-footer">
        <div className="generation-info">
          <span>📅 Generado el: {new Date().toLocaleString('es-ES')}</span>
          <span>👨‍💼 Sistema Banquito - Reporte Administrativo</span>
        </div>
      </div>
      
      {/* Modal de detalles de la semana */}
      {showWeekModal && selectedWeek && (
        <div className="modal-overlay" onClick={() => setShowWeekModal(false)}>
          <div className="modal-content week-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Detalles - {selectedWeek.week}</h3>
              <button className="close-btn" onClick={() => setShowWeekModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="week-info">
                <div className="info-row">
                  <span className="info-label">Período:</span>
                  <span className="info-value">{selectedWeek.weekRange}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total de pagos:</span>
                  <span className="info-value">{selectedWeek.totalPaymentsCount || selectedWeek.loans.length}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Pagos pendientes:</span>
                  <span className="info-value">{selectedWeek.paymentsCount}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Monto por cobrar:</span>
                  <span className="info-value highlight">S/ {(selectedWeek.expectedAmount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                </div>
              </div>
              
              <h4>Lista detallada de cobros:</h4>
              <div className="modal-table-wrapper">
                <table className="modal-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Fecha</th>
                      <th>Cuota #</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Teléfono</th>
                      <th>DNI</th>
                      <th>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWeek.loans.map((loan, index) => {
                      const member = members.find(m => m.id === loan.memberId);
                      return (
                        <tr key={`${loan.id}-${loan.weekNumber}`} className={loan.status}>
                          <td>{index + 1}</td>
                          <td>{loan.memberName}</td>
                          <td>{new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
                          <td>{loan.weekNumber}</td>
                          <td>S/ {(loan.paymentAmount || loan.weeklyPayment || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                          <td>
                            <span className={`payment-status-badge ${loan.status}`}>
                              {loan.paymentStatus}
                            </span>
                          </td>
                          <td>{member?.phone || 'N/A'}</td>
                          <td>{member?.dni || 'N/A'}</td>
                          <td>
                            <span className={`credit-badge ${member?.creditRating || 'unrated'}`}>
                              {member?.creditRating === 'green' && '🟢'}
                              {member?.creditRating === 'yellow' && '🟡'}
                              {member?.creditRating === 'red' && '🔴'}
                              {!member?.creditRating && '⚪'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="modal-action-btn excel"
                  onClick={() => exportWeeklyCollections(selectedWeek)}
                >
                  📊 Exportar a Excel
                </button>
                <button 
                  className="modal-action-btn pdf"
                  onClick={() => exportWeekToPDF(selectedWeek)}
                >
                  📄 Exportar a PDF
                </button>
                <button 
                  className="modal-action-btn close"
                  onClick={() => setShowWeekModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;