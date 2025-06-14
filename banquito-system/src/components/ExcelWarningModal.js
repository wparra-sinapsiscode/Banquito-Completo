import React from 'react';
import './ExcelWarningModal.css';

const ExcelWarningModal = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="excel-warning-modal-overlay">
      <div className="excel-warning-modal">
        <div className="modal-header">
          <h3>📊 Información sobre el archivo Excel</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="success-message">
            <span className="success-icon">✅</span>
            <p>El archivo se ha descargado correctamente con todos los colores y formatos.</p>
          </div>
          
          <div className="warning-section">
            <h4>⚠️ Mensaje de Excel</h4>
            <div className="excel-message">
              <p className="message-text">
                "El formato y la extensión del archivo 'nombre.xls' no coinciden. 
                El archivo podría estar dañado o no ser seguro..."
              </p>
            </div>
            
            <div className="solution">
              <h5>✅ Solución:</h5>
              <ol>
                <li>Este mensaje es <strong>NORMAL</strong> y esperado</li>
                <li>Haz clic en <strong>"SÍ"</strong> cuando Excel pregunte si deseas abrir el archivo</li>
                <li>El archivo se abrirá perfectamente con todos los colores</li>
              </ol>
            </div>
          </div>
          
          <div className="why-section">
            <h4>❓ ¿Por qué aparece este mensaje?</h4>
            <p>
              Para mantener los colores y formatos, generamos el archivo en formato HTML 
              que Excel puede leer. Excel muestra esta advertencia por seguridad, pero el 
              archivo está perfectamente bien.
            </p>
          </div>
          
          <div className="alternatives">
            <h4>📌 Alternativas sin advertencia:</h4>
            <ul>
              <li>🌐 Abrir con <strong>Google Sheets</strong> (no muestra advertencia)</li>
              <li>📊 Usar <strong>LibreOffice Calc</strong> (abre directamente)</li>
              <li>💾 Guardar como .xlsx después de abrirlo en Excel</li>
            </ul>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelWarningModal;