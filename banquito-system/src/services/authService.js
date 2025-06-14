import api from './api';

class AuthService {
  // Login
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password }, false);
      
      if (response.success && response.data.token) {
        // Guardar token en sessionStorage para mayor seguridad
        sessionStorage.setItem('authToken', response.data.token);
        sessionStorage.setItem('currentUser', JSON.stringify(response.data.user));
        
        return response.data.user;
      }
      
      throw new Error('Credenciales inválidas');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }
  
  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar sessionStorage
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('currentUser');
    }
  }
  
  // Obtener usuario actual
  getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  // Verificar si está autenticado
  isAuthenticated() {
    return !!sessionStorage.getItem('authToken');
  }
  
  // Obtener token
  getToken() {
    return sessionStorage.getItem('authToken');
  }
}

export default new AuthService();