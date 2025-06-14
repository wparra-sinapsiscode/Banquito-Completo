// Funciones especializadas para exportar reportes con colores

export const exportCollectionReportWithColors = (collectionData, filename = 'Reporte_Cobranza.xls') => {
  // Verificar si collectionData es el formato correcto
  const { overdueLoans = [], upcomingPayments = [], totalOverdueAmount = 0, totalUpcomingAmount = 0 } = collectionData || {};
  
  let html = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:x="urn:schemas-microsoft-com:office:excel" 
      xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <meta name="ProgId" content="Excel.Sheet">
      <meta name="Generator" content="Banquito System">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        .header { background-color: #1E3A8A; color: white; font-size: 18px; font-weight: bold; text-align: center; }
        .subheader { background-color: #DBEAFE; color: #1E3A8A; font-weight: bold; }
        .table-header { background-color: #2563EB; color: white; font-weight: bold; text-align: center; }
        .summary-header { background-color: #E0F2FE; color: #1E3A8A; font-weight: bold; font-size: 14px; }
        .summary-row { background-color: #F0F9FF; }
        .summary-value { text-align: right; font-weight: bold; }
        .collection-good { background-color: #D4EDDA; color: #155724; font-weight: bold; }
        .collection-warning { background-color: #FFF3CD; color: #856404; font-weight: bold; }
        .collection-danger { background-color: #F8D7DA; color: #721C24; font-weight: bold; }
        .total-row { background-color: #495057; color: white; font-weight: bold; }
        .number { text-align: right; }
        .currency { text-align: right; mso-number-format: '"S/" #,##0.00'; }
      </style>
    </head>
    <body>
  `;

  // Título principal
  html += `
    <table>
      <tr><td colspan="7" class="header">REPORTE DE COBRANZA - BANQUITO SYSTEM</td></tr>
      <tr><td colspan="7" style="text-align: center; padding: 10px;">Generado el: ${new Date().toLocaleString('es-ES')}</td></tr>
      <tr><td colspan="7">&nbsp;</td></tr>
  `;

  // Resumen ejecutivo
  const totalLoans = overdueLoans.length + upcomingPayments.length;
  const overdueRate = totalLoans > 0 ? ((overdueLoans.length / totalLoans) * 100).toFixed(2) : 0;
  const overdueClass = overdueRate <= 10 ? 'collection-good' : overdueRate <= 30 ? 'collection-warning' : 'collection-danger';

  html += `
    <tr><td colspan="7" class="summary-header">RESUMEN EJECUTIVO DE COBRANZA</td></tr>
    <tr class="summary-row">
      <td colspan="2"><strong>Préstamos Vencidos:</strong></td>
      <td class="${overdueClass}">${overdueLoans.length}</td>
      <td colspan="2"><strong>Monto Vencido:</strong></td>
      <td class="currency">${totalOverdueAmount.toFixed(2)}</td>
      <td>&nbsp;</td>
    </tr>
    <tr class="summary-row">
      <td colspan="2"><strong>Próximos Pagos (7 días):</strong></td>
      <td>${upcomingPayments.length}</td>
      <td colspan="2"><strong>Monto Próximo:</strong></td>
      <td class="currency">${totalUpcomingAmount.toFixed(2)}</td>
      <td>&nbsp;</td>
    </tr>
    <tr class="summary-row">
      <td colspan="2"><strong>Tasa de Morosidad:</strong></td>
      <td class="${overdueClass}">${overdueRate}%</td>
      <td colspan="2"><strong>Total a Gestionar:</strong></td>
      <td class="currency">${(totalOverdueAmount + totalUpcomingAmount).toFixed(2)}</td>
      <td>&nbsp;</td>
    </tr>
    <tr><td colspan="7">&nbsp;</td></tr>
  `;

  // Sección de Préstamos Vencidos
  if (overdueLoans.length > 0) {
    html += `
      <tr><td colspan="7" class="summary-header">PRÉSTAMOS VENCIDOS</td></tr>
      <tr>
        <th class="table-header">Miembro</th>
        <th class="table-header">DNI</th>
        <th class="table-header">Fecha Vencimiento</th>
        <th class="table-header">Días Vencido</th>
        <th class="table-header">Monto Cuota</th>
        <th class="table-header">Teléfono</th>
        <th class="table-header">Estado</th>
      </tr>
    `;

    overdueLoans.forEach((loan, index) => {
      const daysOverdue = loan.daysPastDue || 0;
      const statusClass = daysOverdue > 30 ? 'collection-danger' : daysOverdue > 7 ? 'collection-warning' : 'collection-warning';
      
      html += `
        <tr style="${index % 2 === 0 ? 'background-color: #F8F9FA;' : ''}">
          <td>${loan.memberName}</td>
          <td style="text-align: center;">${loan.memberDNI || 'N/A'}</td>
          <td style="text-align: center;">${new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
          <td class="${statusClass}" style="text-align: center;">${daysOverdue} días</td>
          <td class="currency">${(loan.weeklyPayment || loan.monthlyPayment || 0).toFixed(2)}</td>
          <td>${loan.memberPhone || 'N/A'}</td>
          <td class="${statusClass}" style="text-align: center;">Vencido</td>
        </tr>
      `;
    });
  }

  // Sección de Próximos Pagos
  if (upcomingPayments.length > 0) {
    html += `
      <tr><td colspan="7">&nbsp;</td></tr>
      <tr><td colspan="7" class="summary-header">PRÓXIMOS PAGOS (7 DÍAS)</td></tr>
      <tr>
        <th class="table-header">Miembro</th>
        <th class="table-header">DNI</th>
        <th class="table-header">Fecha de Pago</th>
        <th class="table-header">Días para Vencer</th>
        <th class="table-header">Monto Cuota</th>
        <th class="table-header">Teléfono</th>
        <th class="table-header">Estado</th>
      </tr>
    `;

    upcomingPayments.forEach((loan, index) => {
      const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      const statusClass = daysUntilDue <= 1 ? 'collection-warning' : 'collection-good';
      
      html += `
        <tr style="${index % 2 === 0 ? 'background-color: #F8F9FA;' : ''}">
          <td>${loan.memberName}</td>
          <td style="text-align: center;">${loan.memberDNI || 'N/A'}</td>
          <td style="text-align: center;">${new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
          <td class="${statusClass}" style="text-align: center;">${daysUntilDue} días</td>
          <td class="currency">${(loan.weeklyPayment || loan.monthlyPayment || 0).toFixed(2)}</td>
          <td>${loan.memberPhone || 'N/A'}</td>
          <td class="${statusClass}" style="text-align: center;">Por Vencer</td>
        </tr>
      `;
    });
  }

  // Total general
  html += `
    <tr><td colspan="7">&nbsp;</td></tr>
    <tr class="total-row">
      <td colspan="4" style="text-align: center;">TOTAL GENERAL A GESTIONAR</td>
      <td class="currency">${(totalOverdueAmount + totalUpcomingAmount).toFixed(2)}</td>
      <td colspan="2">&nbsp;</td>
    </tr>
  `;

  html += `
      </table>
    </body>
    </html>
  `;

  downloadExcelFile(html, filename);
};

export const exportMembersReportWithColors = (members, filename = 'Analisis_Miembros.xls') => {
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        .header { background-color: #1E3A8A; color: white; font-size: 18px; font-weight: bold; text-align: center; }
        .table-header { background-color: #2563EB; color: white; font-weight: bold; text-align: center; }
        .rating-excellent { background-color: #D4EDDA; color: #155724; font-weight: bold; text-align: center; }
        .rating-regular { background-color: #FFF3CD; color: #856404; font-weight: bold; text-align: center; }
        .rating-poor { background-color: #F8D7DA; color: #721C24; font-weight: bold; text-align: center; }
        .even-row { background-color: #F8F9FA; }
        .total-row { background-color: #495057; color: white; font-weight: bold; }
        .currency { text-align: right; mso-number-format: '"S/" #,##0.00'; }
        .number { text-align: right; }
        .summary-section { background-color: #E0F2FE; padding: 15px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
  `;

  // Título
  html += `
    <table>
      <tr><td colspan="10" class="header">ANÁLISIS DE MIEMBROS - BANQUITO SYSTEM</td></tr>
      <tr><td colspan="10" style="text-align: center; padding: 10px;">Generado el: ${new Date().toLocaleString('es-ES')}</td></tr>
  `;

  // Resumen
  const totalMembers = members.length;
  const excellentCount = members.filter(m => m.creditRating === 'green').length;
  const regularCount = members.filter(m => m.creditRating === 'yellow').length;
  const poorCount = members.filter(m => m.creditRating === 'red').length;
  const totalGuarantee = members.reduce((sum, m) => sum + (m.shares * 500), 0);

  html += `
    <tr><td colspan="10">&nbsp;</td></tr>
    <tr><td colspan="10" style="background-color: #E0F2FE; font-weight: bold; font-size: 14px;">RESUMEN ESTADÍSTICO</td></tr>
    <tr style="background-color: #F0F9FF;">
      <td colspan="2"><strong>Total Miembros:</strong></td>
      <td>${totalMembers}</td>
      <td colspan="2"><strong>Calificación Excelente:</strong></td>
      <td class="rating-excellent">${excellentCount} (${(excellentCount/totalMembers*100).toFixed(1)}%)</td>
      <td colspan="2"><strong>Total Garantías:</strong></td>
      <td colspan="2" class="currency">${totalGuarantee.toFixed(2)}</td>
    </tr>
    <tr style="background-color: #F0F9FF;">
      <td colspan="2"><strong>Calificación Regular:</strong></td>
      <td class="rating-regular">${regularCount} (${(regularCount/totalMembers*100).toFixed(1)}%)</td>
      <td colspan="2"><strong>Calificación Riesgo:</strong></td>
      <td class="rating-poor">${poorCount} (${(poorCount/totalMembers*100).toFixed(1)}%)</td>
      <td colspan="2"><strong>Promedio Acciones:</strong></td>
      <td colspan="2">${(members.reduce((sum, m) => sum + m.shares, 0) / totalMembers).toFixed(1)}</td>
    </tr>
    <tr><td colspan="10">&nbsp;</td></tr>
  `;

  // Encabezados de tabla
  html += `
    <tr>
      <th class="table-header">ID</th>
      <th class="table-header">Nombre</th>
      <th class="table-header">DNI</th>
      <th class="table-header">Teléfono</th>
      <th class="table-header">Email</th>
      <th class="table-header">Acciones</th>
      <th class="table-header">Garantía</th>
      <th class="table-header">Calificación</th>
      <th class="table-header">Puntaje</th>
      <th class="table-header">Límite Préstamo</th>
    </tr>
  `;

  // Datos
  members.forEach((member, index) => {
    const guarantee = member.shares * 500;
    const loanLimit = Math.min(8000, guarantee * 0.8);
    const ratingClass = member.creditRating === 'green' ? 'rating-excellent' : 
                       member.creditRating === 'yellow' ? 'rating-regular' : 'rating-poor';
    const ratingText = member.creditRating === 'green' ? 'Excelente' : 
                      member.creditRating === 'yellow' ? 'Regular' : 'Observado';
    
    html += `
      <tr class="${index % 2 === 0 ? 'even-row' : ''}">
        <td style="text-align: center;">${member.id}</td>
        <td>${member.name}</td>
        <td style="text-align: center;">${member.dni}</td>
        <td>${member.phone || 'N/A'}</td>
        <td>${member.email || 'N/A'}</td>
        <td class="number">${member.shares}</td>
        <td class="currency">${guarantee.toFixed(2)}</td>
        <td class="${ratingClass}">${ratingText}</td>
        <td class="number">${member.creditScore || 0}</td>
        <td class="currency">${loanLimit.toFixed(2)}</td>
      </tr>
    `;
  });

  // Totales
  const totalShares = members.reduce((sum, m) => sum + m.shares, 0);
  const avgScore = members.reduce((sum, m) => sum + (m.creditScore || 0), 0) / members.length;

  html += `
    <tr class="total-row">
      <td colspan="5" style="text-align: center;">TOTALES / PROMEDIOS</td>
      <td class="number">${totalShares}</td>
      <td class="currency">${totalGuarantee.toFixed(2)}</td>
      <td style="text-align: center;">-</td>
      <td class="number">${avgScore.toFixed(1)}</td>
      <td style="text-align: center;">-</td>
    </tr>
  `;

  html += `
      </table>
    </body>
    </html>
  `;

  downloadExcelFile(html, filename);
};

export const exportScheduleReportWithColors = (scheduleData, filename = 'Cronograma_Pagos.xls') => {
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        .header { background-color: #1E3A8A; color: white; font-size: 18px; font-weight: bold; text-align: center; }
        .week-header { background-color: #3B82F6; color: white; font-weight: bold; font-size: 14px; }
        .table-header { background-color: #2563EB; color: white; font-weight: bold; text-align: center; }
        .day-column { background-color: #EFF6FF; font-weight: bold; text-align: center; }
        .today-column { background-color: #FEF3C7; font-weight: bold; }
        .even-row { background-color: #F8F9FA; }
        .total-row { background-color: #495057; color: white; font-weight: bold; }
        .currency { text-align: right; mso-number-format: '"S/" #,##0.00'; }
        .status-paid { background-color: #D4EDDA; color: #155724; }
        .status-pending { background-color: #FFF3CD; color: #856404; }
        .status-overdue { background-color: #F8D7DA; color: #721C24; }
      </style>
    </head>
    <body>
  `;

  // Título
  html += `
    <table>
      <tr><td colspan="11" class="header">CRONOGRAMA DE PAGOS - BANQUITO SYSTEM</td></tr>
      <tr><td colspan="11" style="text-align: center; padding: 10px;">Generado el: ${new Date().toLocaleString('es-ES')}</td></tr>
      <tr><td colspan="11">&nbsp;</td></tr>
  `;

  // Tabla de resumen semanal
  html += `
    <tr>
      <th class="table-header">Semana</th>
      <th class="table-header">Fecha Inicio</th>
      <th class="table-header">Lunes</th>
      <th class="table-header">Martes</th>
      <th class="table-header">Miércoles</th>
      <th class="table-header">Jueves</th>
      <th class="table-header">Viernes</th>
      <th class="table-header">Sábado</th>
      <th class="table-header">Domingo</th>
      <th class="table-header">Total Semana</th>
      <th class="table-header"># Pagos</th>
    </tr>
  `;

  // Datos por semana
  const today = new Date().getDay();
  scheduleData.forEach((week, index) => {
    const paymentsByDay = Array(7).fill(0);
    let paymentsCount = 0;
    
    week.loans?.forEach(loan => {
      const dayOfWeek = new Date(loan.dueDate).getDay();
      const payment = loan.weeklyPayment || loan.monthlyPayment || 0;
      paymentsByDay[dayOfWeek] += payment;
      paymentsCount++;
    });

    html += `
      <tr class="${index % 2 === 0 ? 'even-row' : ''}">
        <td style="text-align: center; font-weight: bold;">${week.week}</td>
        <td style="text-align: center;">${week.startDate}</td>
        <td class="currency ${today === 1 ? 'today-column' : ''}">${paymentsByDay[1].toFixed(2)}</td>
        <td class="currency ${today === 2 ? 'today-column' : ''}">${paymentsByDay[2].toFixed(2)}</td>
        <td class="currency ${today === 3 ? 'today-column' : ''}">${paymentsByDay[3].toFixed(2)}</td>
        <td class="currency ${today === 4 ? 'today-column' : ''}">${paymentsByDay[4].toFixed(2)}</td>
        <td class="currency ${today === 5 ? 'today-column' : ''}">${paymentsByDay[5].toFixed(2)}</td>
        <td class="currency ${today === 6 ? 'today-column' : ''}">${paymentsByDay[6].toFixed(2)}</td>
        <td class="currency ${today === 0 ? 'today-column' : ''}">${paymentsByDay[0].toFixed(2)}</td>
        <td class="currency" style="font-weight: bold;">${(week.expectedAmount || 0).toFixed(2)}</td>
        <td style="text-align: center;">${paymentsCount}</td>
      </tr>
    `;
  });

  // Total general
  const grandTotal = scheduleData.reduce((sum, week) => sum + (week.expectedAmount || 0), 0);
  const totalPayments = scheduleData.reduce((sum, week) => sum + (week.loans?.length || 0), 0);

  html += `
    <tr class="total-row">
      <td colspan="9" style="text-align: center;">TOTAL GENERAL</td>
      <td class="currency">${grandTotal.toFixed(2)}</td>
      <td style="text-align: center;">${totalPayments}</td>
    </tr>
  `;

  html += `
      </table>
    </body>
    </html>
  `;

  downloadExcelFile(html, filename);
};

export const exportWeekReportWithColors = (weekData, filename = 'Semana_Cobros.xls') => {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        .header { background-color: #1E3A8A; color: white; font-size: 18px; font-weight: bold; text-align: center; }
        .week-info { background-color: #DBEAFE; font-weight: bold; padding: 10px; }
        .table-header { background-color: #2563EB; color: white; font-weight: bold; text-align: center; }
        .even-row { background-color: #F8F9FA; }
        .currency { text-align: right; mso-number-format: '"S/" #,##0.00'; }
        .number { text-align: right; }
        .total-row { background-color: #495057; color: white; font-weight: bold; }
        .monday { background-color: #FFF3CD; }
        .tuesday { background-color: #D1ECF1; }
        .wednesday { background-color: #D4EDDA; }
        .thursday { background-color: #F8D7DA; }
        .friday { background-color: #E2E3E5; }
        .weekend { background-color: #CCE5FF; }
      </style>
    </head>
    <body>
  `;

  // Título
  html += `
    <table>
      <tr><td colspan="10" class="header">REPORTE DE COBROS - ${weekData.week}</td></tr>
      <tr><td colspan="10" class="week-info">Período: ${weekData.weekRange || weekData.dateRange}</td></tr>
      <tr><td colspan="10" class="week-info">Total de Cobros: ${weekData.paymentsCount} | Monto Total: S/ ${(weekData.expectedAmount || 0).toFixed(2)}</td></tr>
      <tr><td colspan="10">&nbsp;</td></tr>
  `;

  // Encabezados
  html += `
    <tr>
      <th class="table-header">#</th>
      <th class="table-header">Nombre</th>
      <th class="table-header">DNI</th>
      <th class="table-header">Fecha de Pago</th>
      <th class="table-header">Día</th>
      <th class="table-header">Monto Cuota</th>
      <th class="table-header">Teléfono</th>
      <th class="table-header">Email</th>
      <th class="table-header">Cuota #</th>
      <th class="table-header">Monto Total Préstamo</th>
    </tr>
  `;

  // Datos
  if (weekData.loans && weekData.loans.length > 0) {
    weekData.loans.forEach((loan, index) => {
      const dayOfWeek = new Date(loan.dueDate).getDay();
      const dayName = dayNames[dayOfWeek];
      let dayClass = '';
      
      // Asignar clase según el día
      switch(dayOfWeek) {
        case 1: dayClass = 'monday'; break;
        case 2: dayClass = 'tuesday'; break;
        case 3: dayClass = 'wednesday'; break;
        case 4: dayClass = 'thursday'; break;
        case 5: dayClass = 'friday'; break;
        case 0:
        case 6: dayClass = 'weekend'; break;
      }
      
      html += `
        <tr class="${index % 2 === 0 ? 'even-row' : ''}">
          <td style="text-align: center;">${index + 1}</td>
          <td>${loan.memberName}</td>
          <td style="text-align: center;">${loan.memberDNI || 'N/A'}</td>
          <td style="text-align: center;">${new Date(loan.dueDate).toLocaleDateString('es-ES')}</td>
          <td class="${dayClass}" style="text-align: center;">${dayName}</td>
          <td class="currency">${(loan.weeklyPayment || loan.monthlyPayment || 0).toFixed(2)}</td>
          <td>${loan.memberPhone || 'N/A'}</td>
          <td>${loan.memberEmail || 'N/A'}</td>
          <td class="number">${loan.currentWeek || loan.currentInstallment || 1}</td>
          <td class="currency">${(loan.originalAmount || 0).toFixed(2)}</td>
        </tr>
      `;
    });
    
    // Total
    const totalAmount = weekData.loans.reduce((sum, loan) => 
      sum + (loan.weeklyPayment || loan.monthlyPayment || 0), 0
    );
    
    html += `
      <tr class="total-row">
        <td colspan="5" style="text-align: center;">TOTAL</td>
        <td class="currency">${totalAmount.toFixed(2)}</td>
        <td colspan="4">&nbsp;</td>
      </tr>
    `;
  }

  html += `
      </table>
    </body>
    </html>
  `;

  const finalFilename = filename || `Cobros_${weekData.week}_${new Date().toISOString().split('T')[0]}.xls`;
  downloadExcelFile(html, finalFilename);
};

// Función auxiliar para descargar el archivo
const downloadExcelFile = (htmlContent, filename) => {
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  
  // Asegurar que use extensión .xls
  let finalFilename = filename;
  if (filename.endsWith('.xlsx')) {
    finalFilename = filename.replace('.xlsx', '.xls');
  } else if (!filename.endsWith('.xls')) {
    finalFilename = filename + '.xls';
  }
  
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  
  // Notificación
  const message = `✅ Archivo Excel "${finalFilename}" generado exitosamente con colores!`;
  console.log(message);
  
  // Mensaje sobre la advertencia de Excel
  const excelInfo = `ℹ️ Al abrir en Excel: Aparecerá un mensaje sobre el formato. Haz clic en "SÍ" para continuar.`;
  
  if (window.showNotification) {
    window.showNotification(message + '\n' + excelInfo, 'success');
  } else {
    alert(message + '\n\n' + excelInfo);
  }
};