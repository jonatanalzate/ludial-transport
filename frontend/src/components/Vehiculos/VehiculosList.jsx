import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { api } from '../../services/api';
import VehiculoBulkUpload from './VehiculoBulkUpload';

const VehiculosList = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    capacidad: ''
  });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => {
    loadVehiculos();
  }, []);

  const loadVehiculos = async () => {
    try {
      const response = await api.getVehiculos();
      setVehiculos(response.data);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    }
  };

  const handleOpen = (vehiculo = null) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo);
      setFormData({
        placa: vehiculo.placa,
        modelo: vehiculo.modelo,
        capacidad: vehiculo.capacidad
      });
    } else {
      setEditingVehiculo(null);
      setFormData({
        placa: '',
        modelo: '',
        capacidad: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVehiculo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const vehiculoData = {
        ...formData,
        capacidad: parseInt(formData.capacidad)
      };

      if (editingVehiculo) {
        await api.updateVehiculo(editingVehiculo.id, vehiculoData);
      } else {
        await api.createVehiculo(vehiculoData);
      }
      handleClose();
      loadVehiculos();
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      alert('Error al guardar vehículo: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
      try {
        await api.deleteVehiculo(id);
        loadVehiculos();
      } catch (error) {
        console.error('Error al eliminar vehículo:', error);
      }
    }
  };

  const handleBulkUpload = async (vehiculos) => {
    try {
      await api.createVehiculosBulk({ vehiculos });
      setBulkUploadOpen(false);
      loadVehiculos();
    } catch (error) {
      console.error('Error al cargar vehículos masivamente:', error);
      alert('Error al cargar vehículos: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Vehículos</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setBulkUploadOpen(true)}
          >
            Carga Masiva
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Nuevo Vehículo
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Capacidad</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehiculos.map((vehiculo) => (
              <TableRow key={vehiculo.id}>
                <TableCell>{vehiculo.placa}</TableCell>
                <TableCell>{vehiculo.modelo}</TableCell>
                <TableCell>{vehiculo.capacidad} pasajeros</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(vehiculo)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(vehiculo.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Placa"
              margin="normal"
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
              disabled={editingVehiculo}
            />
            <TextField
              fullWidth
              label="Modelo"
              margin="normal"
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
            />
            <TextField
              fullWidth
              label="Capacidad de Pasajeros"
              type="number"
              margin="normal"
              value={formData.capacidad}
              onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingVehiculo ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <VehiculoBulkUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onUpload={handleBulkUpload}
      />
    </Box>
  );
};

export default VehiculosList; 