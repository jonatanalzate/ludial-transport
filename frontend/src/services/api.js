import axios from 'axios';

// Función para depurar la configuración
const debugConfig = (config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('API Config:', {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
      headers: config.headers
    });
  }
  return config;
};

// Función para asegurar que la URL use HTTPS y no tenga espacios
const ensureHttps = (url) => {
  if (!url) return url;
  // Eliminar espacios y asegurar HTTPS
  return url.trim().replace(/^http:\/\//i, 'https://');
};

const API_URL = ensureHttps(process.env.REACT_APP_API_URL || 'http://localhost:8000');

console.log('API URL:', API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Habilitar credenciales para CORS
  maxRedirects: 5,
  timeout: 15000, // Aumentado a 15 segundos
  validateStatus: function (status) {
    return status >= 200 && status < 400;
  }
});

// Interceptor para agregar el token y asegurar HTTPS en todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Asegurar HTTPS en todas las URLs
    if (config.url && typeof config.url === 'string') {
      config.url = ensureHttps(config.url);
    }
    if (config.baseURL && typeof config.baseURL === 'string') {
      config.baseURL = ensureHttps(config.baseURL);
    }

    // Log de la configuración en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('Request Config:', {
        url: config.url,
        baseURL: config.baseURL,
        method: config.method,
        headers: config.headers
      });
    }

    return config;
  },
  (error) => {
    console.error('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar redirecciones y errores
axiosInstance.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  async (error) => {
    // Log detallado del error
    console.error('Error en la respuesta:', {
      message: error.message,
      config: error.config,
      response: error.response ? {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      } : 'No response'
    });

    if (error.response) {
      // Manejar redirección 307
      if (error.response.status === 307) {
        const newUrl = error.response.headers.location;
        if (newUrl) {
          console.log('Redirigiendo a:', newUrl);
          const secureUrl = ensureHttps(newUrl);
          // Crear una nueva configuración preservando los headers originales
          const newConfig = {
            ...error.config,
            url: secureUrl,
            headers: {
              ...error.config.headers,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          };
          return axiosInstance(newConfig);
        }
      }

      // Manejar error de autenticación
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Manejar error de red
    if (error.message === 'Network Error') {
      console.log('Reintentando petición después de error de red...');
      return new Promise(resolve => {
        setTimeout(() => {
          // Asegurar que la configuración use HTTPS
          const retryConfig = {
            ...error.config,
            url: ensureHttps(error.config.url),
            baseURL: ensureHttps(error.config.baseURL)
          };
          resolve(axiosInstance(retryConfig));
        }, 2000);
      });
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