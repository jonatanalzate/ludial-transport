import axios from 'axios';

// Asegurarnos de que siempre usamos HTTPS en producción
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const baseURL = process.env.NODE_ENV === 'production' 
  ? API_URL.replace(/^http:/, 'https:').replace(/\/$/, '') 
  : API_URL;

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
    // Asegurarnos de que no hay barras al final de la URL
    config.url = config.url.replace(/\/$/, '');
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
  getTrayectos: () => axiosInstance.get('/trayectos'),
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
  createVehiculo: (data) => axiosInstance.post('/vehiculos', data),
  updateVehiculo: (id, data) => axiosInstance.put(`/vehiculos/${id}`, data),
  deleteVehiculo: (id) => axiosInstance.delete(`/vehiculos/${id}`),
  createVehiculosBulk: (data) => axiosInstance.post('/vehiculos/bulk', data),

  // Rutas
  getRutas: () => axiosInstance.get('/rutas'),
  createRuta: (data) => axiosInstance.post('/rutas', data),
  updateRuta: (id, data) => axiosInstance.put(`/rutas/${id}`, data),
  deleteRuta: (id) => axiosInstance.delete(`/rutas/${id}`),
  createRutasBulk: (data) => axiosInstance.post('/rutas/bulk', data),

  // Usuarios
  getUsuarios: () => axiosInstance.get('/usuarios'),
  createUsuario: (data) => axiosInstance.post('/usuarios', data),
  updateUsuario: (id, data) => axiosInstance.put(`/usuarios/${id}`, data),
  deleteUsuario: (id) => axiosInstance.delete(`/usuarios/${id}`),
  createUsuariosBulk: (data) => axiosInstance.post('/usuarios/bulk', data),

  // Novedades
  getNovedades: () => axiosInstance.get('/novedades'),
  reportarNovedad: (data) => axiosInstance.post('/novedades', data),
  getNovedadesStats: () => axiosInstance.get('/novedades/stats'),
}; 