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
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { api } from '../../services/api';
import VehiculoBulkUpload from './VehiculoBulkUpload';
import { differenceInDays, parseISO } from 'date-fns';

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const defaultPicoYPlacaConfig = {
  1: ['0', '1'], // Lunes
  2: ['2', '3'], // Martes
  3: ['4'],      // Miércoles
  4: ['5', '6'], // Jueves
  5: ['7', '8'], // Viernes
  6: ['9'],      // Sábado
  0: []          // Domingo
};

const VehiculosList = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    capacidad: '',
    soat_vencimiento: '',
    tecnomecanica_vencimiento: '',
    kit_vencimiento: '',
    pico_placa: '',
    activo: true
  });
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [picoYPlacaConfig, setPicoYPlacaConfig] = useState(defaultPicoYPlacaConfig);
  const [configOpen, setConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState(picoYPlacaConfig);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActivo, setFilterActivo] = useState('todos');
  const [filterVencimiento, setFilterVencimiento] = useState('todos');
  const [filterPicoYPlaca, setFilterPicoYPlaca] = useState('todos');

  // Cargar configuración desde el backend al iniciar
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoadingConfig(true);
        const res = await api.getPicoYPlacaConfig();
        setPicoYPlacaConfig(res.data.config);
        setConfigDraft(res.data.config);
      } catch (e) {
        // Si falla, usar por defecto
        setPicoYPlacaConfig(defaultPicoYPlacaConfig);
        setConfigDraft(defaultPicoYPlacaConfig);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const handleConfigOpen = () => {
    setConfigDraft({ ...picoYPlacaConfig });
    setConfigOpen(true);
  };
  const handleConfigClose = () => setConfigOpen(false);
  const handleConfigSave = async () => {
    setSavingConfig(true);
    try {
      await api.updatePicoYPlacaConfig({ config: configDraft });
      setPicoYPlacaConfig({ ...configDraft });
      setConfigOpen(false);
    } catch (e) {
      alert('Error al guardar la configuración de pico y placa');
    } finally {
      setSavingConfig(false);
    }
  };
  const handleConfigChange = (dia, value) => {
    setConfigDraft((prev) => ({
      ...prev,
      [dia]: value.split(/[,\s]+/).filter(Boolean)
    }));
  };

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
        capacidad: vehiculo.capacidad,
        soat_vencimiento: vehiculo.soat_vencimiento || '',
        tecnomecanica_vencimiento: vehiculo.tecnomecanica_vencimiento || '',
        kit_vencimiento: vehiculo.kit_vencimiento || '',
        pico_placa: vehiculo.pico_placa || '',
        activo: vehiculo.activo !== undefined ? vehiculo.activo : true
      });
    } else {
      setEditingVehiculo(null);
      setFormData({
        placa: '',
        modelo: '',
        capacidad: '',
        soat_vencimiento: '',
        tecnomecanica_vencimiento: '',
        kit_vencimiento: '',
        pico_placa: '',
        activo: true
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
        capacidad: parseInt(formData.capacidad),
        activo: Boolean(formData.activo)
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

  // Función para determinar el estado de vencimiento más crítico
  const getVencimientoStatus = (vehiculo) => {
    const hoy = new Date();
    const fechas = [vehiculo.soat_vencimiento, vehiculo.tecnomecanica_vencimiento, vehiculo.kit_vencimiento]
      .filter(Boolean)
      .map(f => typeof f === 'string' ? parseISO(f) : f);
    if (fechas.length === 0) return 'ok';
    let minDiff = Infinity;
    for (const fecha of fechas) {
      const diff = differenceInDays(fecha, hoy);
      if (diff < minDiff) minDiff = diff;
    }
    if (minDiff < 0) return 'vencido';
    if (minDiff <= 15) return 'proximo';
    return 'ok';
  };

  const getHoyPicoYPlaca = () => {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0=Domingo, 1=Lunes, ...
    return picoYPlacaConfig[dia] || [];
  };

  const isEnPicoYPlaca = (vehiculo) => {
    const hoyPicoYPlaca = getHoyPicoYPlaca();
    return vehiculo.pico_placa && hoyPicoYPlaca.includes(vehiculo.pico_placa);
  };

  // Filtrado avanzado
  const filteredVehiculos = vehiculos
    .filter((vehiculo) => {
      // Búsqueda por placa o modelo
      const searchText = search.toLowerCase();
      if (
        searchText &&
        !(
          vehiculo.placa.toLowerCase().includes(searchText) ||
          vehiculo.modelo.toLowerCase().includes(searchText)
        )
      ) {
        return false;
      }
      // Filtro activo/inactivo
      if (filterActivo !== 'todos') {
        if (filterActivo === 'activo' && !vehiculo.activo) return false;
        if (filterActivo === 'inactivo' && vehiculo.activo) return false;
      }
      // Filtro vencimiento
      const vencStatus = getVencimientoStatus(vehiculo);
      if (filterVencimiento !== 'todos' && vencStatus !== filterVencimiento) return false;
      // Filtro pico y placa
      const enPicoYPlaca = isEnPicoYPlaca(vehiculo);
      if (filterPicoYPlaca === 'hoy' && !enPicoYPlaca) return false;
      if (filterPicoYPlaca === 'nohoy' && enPicoYPlaca) return false;
      return true;
    });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <Button
              variant="outlined"
              color="info"
              onClick={handleConfigOpen}
            >
              Configurar Pico y Placa
            </Button>
          </Box>
        </Box>
        {/* Barra de búsqueda y filtros */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Buscar por placa o modelo"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          />
          <TextField
            select
            label="Estado"
            value={filterActivo}
            onChange={e => setFilterActivo(e.target.value)}
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="todos">Todos</option>
            <option value="activo">Solo activos</option>
            <option value="inactivo">Solo inactivos</option>
          </TextField>
          <TextField
            select
            label="Vencimiento"
            value={filterVencimiento}
            onChange={e => setFilterVencimiento(e.target.value)}
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="todos">Todos</option>
            <option value="vencido">Vencido</option>
            <option value="proximo">Próximo a vencer</option>
            <option value="ok">En regla</option>
          </TextField>
          <TextField
            select
            label="Pico y Placa"
            value={filterPicoYPlaca}
            onChange={e => setFilterPicoYPlaca(e.target.value)}
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="todos">Todos</option>
            <option value="hoy">En pico y placa hoy</option>
            <option value="nohoy">No en pico y placa hoy</option>
          </TextField>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Capacidad</TableCell>
              <TableCell>Pico y Placa</TableCell>
              <TableCell>SOAT</TableCell>
              <TableCell>Tecnomecánica</TableCell>
              <TableCell>Kit</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVehiculos
              .slice()
              .sort((a, b) => {
                // Orden: vencido > próximo > ok
                const statusOrder = { vencido: 0, proximo: 1, ok: 2 };
                return statusOrder[getVencimientoStatus(a)] - statusOrder[getVencimientoStatus(b)];
              })
              .map((vehiculo) => {
                const vencStatus = getVencimientoStatus(vehiculo);
                let rowColor = undefined;
                if (vencStatus === 'vencido') rowColor = '#ffebee'; // rojo claro
                else if (vencStatus === 'proximo') rowColor = '#fffde7'; // amarillo claro
                return (
                  <TableRow key={vehiculo.id} style={rowColor ? { background: rowColor } : {}}>
                    <TableCell>{vehiculo.placa}</TableCell>
                    <TableCell>{vehiculo.modelo}</TableCell>
                    <TableCell>{vehiculo.capacidad} pasajeros</TableCell>
                    <TableCell>{vehiculo.pico_placa || '-'}</TableCell>
                    <TableCell>{vehiculo.soat_vencimiento || '-'}</TableCell>
                    <TableCell>{vehiculo.tecnomecanica_vencimiento || '-'}</TableCell>
                    <TableCell>{vehiculo.kit_vencimiento || '-'}</TableCell>
                    <TableCell>
                      {vehiculo.activo ? (
                        <Typography color="success.main">Activo</Typography>
                      ) : (
                        <Typography color="error.main">Inactivo</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpen(vehiculo)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(vehiculo.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
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
            <TextField
              fullWidth
              label="Pico y Placa (dígito/s)"
              margin="normal"
              value={formData.pico_placa}
              onChange={(e) => setFormData({ ...formData, pico_placa: e.target.value })}
              helperText="Ej: 1,2,3 o 9"
            />
            <TextField
              fullWidth
              label="SOAT Vence"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formData.soat_vencimiento}
              onChange={(e) => setFormData({ ...formData, soat_vencimiento: e.target.value })}
            />
            <TextField
              fullWidth
              label="Tecnomecánica Vence"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formData.tecnomecanica_vencimiento}
              onChange={(e) => setFormData({ ...formData, tecnomecanica_vencimiento: e.target.value })}
            />
            <TextField
              fullWidth
              label="Kit Carretera Vence"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              value={formData.kit_vencimiento}
              onChange={(e) => setFormData({ ...formData, kit_vencimiento: e.target.value })}
            />
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

      <Dialog open={configOpen} onClose={handleConfigClose} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Pico y Placa</DialogTitle>
        <DialogContent>
          {diasSemana.map((dia, idx) => (
            <TextField
              key={dia}
              fullWidth
              label={dia}
              margin="normal"
              value={configDraft[idx]?.join(',') || ''}
              onChange={(e) => handleConfigChange(idx, e.target.value)}
              helperText="Separar dígitos por coma o espacio"
              disabled={loadingConfig || savingConfig}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfigClose} disabled={savingConfig}>Cancelar</Button>
          <Button onClick={handleConfigSave} variant="contained" disabled={savingConfig}>
            {savingConfig ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehiculosList; 