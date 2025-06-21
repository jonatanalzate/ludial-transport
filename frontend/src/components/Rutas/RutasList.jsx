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
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';

const RutasList = () => {
  const [rutas, setRutas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    origen: '',
    destino: '',
    distancia: '',
    tiempo_estimado: '',
    activa: true
  });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

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
        destino: ruta.destino,
        distancia: ruta.distancia || '',
        tiempo_estimado: ruta.tiempo_estimado || '',
        activa: ruta.activa !== undefined ? ruta.activa : true
      });
    } else {
      setEditingRuta(null);
      setFormData({
        nombre: '',
        origen: '',
        destino: '',
        distancia: '',
        tiempo_estimado: '',
        activa: true
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

  const handleToggleActiva = async (ruta) => {
    try {
      await api.updateRuta(ruta.id, { activa: !ruta.activa });
      loadRutas();
    } catch (error) {
      alert('Error al cambiar el estado de la ruta');
    }
  };

  // Filtrado avanzado
  const filteredRutas = rutas.filter((ruta) => {
    const searchText = search.toLowerCase();
    if (
      searchText &&
      !(
        ruta.nombre.toLowerCase().includes(searchText) ||
        ruta.origen.toLowerCase().includes(searchText) ||
        ruta.destino.toLowerCase().includes(searchText)
      )
    ) {
      return false;
    }
    if (filterEstado !== 'todos') {
      if (filterEstado === 'activa' && !ruta.activa) return false;
      if (filterEstado === 'inactiva' && ruta.activa) return false;
    }
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        {/* Barra de búsqueda y filtros */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Buscar por nombre, origen o destino"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label="Estado"
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="todos">Todos</option>
            <option value="activa">Solo activas</option>
            <option value="inactiva">Solo inactivas</option>
          </TextField>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell>Distancia (km)</TableCell>
              <TableCell>Tiempo Estimado (min)</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRutas.map((ruta) => (
              <TableRow key={ruta.id}>
                <TableCell>{ruta.nombre}</TableCell>
                <TableCell>{ruta.origen}</TableCell>
                <TableCell>{ruta.destino}</TableCell>
                <TableCell>{ruta.distancia ?? '-'}</TableCell>
                <TableCell>{ruta.tiempo_estimado ?? '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={ruta.activa ? 'Activa' : 'Inactiva'}
                    color={ruta.activa ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Switch
                    checked={!!ruta.activa}
                    onChange={() => handleToggleActiva(ruta)}
                    color="primary"
                  />
                </TableCell>
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
            <TextField
              fullWidth
              label="Distancia (km)"
              margin="normal"
              type="number"
              value={formData.distancia}
              onChange={(e) => setFormData({ ...formData, distancia: e.target.value })}
            />
            <TextField
              fullWidth
              label="Tiempo Estimado (min)"
              margin="normal"
              type="number"
              value={formData.tiempo_estimado}
              onChange={(e) => setFormData({ ...formData, tiempo_estimado: e.target.value })}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Switch
                checked={!!formData.activa}
                onChange={e => setFormData({ ...formData, activa: e.target.checked })}
                color="primary"
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {formData.activa ? 'Ruta activa' : 'Ruta inactiva'}
              </Typography>
            </Box>
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