// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api/v1` : 'http://localhost:2001/api/v1';

console.log('🔧 API_BASE_URL configurada:', API_BASE_URL);

// Helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error en la solicitud' }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
};

// Helper para obtener headers con autenticación
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Servicio base de API
class ApiService {
  // GET genérico
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  }
  
  // POST genérico
  async post(endpoint, data = {}, includeAuth = true) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  }
  
  // PUT genérico
  async put(endpoint, data = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  }
  
  // DELETE genérico
  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    return handleResponse(response);
  }
}

export default new ApiService();