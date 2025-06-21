import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';

const VehiculoForm = ({ open, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    placa: '',
    modelo: '',
    capacidad: '',
    soat_vencimiento: '',
    tecnomecanica_vencimiento: '',
    kit_vencimiento: '',
    pico_placa: '',
    activo: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      capacidad: parseInt(formData.capacidad),
      activo: Boolean(formData.activo)
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {initialData ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Placa"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modelo"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacidad"
                type="number"
                value={formData.capacidad}
                onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pico y Placa (dígito/s)"
                value={formData.pico_placa}
                onChange={(e) => setFormData({ ...formData, pico_placa: e.target.value })}
                helperText="Ej: 1,2,3 o 9"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="SOAT Vence"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.soat_vencimiento}
                onChange={(e) => setFormData({ ...formData, soat_vencimiento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Tecnomecánica Vence"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.tecnomecanica_vencimiento}
                onChange={(e) => setFormData({ ...formData, tecnomecanica_vencimiento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Kit Carretera Vence"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.kit_vencimiento}
                onChange={(e) => setFormData({ ...formData, kit_vencimiento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    color="primary"
                  />
                }
                label={formData.activo ? 'Activo' : 'Inactivo'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            {initialData ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default VehiculoForm; 