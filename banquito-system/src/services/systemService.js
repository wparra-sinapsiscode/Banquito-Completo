import api from './api';

const systemService = {
  // Obtener todas las configuraciones del sistema
  getSettings: async () => {
    try {
      // Llamar directamente usando fetch sin autenticación ya que es endpoint público
      const response = await fetch('http://localhost:2001/api/v1/system/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 Respuesta completa del servidor:', result);
      return result.data; // El backend devuelve { success: true, data: {...} }
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      throw new Error(error.message || 'Error al obtener configuraciones del sistema');
    }
  },

  // Actualizar configuraciones del sistema
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/system/settings', settings);
      return response.data.data;
    } catch (error) {
      console.error('Error actualizando configuraciones:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar configuraciones del sistema');
    }
  },

  // Obtener estadísticas del sistema
  getStatistics: async () => {
    try {
      const response = await api.get('/system/statistics');
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas del sistema');
    }
  }
};

export default systemService;