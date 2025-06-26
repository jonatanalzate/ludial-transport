import axios from 'axios';

// Asegurarnos de que siempre usamos HTTPS en producción
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

console.log('API_URL en runtime:', API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

let baseURL = API_URL;
if (!baseURL.startsWith('https://')) {
  baseURL = 'https://' + baseURL.replace(/^https?:\/\//, '');
}
baseURL = baseURL.replace(/\/$/, '');

// console.log('API Service - Using URL:', baseURL);

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Asegurarnos de que las redirecciones mantengan el método y los headers
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 400;
  }
});

// Interceptor para agregar el token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Se elimina la manipulación de la URL para evitar errores de Mixed Content.
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Si es un error de red o la API no está disponible
    if (!error.response) {
      console.error('Error de red o API no disponible:', error.message);
      return Promise.reject(new Error('Error de conexión. Por favor, verifica tu conexión a internet.'));
    }

    // Para otros errores
    const errorMessage = error.response?.data?.detail || error.message;
    console.error('Error en la petición:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// Funciones de la API
export const api = {
  // Trayectos
  getTrayectos: (params = {}) => axiosInstance.get('/trayectos', { params }),
  createTrayecto: (data) => axiosInstance.post('/trayectos', data),
  iniciarTrayecto: (id) => axiosInstance.post(`/trayectos/${id}/iniciar`),
  detenerTrayecto: (id) => axiosInstance.post(`/trayectos/${id}/detener`),
  finalizarTrayecto: (id, cantidad_pasajeros) => {
    return axiosInstance.post(`/trayectos/${id}/finalizar`, { 
      cantidad_pasajeros: parseInt(cantidad_pasajeros) 
    });
  },
  getUbicaciones: () => axiosInstance.get('/trayectos/ubicaciones'),
  enviarUbicacion: (data) => axiosInstance.post('/trayectos/ubicacion', data),
  updateTrayecto: (id, data) => axiosInstance.put(`/trayectos/${id}`, data),
  deleteTrayecto: (id) => axiosInstance.delete(`/trayectos/${id}`),
  createTrayectosBulk: (data) => axiosInstance.post('/trayectos/bulk', data),

  // Vehículos
  getVehiculos: () => axiosInstance.get('/vehiculos'),
  getVehiculosActivos: () => axiosInstance.get('/vehiculos?solo_activos=true'),
  createVehiculo: (data) => axiosInstance.post('/vehiculos', data),
  updateVehiculo: (id, data) => axiosInstance.put(`/vehiculos/${id}`, data),
  deleteVehiculo: (id) => axiosInstance.delete(`/vehiculos/${id}`),
  createVehiculosBulk: (data) => axiosInstance.post('/vehiculos/bulk', data),

  // Rutas
  getRutas: () => axiosInstance.get('/rutas'),
  getRutasActivas: () => axiosInstance.get('/rutas?solo_activas=true'),
  createRuta: (data) => axiosInstance.post('/rutas', data),
  updateRuta: (id, data) => axiosInstance.put(`/rutas/${id}`, data),
  deleteRuta: (id) => axiosInstance.delete(`/rutas/${id}`),
  createRutasBulk: (data) => axiosInstance.post('/rutas/bulk', data),

  // Usuarios
  getUsuarios: () => axiosInstance.get('/usuarios'),
  getConductoresActivos: () => axiosInstance.get('/usuarios?solo_activos=true&solo_conductores=true'),
  createUsuario: (data) => axiosInstance.post('/usuarios', data),
  updateUsuario: (id, data) => axiosInstance.put(`/usuarios/${id}`, data),
  deleteUsuario: (id) => axiosInstance.delete(`/usuarios/${id}`),
  createUsuariosBulk: (data) => axiosInstance.post('/usuarios/bulk', data),

  // Novedades
  getNovedades: (params = {}) => axiosInstance.get('/novedades', { params }),
  reportarNovedad: (data) => axiosInstance.post('/novedades', data),
  getNovedadesStats: () => axiosInstance.get('/novedades/stats'),

  // Pico y Placa Config
  getPicoYPlacaConfig: () => axiosInstance.get('/vehiculos/pico-y-placa-config'),
  updatePicoYPlacaConfig: (data) => axiosInstance.put('/vehiculos/pico-y-placa-config', data),
}; 