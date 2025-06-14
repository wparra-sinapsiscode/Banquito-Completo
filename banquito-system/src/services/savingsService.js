import api from './api';

class SavingsService {
  // Obtener todos los planes de ahorro
  async getSavingsPlans(params = {}) {
    try {
      console.log('📡 Llamando API /savings con params:', params);
      const response = await api.get('/savings', { params });
      console.log('📡 Respuesta de planes de ahorro:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo planes de ahorro:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al obtener planes de ahorro');
    }
  }

  // Obtener plan de ahorro por ID
  async getSavingsPlanById(id) {
    try {
      console.log('📡 Obteniendo plan de ahorro ID:', id);
      const response = await api.get(`/savings/${id}`);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo plan de ahorro:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al obtener plan de ahorro');
    }
  }

  // Obtener plan de ahorro por ID de miembro
  async getSavingsPlanByMemberId(memberId) {
    try {
      console.log('📡 Obteniendo plan de ahorro para miembro ID:', memberId);
      const response = await api.get(`/savings/member/${memberId}`);
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        // No hay plan de ahorro para este miembro, devolver null
        return null;
      }
      console.error('❌ Error obteniendo plan de ahorro por miembro:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al obtener plan de ahorro');
    }
  }

  // Crear nuevo plan de ahorro
  async createSavingsPlan(data) {
    try {
      console.log('📡 Creando plan de ahorro:', data);
      
      // Convertir los datos del frontend al formato del backend
      const backendData = {
        member_id: data.memberId,
        enabled: true,
        plan_days: data.plan || 180,
        start_date: data.startDate || new Date().toISOString().split('T')[0],
        tea: data.TEA || 0.02,
        initial_amount: data.amount || 0
      };
      
      const response = await api.post('/savings', backendData);
      console.log('✅ Plan de ahorro creado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creando plan de ahorro:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al crear plan de ahorro');
    }
  }

  // Actualizar plan de ahorro
  async updateSavingsPlan(id, data) {
    try {
      console.log('📡 Actualizando plan de ahorro ID:', id, 'con datos:', data);
      
      // Solo enviar los campos que se van a actualizar
      const updateData = {};
      if (data.enabled !== undefined) updateData.enabled = data.enabled;
      if (data.plan_days !== undefined) updateData.plan_days = data.plan_days;
      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.tea !== undefined) updateData.tea = data.tea;
      if (data.initial_amount !== undefined) updateData.initial_amount = data.initial_amount;
      
      const response = await api.put(`/savings/${id}`, updateData);
      console.log('✅ Plan de ahorro actualizado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error actualizando plan de ahorro:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al actualizar plan de ahorro');
    }
  }

  // Eliminar (desactivar) plan de ahorro
  async deleteSavingsPlan(id) {
    try {
      console.log('📡 Desactivando plan de ahorro ID:', id);
      const response = await api.delete(`/savings/${id}`);
      console.log('✅ Plan de ahorro desactivado:', response);
      return response;
    } catch (error) {
      console.error('❌ Error desactivando plan de ahorro:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al desactivar plan de ahorro');
    }
  }

  // Calcular interés
  async calculateInterest(amount, days, tea = 0.02) {
    try {
      console.log('📡 Calculando interés:', { amount, days, tea });
      const response = await api.post('/savings/calculate-interest', {
        amount,
        days,
        tea
      });
      return response;
    } catch (error) {
      console.error('❌ Error calculando interés:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al calcular interés');
    }
  }

  // Método helper para mapear datos del backend al formato del frontend
  mapSavingsPlanFromBackend(backendPlan) {
    if (!backendPlan) return null;
    
    return {
      id: backendPlan.id,
      memberId: backendPlan.member_id,
      amount: backendPlan.amount || 0, // Este campo lo manejaremos en el frontend
      plan: backendPlan.plan_days,
      startDate: backendPlan.start_date,
      endDate: this.calculateEndDate(backendPlan.start_date, backendPlan.plan_days),
      interest: 0, // Se calculará dinámicamente
      totalAmount: 0, // Se calculará dinámicamente
      status: backendPlan.enabled ? 'active' : 'inactive',
      TEA: backendPlan.tea,
      member: backendPlan.member
    };
  }

  // Calcular fecha de fin
  calculateEndDate(startDate, days) {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    return end.toISOString();
  }
}

export default new SavingsService();