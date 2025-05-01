import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Asegurarse de que la URL siempre use HTTPS en producción
const secureApiUrl = API_URL.replace('http://', 'https://');

const axiosInstance = axios.create({
  baseURL: secureApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 5,  // Permitir hasta 5 redirecciones
  validateStatus: function (status) {
    return status >= 200 && status < 400; // Aceptar códigos de estado en este rango
  }
});

// Interceptor para agregar el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Asegurarse de que la URL use HTTPS
    if (config.url && config.url.startsWith('http://')) {
      config.url = config.url.replace('http://', 'https://');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar redirecciones y errores
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 307) {
      const newUrl = error.response.headers.location;
      if (newUrl) {
        // Asegurarse de que la nueva URL use HTTPS
        const secureUrl = newUrl.replace('http://', 'https://');
        // Hacer una nueva petición a la URL segura
        const config = {
          ...error.config,
          url: secureUrl,
        };
        return axiosInstance(config);
      }
    }
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Trayectos
  getTrayectos: async () => {
    try {
      const response = await axiosInstance.get('/trayectos');
      return response;
    } catch (error) {
      console.error('Error en getTrayectos:', error.response || error);
      throw error;
    }
  },
  createTrayecto: (data) => axiosInstance.post('/trayectos', data),
  iniciarTrayecto: (id) => axiosInstance.post(`/trayectos/${id}/iniciar`),
  finalizarTrayecto: (id, cantidad_pasajeros) => {
    console.log('Finalizando trayecto:', { id, cantidad_pasajeros });
    return axiosInstance.post(`/trayectos/${id}/finalizar`, { 
      cantidad_pasajeros: parseInt(cantidad_pasajeros) 
    });
  },

  // Conductores
  getConductores: () => axiosInstance.get('/conductores'),
  createConductor: (data) => axiosInstance.post('/conductores', data),
  updateConductor: (id, data) => axiosInstance.put(`/conductores/${id}`, data),
  deleteConductor: (id) => axiosInstance.delete(`/conductores/${id}`),
  createConductoresBulk: (data) => axiosInstance.post('/conductores/bulk', data),

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
}; 