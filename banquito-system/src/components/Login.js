import React, { useState } from 'react';
import './Login.css';
import authService from '../services/authService';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('external');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(username, password);
      onLogin(user);
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const getDemoCredentials = (role) => {
    switch(role) {
      case 'admin':
        return { username: 'admin', password: 'admin123' };
      case 'member':
        return { username: 'arteaga', password: 'arteaga123' };
      case 'external':
        return { username: 'externo1', password: 'ext123' };
      default:
        return { username: '', password: '' };
    }
  };

  const fillDemoCredentials = () => {
    const credentials = getDemoCredentials(selectedRole);
    setUsername(credentials.username);
    setPassword(credentials.password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo-banquito.jpeg" alt="Banquito Logo" className="login-logo-image" />
          </div>
          <h1>Sistema Banquito</h1>
          <p>Sistema de Préstamos Asociativos</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="role-selector">
            <label>Tipo de Usuario:</label>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${selectedRole === 'external' ? 'active' : ''}`}
                onClick={() => {
                  // Acceso directo sin autenticación para usuarios externos
                  const externalUser = {
                    id: 'external',
                    username: 'externo',
                    name: 'Usuario Externo',
                    role: 'external',
                    memberId: null
                  };
                  onLogin(externalUser);
                }}
              >
                🌐 Acceso Público
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Usuario:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;