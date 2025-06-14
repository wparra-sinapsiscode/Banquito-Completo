import * as XLSX from 'xlsx';

// Estilos comunes para Excel
export const EXCEL_STYLES = {
  header: {
    font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1E3A8A" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "000000" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "medium", color: { rgb: "000000" } },
      right: { style: "medium", color: { rgb: "000000" } }
    }
  },
  subHeader: {
    font: { bold: true, sz: 14, color: { rgb: "1E3A8A" } },
    fill: { fgColor: { rgb: "DBEAFE" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "3B82F6" } },
      bottom: { style: "thin", color: { rgb: "3B82F6" } },
      left: { style: "thin", color: { rgb: "3B82F6" } },
      right: { style: "thin", color: { rgb: "3B82F6" } }
    }
  },
  tableHeader: {
    font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "2563EB" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "1E3A8A" } },
      bottom: { style: "medium", color: { rgb: "1E3A8A" } },
      left: { style: "thin", color: { rgb: "1E3A8A" } },
      right: { style: "thin", color: { rgb: "1E3A8A" } }
    }
  },
  dataCell: {
    font: { sz: 11 },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "BDC3C7" } },
      bottom: { style: "thin", color: { rgb: "BDC3C7" } },
      left: { style: "thin", color: { rgb: "BDC3C7" } },
      right: { style: "thin", color: { rgb: "BDC3C7" } }
    }
  },
  numberCell: {
    font: { sz: 11 },
    alignment: { horizontal: "right", vertical: "center" },
    numFmt: "#,##0.00",
    border: {
      top: { style: "thin", color: { rgb: "BDC3C7" } },
      bottom: { style: "thin", color: { rgb: "BDC3C7" } },
      left: { style: "thin", color: { rgb: "BDC3C7" } },
      right: { style: "thin", color: { rgb: "BDC3C7" } }
    }
  },
  dateCell: {
    font: { sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
    numFmt: "dd/mm/yyyy",
    border: {
      top: { style: "thin", color: { rgb: "BDC3C7" } },
      bottom: { style: "thin", color: { rgb: "BDC3C7" } },
      left: { style: "thin", color: { rgb: "BDC3C7" } },
      right: { style: "thin", color: { rgb: "BDC3C7" } }
    }
  },
  summaryCell: {
    font: { bold: true, sz: 12, color: { rgb: "1E3A8A" } },
    fill: { fgColor: { rgb: "E0F2FE" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "3B82F6" } },
      bottom: { style: "medium", color: { rgb: "3B82F6" } },
      left: { style: "medium", color: { rgb: "3B82F6" } },
      right: { style: "medium", color: { rgb: "3B82F6" } }
    }
  },
  greenStatus: {
    font: { sz: 11, color: { rgb: "27AE60" } },
    fill: { fgColor: { rgb: "D5F4E6" } }
  },
  yellowStatus: {
    font: { sz: 11, color: { rgb: "F39C12" } },
    fill: { fgColor: { rgb: "FCF3CF" } }
  },
  redStatus: {
    font: { sz: 11, color: { rgb: "E74C3C" } },
    fill: { fgColor: { rgb: "FADBD8" } }
  }
};

// Función para aplicar estilos a una celda
export const applyStyle = (ws, cellRef, style) => {
  if (!ws[cellRef]) ws[cellRef] = {};
  ws[cellRef].s = style;
};

// Función para aplicar estilos a un rango de celdas
export const applyStyleToRange = (ws, startRow, startCol, endRow, endCol, style) => {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      applyStyle(ws, cellRef, style);
    }
  }
};

// Función para crear encabezados con estilo
export const createStyledHeader = (ws, row, col, value, colSpan = 1, style = EXCEL_STYLES.header) => {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  ws[cellRef] = { v: value, t: 's', s: style };
  
  if (colSpan > 1) {
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({
      s: { r: row, c: col },
      e: { r: row, c: col + colSpan - 1 }
    });
    
    // Aplicar estilo a todas las celdas del merge
    for (let i = col + 1; i < col + colSpan; i++) {
      const mergedCellRef = XLSX.utils.encode_cell({ r: row, c: i });
      ws[mergedCellRef] = { v: '', t: 's', s: style };
    }
  }
};

// Función para formatear números con separador de miles
export const formatNumber = (num) => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num || 0);
};

// Función para formatear fechas
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Función para crear una hoja de resumen ejecutivo
export const createSummarySheet = (title, data) => {
  const ws = XLSX.utils.aoa_to_sheet([]);
  let currentRow = 0;
  
  // Título principal
  createStyledHeader(ws, currentRow, 0, title, 4);
  currentRow += 2;
  
  // Fecha de generación
  ws[XLSX.utils.encode_cell({ r: currentRow, c: 0 })] = {
    v: `Fecha de generación: ${new Date().toLocaleString('es-ES')}`,
    t: 's',
    s: EXCEL_STYLES.subHeader
  };
  currentRow += 2;
  
  // Agregar datos
  data.forEach(section => {
    // Título de sección
    createStyledHeader(ws, currentRow, 0, section.title, 2, EXCEL_STYLES.subHeader);
    currentRow += 1;
    
    // Datos de la sección
    section.data.forEach(row => {
      const rowData = Array.isArray(row) ? row : [row.label, row.value];
      rowData.forEach((cell, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: currentRow, c: colIndex });
        
        // Determinar el tipo de dato y aplicar estilo apropiado
        let style = EXCEL_STYLES.dataCell;
        if (typeof cell === 'number') {
          style = EXCEL_STYLES.numberCell;
        } else if (cell instanceof Date) {
          style = EXCEL_STYLES.dateCell;
        }
        
        ws[cellRef] = {
          v: cell,
          t: typeof cell === 'number' ? 'n' : 's',
          s: style
        };
      });
      currentRow++;
    });
    
    currentRow += 1; // Espacio entre secciones
  });
  
  // Establecer anchos de columna
  ws['!cols'] = [
    { wch: 40 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 }
  ];
  
  // Establecer el rango de la hoja
  if (currentRow > 0) {
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: currentRow - 1, c: 3 }
    });
  }
  
  return ws;
};

// Función para exportar tabla con formato avanzado
export const exportTableToExcel = (data, columns, filename, sheetName = 'Datos') => {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: sheetName,
    Subject: "Reporte Banquito System",
    Author: "Banquito System",
    CreatedDate: new Date()
  };
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Título de la hoja (fila 0)
  createStyledHeader(ws, 0, 0, `REPORTE DE ${sheetName.toUpperCase()} - BANQUITO SYSTEM`, columns.length);
  
  // Fecha de generación (fila 1)
  const dateCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
  ws[dateCell] = {
    v: `Generado el: ${new Date().toLocaleString('es-ES')}`,
    t: 's',
    s: {
      font: { sz: 10, italic: true },
      alignment: { horizontal: "left" }
    }
  };
  
  // Espacio (fila 2)
  
  // Agregar encabezados (fila 3)
  columns.forEach((col, index) => {
    const cellRef = XLSX.utils.encode_cell({ r: 3, c: index });
    ws[cellRef] = {
      v: col.header,
      t: 's',
      s: EXCEL_STYLES.tableHeader
    };
  });
  
  // Agregar datos (desde fila 4)
  data.forEach((row, rowIndex) => {
    columns.forEach((col, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 4, c: colIndex });
      const value = col.accessor ? row[col.accessor] : col.getValue ? col.getValue(row) : '';
      
      // Aplicar formato según el tipo de columna
      let style = { ...EXCEL_STYLES.dataCell };
      
      // Alternar colores de fila
      if (rowIndex % 2 === 0) {
        style.fill = { fgColor: { rgb: "F8F9FA" } };
      }
      
      if (col.type === 'number' || col.type === 'currency') {
        style = { ...EXCEL_STYLES.numberCell };
        if (rowIndex % 2 === 0) {
          style.fill = { fgColor: { rgb: "F8F9FA" } };
        }
      } else if (col.type === 'date') {
        style = { ...EXCEL_STYLES.dateCell };
        if (rowIndex % 2 === 0) {
          style.fill = { fgColor: { rgb: "F8F9FA" } };
        }
      } else if (col.type === 'status') {
        // Aplicar colores según el estado
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes('al día') || valueStr.includes('activo') || valueStr.includes('pagado') || valueStr.includes('excelente')) {
          style = { 
            ...style, 
            font: { sz: 11, bold: true, color: { rgb: "155724" } },
            fill: { fgColor: { rgb: "D4EDDA" } }
          };
        } else if (valueStr.includes('pendiente') || valueStr.includes('regular') || valueStr.includes('próximo')) {
          style = { 
            ...style, 
            font: { sz: 11, bold: true, color: { rgb: "856404" } },
            fill: { fgColor: { rgb: "FFF3CD" } }
          };
        } else if (valueStr.includes('vencido') || valueStr.includes('mora') || valueStr.includes('observado') || valueStr.includes('riesgo')) {
          style = { 
            ...style, 
            font: { sz: 11, bold: true, color: { rgb: "721C24" } },
            fill: { fgColor: { rgb: "F8D7DA" } }
          };
        }
      }
      
      // Aplicar colores especiales para columnas específicas
      if (col.header === 'Calificación' || col.header === 'Estado') {
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes('excelente') || valueStr.includes('verde')) {
          style = { 
            ...style, 
            font: { sz: 11, bold: true, color: { rgb: "155724" } },
            fill: { fgColor: { rgb: "D4EDDA" } }
          };
        } else if (valueStr.includes('regular') || valueStr.includes('amarillo')) {
          style = { 
            ...style, 
            font: { sz: 11, bold: true, color: { rgb: "856404" } },
            fill: { fgColor: { rgb: "FFF3CD" } }
          };
        } else if (valueStr.includes('observado') || valueStr.includes('rojo') || valueStr.includes('riesgo')) {
          style = { 
            ...style, 
            font: { sz: 11, bold: true, color: { rgb: "721C24" } },
            fill: { fgColor: { rgb: "F8D7DA" } }
          };
        }
      }
      
      ws[cellRef] = {
        v: value,
        t: typeof value === 'number' ? 'n' : 's',
        s: style
      };
    });
  });
  
  // Agregar fila de totales si hay columnas numéricas
  const numericColumns = columns.filter(col => col.type === 'number' || col.type === 'currency');
  if (numericColumns.length > 0 && data.length > 0) {
    const totalRow = data.length + 4;
    
    // Celda "TOTALES"
    const totalLabelCell = XLSX.utils.encode_cell({ r: totalRow, c: 0 });
    ws[totalLabelCell] = {
      v: 'TOTALES',
      t: 's',
      s: {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "495057" } },
        alignment: { horizontal: "right" },
        border: EXCEL_STYLES.dataCell.border
      }
    };
    
    // Calcular y mostrar totales
    columns.forEach((col, colIndex) => {
      if (col.type === 'number' || col.type === 'currency') {
        const total = data.reduce((sum, row) => {
          const value = col.accessor ? row[col.accessor] : 0;
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
        
        const cellRef = XLSX.utils.encode_cell({ r: totalRow, c: colIndex });
        ws[cellRef] = {
          v: total,
          t: 'n',
          s: {
            font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "495057" } },
            alignment: { horizontal: "right" },
            border: EXCEL_STYLES.dataCell.border,
            numFmt: col.type === 'currency' ? '"S/" #,##0.00' : '#,##0'
          }
        };
      } else if (colIndex > 0) {
        // Celdas vacías con estilo
        const cellRef = XLSX.utils.encode_cell({ r: totalRow, c: colIndex });
        ws[cellRef] = {
          v: '',
          t: 's',
          s: {
            fill: { fgColor: { rgb: "495057" } },
            border: EXCEL_STYLES.dataCell.border
          }
        };
      }
    });
  }
  
  // Establecer anchos de columna
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));
  
  // Establecer el rango de la hoja si no existe
  const lastRow = data.length > 0 ? data.length + (numericColumns.length > 0 ? 5 : 4) : 4;
  if (!ws['!ref']) {
    ws['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: lastRow, c: columns.length - 1 }
    });
  }
  
  // Agregar autofiltro solo si hay datos (solo en el rango de datos, no incluir totales)
  if (data.length > 0) {
    const filterRange = {
      s: { r: 3, c: 0 },
      e: { r: data.length + 3, c: columns.length - 1 }
    };
    ws['!autofilter'] = { ref: XLSX.utils.encode_range(filterRange) };
  }
  
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Escribir el archivo con opciones que preserven los estilos
  XLSX.writeFile(wb, filename, { 
    bookType: 'xlsx',
    bookSST: true,
    type: 'binary',
    cellStyles: true
  });
};

// Función para importar datos desde Excel
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result = {};
        
        // Leer todas las hojas
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            dateNF: 'dd/mm/yyyy'
          });
          
          // Procesar datos (asumiendo que la primera fila son encabezados)
          if (jsonData.length > 0) {
            const headers = jsonData[0];
            const rows = jsonData.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
            
            result[sheetName] = {
              headers,
              data: rows
            };
          }
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Función para generar reporte completo con múltiples hojas
export const generateCompleteReport = (wb, reportData) => {
  // Hoja de resumen
  if (reportData.summary) {
    const summaryWs = createSummarySheet(reportData.title, reportData.summary);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
  }
  
  // Hojas de datos
  reportData.sheets?.forEach(sheet => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    let currentRow = 0;
    
    // Título de la hoja
    if (sheet.title) {
      createStyledHeader(ws, currentRow, 0, sheet.title, sheet.columns?.length || 4);
      currentRow += 2;
    }
    
    // Encabezados de tabla
    if (sheet.headers) {
      sheet.headers.forEach((header, col) => {
        const cellRef = XLSX.utils.encode_cell({ r: currentRow, c: col });
        ws[cellRef] = {
          v: header,
          t: 's',
          s: EXCEL_STYLES.tableHeader
        };
      });
      currentRow++;
    }
    
    // Datos
    if (sheet.data) {
      sheet.data.forEach((row, rowIndex) => {
        row.forEach((cell, col) => {
          const cellRef = XLSX.utils.encode_cell({ r: currentRow, c: col });
          let style = { ...EXCEL_STYLES.dataCell };
          
          // Alternar colores de fila
          if (rowIndex % 2 === 0) {
            style.fill = { fgColor: { rgb: "F8F9FA" } };
          }
          
          // Aplicar estilos especiales según el contenido
          if (typeof cell === 'number') {
            style = { ...EXCEL_STYLES.numberCell };
            if (rowIndex % 2 === 0) {
              style.fill = { fgColor: { rgb: "F8F9FA" } };
            }
          } else if (sheet.columnTypes && sheet.columnTypes[col] === 'date') {
            style = { ...EXCEL_STYLES.dateCell };
            if (rowIndex % 2 === 0) {
              style.fill = { fgColor: { rgb: "F8F9FA" } };
            }
          } else if (sheet.columnTypes && sheet.columnTypes[col] === 'currency') {
            style = { 
              ...EXCEL_STYLES.numberCell,
              numFmt: '"S/" #,##0.00'
            };
            if (rowIndex % 2 === 0) {
              style.fill = { fgColor: { rgb: "F8F9FA" } };
            }
          } else if (sheet.columnTypes && sheet.columnTypes[col] === 'status') {
            // Aplicar color según el valor
            const cellStr = String(cell).toLowerCase();
            if (cellStr.includes('activo') || cellStr.includes('pagado') || cellStr.includes('al día') || cellStr.includes('excelente')) {
              style = { 
                ...style,
                font: { sz: 10, bold: true, color: { rgb: "155724" } },
                fill: { fgColor: { rgb: "D4EDDA" } }
              };
            } else if (cellStr.includes('pendiente') || cellStr.includes('regular') || cellStr.includes('próximo')) {
              style = { 
                ...style,
                font: { sz: 10, bold: true, color: { rgb: "856404" } },
                fill: { fgColor: { rgb: "FFF3CD" } }
              };
            } else if (cellStr.includes('vencido') || cellStr.includes('mora') || cellStr.includes('urgente') || cellStr.includes('riesgo')) {
              style = { 
                ...style,
                font: { sz: 10, bold: true, color: { rgb: "721C24" } },
                fill: { fgColor: { rgb: "F8D7DA" } }
              };
            }
          }
          
          ws[cellRef] = {
            v: cell,
            t: typeof cell === 'number' ? 'n' : 's',
            s: style
          };
        });
        currentRow++;
      });
    }
    
    // Establecer anchos de columna
    if (sheet.columnWidths) {
      ws['!cols'] = sheet.columnWidths.map(width => ({ wch: width }));
    }
    
    // Establecer el rango de la hoja si no existe
    if (!ws['!ref'] && currentRow > 0) {
      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: currentRow - 1, c: Math.max(...(sheet.columnWidths?.map((_, i) => i) || [0])) }
      });
    }
    
    // Agregar autofiltro si está habilitado
    if (sheet.autoFilter && ws['!ref']) {
      try {
        const range = XLSX.utils.decode_range(ws['!ref']);
        ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
      } catch (e) {
        console.warn('No se pudo agregar autofiltro:', e);
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  
  return wb;
};

// Función helper para mostrar diálogo de guardado con nombre sugerido
export const saveExcelFile = (wb, suggestedName) => {
  const filename = `${suggestedName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Escribir el archivo con opciones que preserven los estilos
  XLSX.writeFile(wb, filename, { 
    bookType: 'xlsx',
    bookSST: true,
    type: 'binary',
    cellStyles: true
  });
  
  // Mostrar notificación de éxito
  const message = `✅ Archivo Excel "${filename}" generado exitosamente!`;
  console.log(message);
  
  // Si existe una función de notificación global, usarla
  if (window.showNotification) {
    window.showNotification(message, 'success');
  } else {
    alert(message);
  }
};