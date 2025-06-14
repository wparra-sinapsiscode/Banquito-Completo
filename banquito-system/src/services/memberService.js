import api from './api';
import { mapMemberFromBackend } from '../utils/loanDataMapper';

class MemberService {
  // Obtener todos los miembros
  async getMembers(params = {}) {
    try {
      console.log('📡 Llamando API /members con params:', params);
      const response = await api.get('/members', { params });
      console.log('📡 Respuesta completa de API:', response);
      
      // El backend devuelve { success: true, data: [...], pagination: {...} }
      const backendMembers = response.data || response;
      console.log('📡 Datos de miembros extraídos:', backendMembers);
      
      // Mapear datos del backend al formato del frontend
      const mappedMembers = Array.isArray(backendMembers) 
        ? backendMembers.map(mapMemberFromBackend).filter(Boolean)
        : [];
      
      return mappedMembers;
    } catch (error) {
      console.error('❌ Error completo obteniendo miembros:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Response status:', error.response?.status);
      throw new Error(error.response?.data?.message || error.message || 'Error al obtener miembros');
    }
  }
  
  // Obtener miembro por ID
  async getMemberById(id) {
    try {
      const response = await api.get(`/members/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo miembro:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener miembro');
    }
  }
  
  // Crear nuevo miembro
  async createMember(memberData) {
    try {
      const response = await api.post('/members', memberData);
      const backendMember = response.data?.data;
      
      // Mapear el miembro creado si existe
      if (backendMember) {
        return mapMemberFromBackend(backendMember);
      }
      
      return backendMember;
    } catch (error) {
      console.error('Error creando miembro:', error);
      throw new Error(error.response?.data?.message || 'Error al crear miembro');
    }
  }
  
  // Actualizar miembro
  async updateMember(id, memberData) {
    try {
      const response = await api.put(`/members/${id}`, memberData);
      return response.data.data;
    } catch (error) {
      console.error('Error actualizando miembro:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar miembro');
    }
  }
  
  // Eliminar miembro
  async deleteMember(id) {
    try {
      const response = await api.delete(`/members/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('Error eliminando miembro:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar miembro');
    }
  }
  
  // Actualizar plan de ahorro
  async updateSavingsPlan(memberId, savingsPlanData) {
    try {
      const response = await api.put(`/members/${memberId}/savings-plan`, savingsPlanData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando plan de ahorro:', error);
      throw error;
    }
  }
}

export default new MemberService();