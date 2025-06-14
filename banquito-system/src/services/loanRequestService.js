import api from './api';
import { mapLoanRequestFromBackend } from '../utils/loanRequestMapper';

class LoanRequestService {
  // Obtener todas las solicitudes
  async getLoanRequests(params = {}) {
    try {
      console.log('🔍 loanRequestService - Llamando API /loan-requests con params:', params);
      const response = await api.get('/loan-requests', params);
      console.log('📡 loanRequestService - Respuesta completa del backend:', response);
      
      const backendData = response.data || [];
      console.log('📊 loanRequestService - backendData extraída:', backendData);
      
      // Si es un array, mapear cada elemento
      if (Array.isArray(backendData)) {
        console.log('✅ loanRequestService - Es un array, mapeando directamente');
        const mapped = backendData.map(mapLoanRequestFromBackend).filter(Boolean);
        console.log('🔄 loanRequestService - Datos mapeados:', mapped);
        return mapped;
      }
      
      // Si es un objeto con data
      if (backendData.data && Array.isArray(backendData.data)) {
        console.log('✅ loanRequestService - Es un objeto con data, mapeando backendData.data');
        const mapped = backendData.data.map(mapLoanRequestFromBackend).filter(Boolean);
        console.log('🔄 loanRequestService - Datos mapeados:', mapped);
        return mapped;
      }
      
      console.log('⚠️ loanRequestService - Formato de datos no reconocido, retornando array vacío');
      return [];
    } catch (error) {
      console.error('❌ loanRequestService - Error obteniendo solicitudes:', error);
      return [];
    }
  }
  
  // Crear nueva solicitud
  async createLoanRequest(requestData) {
    try {
      const response = await api.post('/loan-requests', requestData);
      
      // Mapear la respuesta del backend al formato del frontend
      if (response.data && response.data.data) {
        return {
          success: true,
          data: mapLoanRequestFromBackend(response.data.data)
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error creando solicitud:', error);
      throw error;
    }
  }
  
  // Aprobar solicitud
  async approveLoanRequest(requestId, approvalData) {
    try {
      const response = await api.put(`/loan-requests/${requestId}/approve`, approvalData);
      return response.data;
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      throw error;
    }
  }
  
  // Rechazar solicitud
  async rejectLoanRequest(requestId, rejectionData) {
    try {
      const response = await api.put(`/loan-requests/${requestId}/reject`, rejectionData);
      return response.data;
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      throw error;
    }
  }
}

export default new LoanRequestService();