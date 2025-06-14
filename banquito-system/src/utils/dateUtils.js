/**
 * Utilidades para manejo de fechas en zona horaria local (Lima, Perú)
 */

/**
 * Formatea una fecha a YYYY-MM-DD en hora local (no UTC)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatLocalDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  
  // Verificar fecha válida
  if (isNaN(d.getTime())) {
    console.warn('Fecha inválida:', date);
    return new Date().toLocaleDateString('en-CA'); // Fallback a hoy
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Convierte una fecha string YYYY-MM-DD a objeto Date en hora local
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  
  // Si incluye 'T', es formato ISO, usar directamente
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Para formato YYYY-MM-DD, crear fecha en hora local (mediodía para evitar problemas)
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (hora local)
 * @returns {string} Fecha de hoy
 */
export const getTodayLocal = () => {
  return formatLocalDate(new Date());
};

/**
 * Agrega días a una fecha manteniendo hora local
 * @param {Date|string} date - Fecha inicial
 * @param {number} days - Días a agregar
 * @returns {Date} Nueva fecha
 */
export const addDays = (date, days) => {
  const d = date instanceof Date ? new Date(date) : parseLocalDate(date);
  d.setDate(d.getDate() + days);
  return d;
};