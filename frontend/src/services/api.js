import axios from 'axios';

// Asegurarnos de que siempre usamos HTTPS en producción
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const baseURL = API_URL.replace(/^http:/, 'https:');

console.log('API Service - Using URL:', baseURL);

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para agregar el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funciones de la API
export const api = {
  // Trayectos
  getTrayectos: () => {
    console.log('Fetching trayectos from:', `${baseURL}/trayectos`);
    return axiosInstance.get('/trayectos');
  },
  createTrayecto: (data) => axiosInstance.post('/trayectos', data),
  iniciarTrayecto: (id) => axiosInstance.post(`/trayectos/${id}/iniciar`),
  finalizarTrayecto: (id, cantidad_pasajeros) => {
    return axiosInstance.post(`/trayectos/${id}/finalizar`, { 
      cantidad_pasajeros: parseInt(cantidad_pasajeros) 
    });
  },

  // Conductores
  getConductores: () => {
    console.log('Fetching conductores from:', `${baseURL}/conductores`);
    return axiosInstance.get('/conductores');
  },
  createConductor: (data) => axiosInstance.post('/conductores', data),
  updateConductor: (id, data) => axiosInstance.put(`/conductores/${id}`, data),
  deleteConductor: (id) => axiosInstance.delete(`/conductores/${id}`),
  createConductoresBulk: (data) => axiosInstance.post('/conductores/bulk', data),

  // Vehículos
  getVehiculos: () => {
    console.log('Fetching vehiculos from:', `${baseURL}/vehiculos`);
    return axiosInstance.get('/vehiculos');
  },
  createVehiculo: (data) => axiosInstance.post('/vehiculos', data),
  updateVehiculo: (id, data) => axiosInstance.put(`/vehiculos/${id}`, data),
  deleteVehiculo: (id) => axiosInstance.delete(`/vehiculos/${id}`),
  createVehiculosBulk: (data) => axiosInstance.post('/vehiculos/bulk', data),

  // Rutas
  getRutas: () => {
    console.log('Fetching rutas from:', `${baseURL}/rutas`);
    return axiosInstance.get('/rutas');
  },
  createRuta: (data) => axiosInstance.post('/rutas', data),
  updateRuta: (id, data) => axiosInstance.put(`/rutas/${id}`, data),
  deleteRuta: (id) => axiosInstance.delete(`/rutas/${id}`),
  createRutasBulk: (data) => axiosInstance.post('/rutas/bulk', data),

  // Usuarios
  getUsuarios: () => {
    console.log('Fetching usuarios from:', `${baseURL}/usuarios`);
    return axiosInstance.get('/usuarios');
  },
  createUsuario: (data) => axiosInstance.post('/usuarios', data),
  updateUsuario: (id, data) => axiosInstance.put(`/usuarios/${id}`, data),
  deleteUsuario: (id) => axiosInstance.delete(`/usuarios/${id}`),
  createUsuariosBulk: (data) => axiosInstance.post('/usuarios/bulk', data),
}; 