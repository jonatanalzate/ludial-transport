import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import { api } from '../../services/api';

const TrayectoForm = ({ open, onClose, onSubmit, editMode = false, initialData = null }) => {
  const userRole = localStorage.getItem('role');
  const [loading, setLoading] = useState(true);
  const [rutas, setRutas] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [formData, setFormData] = useState({
    ruta_id: '',
    conductor_id: '',
    vehiculo_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rutasRes, usuariosRes, vehiculosRes] = await Promise.all([
          api.getRutasActivas(),
          api.getConductoresActivos(),
          api.getVehiculosActivos()
        ]);
        setRutas(rutasRes.data);
        setConductores(usuariosRes.data);
        setVehiculos(vehiculosRes.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (userRole === 'conductor' && open) onClose();
  }, [open, onClose, userRole]);

  useEffect(() => {
    if (editMode && initialData) {
      setFormData({
        ruta_id: initialData.ruta_id,
        conductor_id: initialData.conductor_id,
        vehiculo_id: initialData.vehiculo_id,
      });
    } else {
      setFormData({ ruta_id: '', conductor_id: '', vehiculo_id: '' });
    }
  }, [editMode, initialData, open]);

  if (userRole === 'conductor') return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editMode ? 'Editar Trayecto' : 'Nuevo Trayecto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Ruta"
                value={formData.ruta_id}
                onChange={(e) => setFormData({ ...formData, ruta_id: e.target.value })}
                required
              >
                {rutas.map((ruta) => (
                  <MenuItem key={ruta.id} value={ruta.id}>
                    {ruta.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Conductor"
                value={formData.conductor_id}
                onChange={(e) => setFormData({ ...formData, conductor_id: e.target.value })}
                required
              >
                {conductores.map((conductor) => (
                  <MenuItem key={conductor.id} value={conductor.id}>
                    {conductor.nombre_completo}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Vehículo"
                value={formData.vehiculo_id}
                onChange={(e) => setFormData({ ...formData, vehiculo_id: e.target.value })}
                required
              >
                {vehiculos.map((vehiculo) => (
                  <MenuItem key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.placa} - {vehiculo.modelo}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            {editMode ? 'Guardar Cambios' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TrayectoForm; 