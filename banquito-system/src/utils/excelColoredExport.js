// Función alternativa para generar Excel real con colores usando XLSX
import * as XLSX from 'xlsx';

export const exportToExcelWithRealColors = (data, columns, filename, sheetName = 'Datos') => {
  // Crear un nuevo libro
  const wb = XLSX.utils.book_new();
  
  // Preparar los datos para la hoja
  const wsData = [];
  
  // Título principal
  wsData.push([`REPORTE DE ${sheetName.toUpperCase()} - BANQUITO SYSTEM`]);
  wsData.push([`Generado el: ${new Date().toLocaleString('es-ES')}`]);
  wsData.push([]); // Fila vacía
  
  // Headers
  const headers = columns.map(col => col.header);
  wsData.push(headers);
  
  // Datos
  let totalRow = new Array(columns.length).fill('');
  const numericTotals = {};
  
  data.forEach(row => {
    const rowData = columns.map((col, index) => {
      const value = col.accessor ? row[col.accessor] : col.getValue ? col.getValue(row) : '';
      
      // Acumular totales para columnas numéricas
      if ((col.type === 'number' || col.type === 'currency') && typeof value === 'number') {
        if (!numericTotals[index]) numericTotals[index] = 0;
        numericTotals[index] += value;
      }
      
      // Formatear valores
      if (col.type === 'currency' && typeof value === 'number') {
        return value;
      } else if (col.type === 'date' && value) {
        return new Date(value).toLocaleDateString('es-ES');
      }
      
      return value;
    });
    wsData.push(rowData);
  });
  
  // Agregar fila de totales si hay columnas numéricas
  if (Object.keys(numericTotals).length > 0) {
    columns.forEach((col, index) => {
      if (index === 0) {
        totalRow[index] = 'TOTALES';
      } else if (numericTotals[index] !== undefined) {
        totalRow[index] = numericTotals[index];
      }
    });
    wsData.push(totalRow);
  }
  
  // Crear la hoja
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Establecer anchos de columna
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;
  
  // Merge del título
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } }
  ];
  
  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Escribir el archivo
  XLSX.writeFile(wb, filename);
  
  // Notificación
  const message = `✅ Archivo Excel "${filename}" generado exitosamente!`;
  console.log(message);
  
  if (window.showNotification) {
    window.showNotification(message, 'success');
  } else {
    alert(message);
  }
};

// Función para generar un archivo HTML estilizado que Excel pueda abrir
export const exportToStyledHTML = (data, columns, filename, sheetName = 'Datos') => {
  let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${sheetName}</title>
    <style type="text/css">
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #2563EB; color: white; font-weight: bold; text-align: center; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .title { font-size: 20px; font-weight: bold; color: #1E3A8A; margin-bottom: 10px; }
        .subtitle { font-size: 14px; color: #666; margin-bottom: 20px; }
        .number { text-align: right; }
        .currency { text-align: right; }
        .status-green { background-color: #D4EDDA !important; color: #155724; font-weight: bold; }
        .status-yellow { background-color: #FFF3CD !important; color: #856404; font-weight: bold; }
        .status-red { background-color: #F8D7DA !important; color: #721C24; font-weight: bold; }
        .total-row { background-color: #495057; color: white; font-weight: bold; }
        .total-row td { color: white !important; }
    </style>
</head>
<body>
    <div class="title">REPORTE DE ${sheetName.toUpperCase()} - BANQUITO SYSTEM</div>
    <div class="subtitle">Generado el: ${new Date().toLocaleString('es-ES')}</div>
    
    <table>
        <thead>
            <tr>`;
  
  // Headers
  columns.forEach(col => {
    html += `<th>${col.header}</th>`;
  });
  
  html += `
            </tr>
        </thead>
        <tbody>`;
  
  // Datos
  data.forEach((row, rowIndex) => {
    html += '<tr>';
    
    columns.forEach(col => {
      const value = col.accessor ? row[col.accessor] : col.getValue ? col.getValue(row) : '';
      let cellClass = '';
      let displayValue = value;
      
      // Aplicar clases según el tipo
      if (col.type === 'number') {
        cellClass = 'number';
      } else if (col.type === 'currency') {
        cellClass = 'currency';
        if (typeof value === 'number') {
          displayValue = `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      } else if (col.type === 'date' && value) {
        displayValue = new Date(value).toLocaleDateString('es-ES');
      } else if (col.type === 'status' || col.header === 'Estado' || col.header === 'Calificación') {
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes('al día') || valueStr.includes('activo') || 
            valueStr.includes('pagado') || valueStr.includes('excelente')) {
          cellClass = 'status-green';
        } else if (valueStr.includes('pendiente') || valueStr.includes('regular')) {
          cellClass = 'status-yellow';
        } else if (valueStr.includes('vencido') || valueStr.includes('mora') || 
                   valueStr.includes('observado') || valueStr.includes('riesgo')) {
          cellClass = 'status-red';
        }
      }
      
      html += `<td class="${cellClass}">${displayValue}</td>`;
    });
    
    html += '</tr>';
  });
  
  // Fila de totales
  const numericColumns = columns.filter(col => col.type === 'number' || col.type === 'currency');
  if (numericColumns.length > 0) {
    html += '<tr class="total-row">';
    
    columns.forEach((col, index) => {
      if (index === 0) {
        html += '<td>TOTALES</td>';
      } else if (col.type === 'number' || col.type === 'currency') {
        const total = data.reduce((sum, row) => {
          const value = col.accessor ? row[col.accessor] : 0;
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
        
        if (col.type === 'currency') {
          html += `<td class="currency">S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
        } else {
          html += `<td class="number">${total}</td>`;
        }
      } else {
        html += '<td></td>';
      }
    });
    
    html += '</tr>';
  }
  
  html += `
        </tbody>
    </table>
</body>
</html>`;
  
  // Crear y descargar el archivo
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.html') ? filename : filename + '.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  
  // Notificación
  const message = `✅ Archivo "${link.download}" generado exitosamente!`;
  console.log(message);
  
  if (window.showNotification) {
    window.showNotification(message, 'success');
  } else {
    alert(message + '\n\nPuedes abrirlo con Excel manteniendo todos los colores y formatos.');
  }
};