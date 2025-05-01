import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  createConductoresBulk: async (data) => {
    return axios.post(`${API_URL}/conductores/bulk`, data);
  },

  // Vehículos
  getVehiculos: () => axiosInstance.get('/vehiculos'),
  createVehiculo: (data) => axiosInstance.post('/vehiculos', data),
  updateVehiculo: (id, data) => axiosInstance.put(`/vehiculos/${id}`, data),
  deleteVehiculo: (id) => axiosInstance.delete(`/vehiculos/${id}`),
  createVehiculosBulk: async (data) => {
    return axios.post(`${API_URL}/vehiculos/bulk`, data);
  },

  // Rutas
  getRutas: () => axiosInstance.get('/rutas'),
  createRuta: (data) => axiosInstance.post('/rutas', data),
  updateRuta: (id, data) => axiosInstance.put(`/rutas/${id}`, data),
  deleteRuta: (id) => axiosInstance.delete(`/rutas/${id}`),
  createRutasBulk: async (data) => {
    return axios.post(`${API_URL}/rutas/bulk`, data);
  },

  // Usuarios
  getUsuarios: () => axiosInstance.get('/usuarios'),
  createUsuario: (data) => axiosInstance.post('/usuarios', data),
  updateUsuario: (id, data) => axiosInstance.put(`/usuarios/${id}`, data),
  deleteUsuario: (id) => axiosInstance.delete(`/usuarios/${id}`),
  createUsuariosBulk: async (data) => {
    return axios.post(`${API_URL}/usuarios/bulk`, data);
  },
}; 