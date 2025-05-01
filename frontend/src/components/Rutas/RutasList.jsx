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
import RutaBulkUpload from './RutaBulkUpload';

const RutasList = () => {
  const [rutas, setRutas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    origen: '',
    destino: ''
  });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => {
    loadRutas();
  }, []);

  const loadRutas = async () => {
    try {
      const response = await api.getRutas();
      setRutas(response.data);
    } catch (error) {
      console.error('Error al cargar rutas:', error);
    }
  };

  const handleOpen = (ruta = null) => {
    if (ruta) {
      setEditingRuta(ruta);
      setFormData({
        nombre: ruta.nombre,
        origen: ruta.origen,
        destino: ruta.destino
      });
    } else {
      setEditingRuta(null);
      setFormData({
        nombre: '',
        origen: '',
        destino: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRuta(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRuta) {
        await api.updateRuta(editingRuta.id, formData);
      } else {
        await api.createRuta(formData);
      }
      handleClose();
      loadRutas();
    } catch (error) {
      console.error('Error al guardar ruta:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta ruta?')) {
      try {
        await api.deleteRuta(id);
        loadRutas();
      } catch (error) {
        console.error('Error al eliminar ruta:', error);
      }
    }
  };

  const handleBulkUpload = async (rutas) => {
    try {
      await api.createRutasBulk({ rutas });
      setBulkUploadOpen(false);
      loadRutas();
    } catch (error) {
      console.error('Error al cargar rutas masivamente:', error);
      alert('Error al cargar rutas: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Rutas</Typography>
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
            Nueva Ruta
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rutas.map((ruta) => (
              <TableRow key={ruta.id}>
                <TableCell>{ruta.nombre}</TableCell>
                <TableCell>{ruta.origen}</TableCell>
                <TableCell>{ruta.destino}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(ruta)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(ruta.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre"
              margin="normal"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <TextField
              fullWidth
              label="Origen"
              margin="normal"
              value={formData.origen}
              onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
            />
            <TextField
              fullWidth
              label="Destino"
              margin="normal"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <RutaBulkUpload
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onUpload={handleBulkUpload}
      />
    </Box>
  );
};

export default RutasList; 