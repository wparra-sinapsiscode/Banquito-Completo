import * as XLSX from 'xlsx';

// Función para generar archivos Excel reales con colores
export const generateExcelWithColors = (data, columns, filename, sheetName = 'Datos') => {
  // Crear un nuevo libro
  const wb = XLSX.utils.book_new();
  
  // Preparar los datos para la hoja
  const wsData = [];
  
  // Agregar título
  wsData.push([`REPORTE DE ${sheetName.toUpperCase()} - BANQUITO SYSTEM`]);
  wsData.push([`Generado el: ${new Date().toLocaleString('es-ES')}`]);
  wsData.push([]); // Fila vacía
  
  // Agregar encabezados
  const headers = columns.map(col => col.header);
  wsData.push(headers);
  
  // Agregar datos
  data.forEach(row => {
    const rowData = columns.map(col => {
      if (col.accessor) {
        return row[col.accessor];
      } else if (col.getValue) {
        return col.getValue(row);
      }
      return '';
    });
    wsData.push(rowData);
  });
  
  // Agregar totales si hay columnas numéricas
  const numericColumns = columns.filter(col => col.type === 'number' || col.type === 'currency');
  if (numericColumns.length > 0 && data.length > 0) {
    const totalRow = columns.map((col, index) => {
      if (index === 0) return 'TOTALES';
      if (col.type === 'number' || col.type === 'currency') {
        return data.reduce((sum, row) => {
          const value = col.accessor ? row[col.accessor] : 0;
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
      }
      return '';
    });
    wsData.push(totalRow);
  }
  
  // Crear hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Aplicar estilos básicos (ancho de columnas)
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;
  
  // Combinar celdas del título
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }
  ];
  
  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generar el archivo Excel
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Descargar el archivo
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  
  // Notificación
  const message = `✅ Archivo Excel "${link.download}" generado exitosamente!`;
  console.log(message);
  
  if (window.showNotification) {
    window.showNotification(message, 'success');
  } else {
    alert(message);
  }
};

// Función específica para exportar reportes de cobranza
export const exportCollectionReport = (collectionData, filename = 'Reporte_Cobranza.xlsx') => {
  const { overdueLoans = [], upcomingPayments = [], totalOverdueAmount = 0, totalUpcomingAmount = 0 } = collectionData || {};
  
  // Preparar datos para la exportación
  const allData = [];
  
  // Sección de resumen
  allData.push({
    tipo: 'RESUMEN',
    descripcion: 'Préstamos Vencidos',
    cantidad: overdueLoans.length,
    monto: totalOverdueAmount,
    porcentaje: ''
  });
  
  allData.push({
    tipo: 'RESUMEN',
    descripcion: 'Próximos Pagos (7 días)',
    cantidad: upcomingPayments.length,
    monto: totalUpcomingAmount,
    porcentaje: ''
  });
  
  const totalLoans = overdueLoans.length + upcomingPayments.length;
  const overdueRate = totalLoans > 0 ? ((overdueLoans.length / totalLoans) * 100).toFixed(2) : 0;
  
  allData.push({
    tipo: 'RESUMEN',
    descripcion: 'Tasa de Morosidad',
    cantidad: '',
    monto: '',
    porcentaje: `${overdueRate}%`
  });
  
  // Agregar línea separadora
  allData.push({});
  
  // Agregar préstamos vencidos
  overdueLoans.forEach(loan => {
    allData.push({
      tipo: 'VENCIDO',
      nombre: loan.memberName,
      dni: loan.memberDNI || 'N/A',
      fechaVencimiento: new Date(loan.dueDate).toLocaleDateString('es-ES'),
      diasVencido: loan.daysPastDue || 0,
      montoCuota: loan.weeklyPayment || loan.monthlyPayment || 0,
      telefono: loan.memberPhone || 'N/A',
      estado: 'Vencido'
    });
  });
  
  // Agregar línea separadora
  if (overdueLoans.length > 0 && upcomingPayments.length > 0) {
    allData.push({});
  }
  
  // Agregar próximos pagos
  upcomingPayments.forEach(loan => {
    const daysUntilDue = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    allData.push({
      tipo: 'PRÓXIMO',
      nombre: loan.memberName,
      dni: loan.memberDNI || 'N/A',
      fechaPago: new Date(loan.dueDate).toLocaleDateString('es-ES'),
      diasParaVencer: daysUntilDue,
      montoCuota: loan.weeklyPayment || loan.monthlyPayment || 0,
      telefono: loan.memberPhone || 'N/A',
      estado: 'Por Vencer'
    });
  });
  
  // Definir columnas según el tipo de datos
  const columns = [
    { header: 'Tipo', accessor: 'tipo', width: 12 },
    { header: 'Nombre/Descripción', accessor: row => row.nombre || row.descripcion || '', width: 30 },
    { header: 'DNI', accessor: 'dni', width: 12 },
    { header: 'Fecha', accessor: row => row.fechaVencimiento || row.fechaPago || '', width: 12 },
    { header: 'Días', accessor: row => row.diasVencido || row.diasParaVencer || row.cantidad || '', width: 10 },
    { header: 'Monto', accessor: row => row.montoCuota || row.monto || '', type: 'currency', width: 15 },
    { header: 'Teléfono', accessor: 'telefono', width: 15 },
    { header: 'Estado', accessor: row => row.estado || row.porcentaje || '', width: 12 }
  ];
  
  generateExcelWithColors(allData, columns, filename, 'Cobranza');
};

// Función para exportar análisis de miembros
export const exportMembersAnalysis = (members, filename = 'Analisis_Miembros.xlsx') => {
  const columns = [
    { header: 'ID', accessor: 'id', width: 10 },
    { header: 'Nombre', accessor: 'name', width: 25 },
    { header: 'DNI', accessor: 'dni', width: 12 },
    { header: 'Teléfono', accessor: 'phone', width: 15 },
    { header: 'Email', accessor: 'email', width: 25 },
    { header: 'Acciones', accessor: 'shares', type: 'number', width: 10 },
    { header: 'Garantía', accessor: row => row.shares * 500, type: 'currency', width: 12 },
    { header: 'Calificación', accessor: row => {
      if (row.creditRating === 'green') return 'Excelente';
      if (row.creditRating === 'yellow') return 'Regular';
      return 'Observado';
    }, width: 12 },
    { header: 'Puntaje', accessor: 'creditScore', type: 'number', width: 10 },
    { header: 'Límite Préstamo', accessor: row => Math.min(8000, row.shares * 500 * 0.8), type: 'currency', width: 15 }
  ];
  
  generateExcelWithColors(members, columns, filename, 'Miembros');
};

// Función para exportar cronograma
export const exportSchedule = (scheduleData, filename = 'Cronograma_Pagos.xlsx') => {
  // Aplanar los datos del cronograma
  const flatData = [];
  
  scheduleData.forEach(week => {
    const paymentsByDay = {
      lunes: 0, martes: 0, miercoles: 0, jueves: 0, 
      viernes: 0, sabado: 0, domingo: 0
    };
    
    week.loans?.forEach(loan => {
      const dayOfWeek = new Date(loan.dueDate).getDay();
      const payment = loan.weeklyPayment || loan.monthlyPayment || 0;
      
      switch(dayOfWeek) {
        case 0: paymentsByDay.domingo += payment; break;
        case 1: paymentsByDay.lunes += payment; break;
        case 2: paymentsByDay.martes += payment; break;
        case 3: paymentsByDay.miercoles += payment; break;
        case 4: paymentsByDay.jueves += payment; break;
        case 5: paymentsByDay.viernes += payment; break;
        case 6: paymentsByDay.sabado += payment; break;
      }
    });
    
    flatData.push({
      semana: week.week,
      fechaInicio: week.startDate,
      lunes: paymentsByDay.lunes,
      martes: paymentsByDay.martes,
      miercoles: paymentsByDay.miercoles,
      jueves: paymentsByDay.jueves,
      viernes: paymentsByDay.viernes,
      sabado: paymentsByDay.sabado,
      domingo: paymentsByDay.domingo,
      total: week.expectedAmount || 0,
      cantidadPagos: week.loans?.length || 0
    });
  });
  
  const columns = [
    { header: 'Semana', accessor: 'semana', width: 15 },
    { header: 'Fecha Inicio', accessor: 'fechaInicio', width: 12 },
    { header: 'Lunes', accessor: 'lunes', type: 'currency', width: 12 },
    { header: 'Martes', accessor: 'martes', type: 'currency', width: 12 },
    { header: 'Miércoles', accessor: 'miercoles', type: 'currency', width: 12 },
    { header: 'Jueves', accessor: 'jueves', type: 'currency', width: 12 },
    { header: 'Viernes', accessor: 'viernes', type: 'currency', width: 12 },
    { header: 'Sábado', accessor: 'sabado', type: 'currency', width: 12 },
    { header: 'Domingo', accessor: 'domingo', type: 'currency', width: 12 },
    { header: 'Total Semana', accessor: 'total', type: 'currency', width: 15 },
    { header: '# Pagos', accessor: 'cantidadPagos', type: 'number', width: 10 }
  ];
  
  generateExcelWithColors(flatData, columns, filename, 'Cronograma');
};

// Función para exportar cobros semanales
export const exportWeeklyCollections = (weekData, filename) => {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  const processedData = weekData.loans?.map((loan, index) => {
    const dayOfWeek = new Date(loan.dueDate).getDay();
    return {
      numero: index + 1,
      nombre: loan.memberName,
      dni: loan.memberDNI || 'N/A',
      fechaPago: new Date(loan.dueDate).toLocaleDateString('es-ES'),
      dia: dayNames[dayOfWeek],
      montoCuota: loan.weeklyPayment || loan.monthlyPayment || 0,
      telefono: loan.memberPhone || 'N/A',
      email: loan.memberEmail || 'N/A',
      cuotaNumero: loan.currentWeek || loan.currentInstallment || 1,
      montoTotal: loan.originalAmount || 0
    };
  }) || [];
  
  const columns = [
    { header: '#', accessor: 'numero', width: 5 },
    { header: 'Nombre', accessor: 'nombre', width: 25 },
    { header: 'DNI', accessor: 'dni', width: 12 },
    { header: 'Fecha de Pago', accessor: 'fechaPago', width: 12 },
    { header: 'Día', accessor: 'dia', width: 10 },
    { header: 'Monto Cuota', accessor: 'montoCuota', type: 'currency', width: 12 },
    { header: 'Teléfono', accessor: 'telefono', width: 15 },
    { header: 'Email', accessor: 'email', width: 25 },
    { header: 'Cuota #', accessor: 'cuotaNumero', type: 'number', width: 8 },
    { header: 'Monto Total', accessor: 'montoTotal', type: 'currency', width: 12 }
  ];
  
  const finalFilename = filename || `Cobros_${weekData.week}_${new Date().toISOString().split('T')[0]}.xlsx`;
  generateExcelWithColors(processedData, columns, finalFilename, weekData.week);
};