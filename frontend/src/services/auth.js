import axios from 'axios';
import { api } from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Asegurarse de que la URL use HTTPS en producción
const secureApiUrl = API_URL.replace(/^http:\/\//i, 'https://').replace(/\/$/, '');

// Crear una instancia específica para autenticación
const authInstance = axios.create({
  baseURL: secureApiUrl,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  },
  withCredentials: true
});

export const auth = {
  login: async (username, password) => {
    try {
      // Convertir las credenciales al formato x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // console.log('Intentando login con URL:', `${secureApiUrl}/auth/token`);

      const response = await authInstance.post('/auth/token', formData);

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('username', response.data.username);
      }

      return response.data;
    } catch (error) {
      console.error('Error en login:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response'
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    
    if (token && role) {
      return { token, role, username };
    }
    
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getRole: () => {
    return localStorage.getItem('role');
  }
}; 