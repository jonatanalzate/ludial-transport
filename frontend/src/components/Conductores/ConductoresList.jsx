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
import ConductorBulkUpload from './ConductorBulkUpload';

const ConductoresList = () => {
  const [conductores, setConductores] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    licencia: '',
    telefono: ''
  });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    try {
      const response = await api.getConductores();
      setConductores(response.data);
    } catch (error) {
      console.error('Error al cargar conductores:', error);
    }
  };

  const handleOpen = (conductor = null) => {
    if (conductor) {
      setEditingConductor(conductor);
      setFormData({
        nombre: conductor.nombre,
        licencia: conductor.licencia,
        telefono: conductor.telefono
      });
    } else {
      setEditingConductor(null);
      setFormData({
        nombre: '',
        licencia: '',
        telefono: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingConductor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingConductor) {
        await api.updateConductor(editingConductor.id, formData);
      } else {
        await api.createConductor(formData);
      }
      handleClose();
      loadConductores();
    } catch (error) {
      console.error('Error al guardar conductor:', error);
      alert('Error al guardar conductor: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor?')) {
      try {
        await api.deleteConductor(id);
        loadConductores();
      } catch (error) {
        console.error('Error al eliminar conductor:', error);
      }
    }
  };

  const handleBulkUpload = async (conductores) => {
    try {
      await api.createConductoresBulk({ conductores });
      setBulkUploadOpen(false);
      loadConductores();
    } catch (error) {
      console.error('Error al cargar conductores masivamente:', error);
      alert('Error al cargar conductores: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Conductores</Typography>
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
            Nuevo Conductor
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Licencia</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conductores.map((conductor) => (
              <TableRow key={conductor.id}>
                <TableCell>{conductor.nombre}</TableCell>
                <TableCell>{conductor.licencia}</TableCell>
                <TableCell>{conductor.telefono}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(conductor)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(conductor.id)}>
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
          {editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre Completo"
              margin="normal"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <TextField
              fullWidth
              label="Número de Licencia"
              margin="normal"
              value={formData.licencia}
              onChange={(e) => setFormData({ ...formData, licencia: e.target.value })}
            />
            <TextField
              fullWidth
              label="Teléfono"
              margin="normal"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingConductor ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConductorBulkUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onUpload={handleBulkUpload}
      />
    </Box>
  );
};

export default ConductoresList; 