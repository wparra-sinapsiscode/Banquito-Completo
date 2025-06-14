import api from './api';
import { mapLoansFromBackend, mapLoanFromBackend } from '../utils/loanDataMapper';

class LoanService {
  // Obtener todos los préstamos
  async getLoans(params = {}) {
    try {
      const response = await api.get('/loans', params);
      const backendLoans = response.data || [];
      console.log('🔄 Datos raw del backend:', backendLoans);
      
      // Mostrar detalles de cada préstamo del backend
      backendLoans.forEach(loan => {
        console.log(`📋 Backend Loan ID ${loan.id}:`, {
          member_id: loan.member_id,
          original_amount: loan.original_amount,
          remaining_amount: loan.remaining_amount,
          status: loan.status,
          weekly_payment: loan.weekly_payment,
          total_weeks: loan.total_weeks,
          payments: loan.payments?.length || 0
        });
      });
      
      // Mapear datos del backend al formato del frontend
      const mappedLoans = mapLoansFromBackend(backendLoans);
      console.log('✅ Datos mapeados para frontend:', mappedLoans);
      
      // Mostrar detalles de cada préstamo mapeado
      mappedLoans.forEach(loan => {
        console.log(`📋 Mapped Loan ID ${loan.id}:`, {
          memberId: loan.memberId,
          originalAmount: loan.originalAmount,
          remainingAmount: loan.remainingAmount,
          status: loan.status,
          weeklyPayment: loan.weeklyPayment,
          totalWeeks: loan.totalWeeks,
          payments: loan.paymentHistory?.length || 0
        });
      });
      
      return mappedLoans;
    } catch (error) {
      console.error('Error obteniendo préstamos:', error);
      return [];
    }
  }
  
  // Obtener préstamo por ID
  async getLoanById(id) {
    try {
      const response = await api.get(`/loans/${id}`);
      const backendLoan = response.data;
      
      // Mapear datos del backend al formato del frontend
      return mapLoanFromBackend(backendLoan);
    } catch (error) {
      console.error('Error obteniendo préstamo:', error);
      throw error;
    }
  }
  
  // Crear préstamo desde solicitud aprobada
  async createLoanFromRequest(loanRequestId, approvedBy) {
    try {
      const response = await api.post('/loans', { loanRequestId, approvedBy });
      return response.data;
    } catch (error) {
      console.error('Error creando préstamo:', error);
      throw error;
    }
  }
  
  // Registrar pago
  async registerPayment(loanId, paymentData) {
    try {
      const response = await api.post(`/loans/${loanId}/payments`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  }
  
  // Modificar fecha de vencimiento
  async updateDueDate(loanId, newDueDate) {
    try {
      const response = await api.put(`/loans/${loanId}/due-date`, { newDueDate });
      return response.data;
    } catch (error) {
      console.error('Error actualizando fecha de vencimiento:', error);
      throw error;
    }
  }
  
  // Obtener cronograma de pagos
  async getPaymentSchedule(loanId) {
    try {
      const response = await api.get(`/loans/${loanId}/schedule`);
      return response.data || [];
    } catch (error) {
      console.error('Error obteniendo cronograma:', error);
      return [];
    }
  }
}

export default new LoanService();