import * as XLSX from 'xlsx';

// Función mejorada para exportar tablas con colores usando HTML
export const exportTableToExcelWithColors = (data, columns, filename, sheetName = 'Datos') => {
  // Crear HTML con estilos inline que Excel puede interpretar
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
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .header-title { 
          background-color: #1E3A8A; 
          color: white; 
          font-size: 16px; 
          font-weight: bold; 
          text-align: center; 
          padding: 15px;
        }
        .date-generated {
          background-color: #f8f9fa;
          font-style: italic;
          padding: 10px;
          font-size: 12px;
        }
        .table-header {
          background-color: #2563EB;
          color: white;
          font-weight: bold;
          text-align: center;
          font-size: 12px;
        }
        .data-row-even {
          background-color: #F8F9FA;
        }
        .data-row-odd {
          background-color: white;
        }
        .status-green {
          background-color: #D4EDDA;
          color: #155724;
          font-weight: bold;
        }
        .status-yellow {
          background-color: #FFF3CD;
          color: #856404;
          font-weight: bold;
        }
        .status-red {
          background-color: #F8D7DA;
          color: #721C24;
          font-weight: bold;
        }
        .total-row {
          background-color: #495057;
          color: white;
          font-weight: bold;
          font-size: 12px;
        }
        .number-cell {
          text-align: right;
        }
        .currency-cell {
          text-align: right;
          mso-number-format: '"S/" #,##0.00';
        }
        .date-cell {
          text-align: center;
          mso-number-format: 'dd/mm/yyyy';
        }
      </style>
    </head>
    <body>
      <table>
  `;

  // Título
  html += `
    <tr>
      <td colspan="${columns.length}" class="header-title">
        REPORTE DE ${sheetName.toUpperCase()} - BANQUITO SYSTEM
      </td>
    </tr>
    <tr>
      <td colspan="${columns.length}" class="date-generated">
        Generado el: ${new Date().toLocaleString('es-ES')}
      </td>
    </tr>
    <tr><td colspan="${columns.length}">&nbsp;</td></tr>
  `;

  // Encabezados de tabla
  html += '<tr>';
  columns.forEach(col => {
    html += `<th class="table-header">${col.header}</th>`;
  });
  html += '</tr>';

  // Datos
  data.forEach((row, rowIndex) => {
    const rowClass = rowIndex % 2 === 0 ? 'data-row-even' : 'data-row-odd';
    html += `<tr class="${rowClass}">`;
    
    columns.forEach(col => {
      const value = col.accessor ? row[col.accessor] : col.getValue ? col.getValue(row) : '';
      let cellClass = '';
      let cellValue = value;
      
      // Aplicar clases según el tipo
      if (col.type === 'number') {
        cellClass = 'number-cell';
      } else if (col.type === 'currency') {
        cellClass = 'currency-cell';
        cellValue = typeof value === 'number' ? value : 0;
      } else if (col.type === 'date') {
        cellClass = 'date-cell';
        if (value) {
          const date = new Date(value);
          cellValue = date.toLocaleDateString('es-ES');
        }
      } else if (col.type === 'status' || col.header === 'Estado' || col.header === 'Calificación') {
        // Aplicar colores según el contenido
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes('al día') || valueStr.includes('activo') || 
            valueStr.includes('pagado') || valueStr.includes('excelente') || 
            valueStr.includes('verde')) {
          cellClass = 'status-green';
        } else if (valueStr.includes('pendiente') || valueStr.includes('regular') || 
                   valueStr.includes('próximo') || valueStr.includes('amarillo')) {
          cellClass = 'status-yellow';
        } else if (valueStr.includes('vencido') || valueStr.includes('mora') || 
                   valueStr.includes('observado') || valueStr.includes('riesgo') || 
                   valueStr.includes('rojo')) {
          cellClass = 'status-red';
        }
      }
      
      html += `<td class="${cellClass}">${cellValue}</td>`;
    });
    
    html += '</tr>';
  });

  // Fila de totales si hay columnas numéricas
  const numericColumns = columns.filter(col => col.type === 'number' || col.type === 'currency');
  if (numericColumns.length > 0 && data.length > 0) {
    html += '<tr class="total-row">';
    
    columns.forEach((col, index) => {
      if (index === 0) {
        html += '<td>TOTALES</td>';
      } else if (col.type === 'number' || col.type === 'currency') {
        const total = data.reduce((sum, row) => {
          const value = col.accessor ? row[col.accessor] : 0;
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);
        html += `<td class="${col.type === 'currency' ? 'currency-cell' : 'number-cell'}">${total}</td>`;
      } else {
        html += '<td></td>';
      }
    });
    
    html += '</tr>';
  }

  html += `
      </table>
    </body>
    </html>
  `;

  // Crear blob y descargar
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
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
  
  // Limpiar
  URL.revokeObjectURL(link.href);
  
  // Mostrar notificación
  const message = `✅ Archivo Excel "${finalFilename}" generado exitosamente con colores!`;
  console.log(message);
  
  // Notificación adicional sobre la advertencia de Excel
  const excelWarning = `📌 IMPORTANTE: Al abrir el archivo en Excel aparecerá un mensaje de advertencia.

Esto es NORMAL. El mensaje dice:
"El formato y la extensión del archivo no coinciden"

➡️ Simplemente haz clic en "SÍ" para abrir el archivo.

El archivo está perfectamente bien y mostrará todos los colores.`;
  
  if (window.showNotification) {
    window.showNotification(message, 'success');
    setTimeout(() => {
      if (window.confirm(excelWarning + '\n\n¿Deseas abrir el archivo ahora?')) {
        console.log('Usuario confirmó apertura del archivo');
      }
    }, 500);
  } else {
    alert(message + '\n\n' + excelWarning);
  }
};

// Exportar la función original también para compatibilidad
export { exportTableToExcel, importFromExcel, formatNumber, formatDate, generateCompleteReport, saveExcelFile } from './excelUtils';