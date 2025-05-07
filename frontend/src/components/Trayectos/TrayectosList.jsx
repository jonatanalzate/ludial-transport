import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../../services/api';
import TrayectoCard from './TrayectoCard';
import TrayectoForm from './TrayectoForm';
import { DirectionsBus, Person, Route, PlayArrow, CheckCircle, FlagCircle } from '@mui/icons-material';

const TrayectosList = () => {
  const [trayectos, setTrayectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [finalizarDialogOpen, setFinalizarDialogOpen] = useState(false);
  const [selectedTrayecto, setSelectedTrayecto] = useState(null);
  const [cantidadPasajeros, setCantidadPasajeros] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRuta, setFiltroRuta] = useState('');

  const fetchTrayectos = async () => {
    try {
      const response = await api.getTrayectos();
      setTrayectos(response.data);
    } catch (error) {
      console.error('Error al cargar trayectos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrayectos();
  }, []);

  const handleIniciarTrayecto = async (id) => {
    try {
      await api.iniciarTrayecto(id);
      fetchTrayectos();
    } catch (error) {
      console.error('Error al iniciar trayecto:', error);
    }
  };

  const handleFinalizarClick = (trayecto) => {
    setSelectedTrayecto(trayecto);
    setFinalizarDialogOpen(true);
  };

  const handleFinalizarConfirm = async () => {
    if (!cantidadPasajeros || cantidadPasajeros < 0) {
      alert('Por favor ingrese una cantidad válida de pasajeros');
      return;
    }

    try {
      const response = await api.finalizarTrayecto(selectedTrayecto.id, cantidadPasajeros);
      // console.log('Trayecto finalizado:', response.data);
      setFinalizarDialogOpen(false);
      setSelectedTrayecto(null);
      setCantidadPasajeros('');
      await fetchTrayectos();
    } catch (error) {
      console.error('Error al finalizar trayecto:', error);
      alert('Error al finalizar el trayecto: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  const trayectosFiltrados = trayectos.filter(trayecto => {
    let cumpleFiltros = true;

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      cumpleFiltros = cumpleFiltros && trayecto.estado.toLowerCase() === filtroEstado.toLowerCase();
    }

    // Filtro por nombre de ruta
    if (filtroRuta) {
      cumpleFiltros = cumpleFiltros && 
        trayecto.nombre_ruta.toLowerCase().includes(filtroRuta.toLowerCase());
    }

    return cumpleFiltros;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Trayectos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Nuevo Trayecto
        </Button>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filtroEstado}
            label="Estado"
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="programado">Programado</MenuItem>
            <MenuItem value="en_curso">En Curso</MenuItem>
            <MenuItem value="completado">Completado</MenuItem>
            <MenuItem value="cancelado">Cancelado</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Buscar por Ruta"
          variant="outlined"
          value={filtroRuta}
          onChange={(e) => setFiltroRuta(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #2196f3 100%)' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ruta</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Conductor</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vehículo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Salida</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Llegada</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...trayectosFiltrados]
                .sort((a, b) => new Date(b.fecha_salida || 0) - new Date(a.fecha_salida || 0))
                .map((trayecto) => (
                <TableRow key={trayecto.id} hover>
                  <TableCell>
                    <Chip
                      label={trayecto.estado}
                      color={(() => {
                        switch (trayecto.estado.toLowerCase()) {
                          case 'programado': return 'info';
                          case 'en_curso': return 'warning';
                          case 'completado': return 'success';
                          case 'cancelado': return 'error';
                          default: return 'default';
                        }
                      })()}
                      sx={{ fontWeight: 'bold', fontSize: 14 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Route fontSize="small" color="primary" />
                      <Typography>{trayecto.nombre_ruta}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="primary" />
                      <Typography>{trayecto.nombre_conductor}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DirectionsBus fontSize="small" color="primary" />
                      <Typography>{trayecto.placa_vehiculo}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {trayecto.fecha_salida ? new Date(trayecto.fecha_salida).toLocaleTimeString() : '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {trayecto.fecha_llegada ? new Date(trayecto.fecha_llegada).toLocaleTimeString() : '-'}
                  </TableCell>
                  <TableCell>
                    {trayecto.estado.toLowerCase() === 'programado' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrow />}
                        onClick={() => handleIniciarTrayecto(trayecto.id)}
                        sx={{
                          borderRadius: 3,
                          fontWeight: 'bold',
                          textTransform: 'none',
                          boxShadow: 2,
                          bgcolor: '#2e7d32',
                          '&:hover': { bgcolor: '#1b5e20' }
                        }}
                      >
                        Iniciar
                      </Button>
                    )}
                    {trayecto.estado.toLowerCase() === 'en_curso' && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<FlagCircle />}
                        onClick={() => handleFinalizarClick(trayecto)}
                        sx={{
                          borderRadius: 3,
                          fontWeight: 'bold',
                          textTransform: 'none',
                          boxShadow: 2,
                          bgcolor: '#1976d2',
                          '&:hover': { bgcolor: '#115293' }
                        }}
                      >
                        Finalizar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TrayectoForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={async (data) => {
          try {
            await api.createTrayecto(data);
            fetchTrayectos();
            setOpenForm(false);
          } catch (error) {
            console.error('Error al crear trayecto:', error);
          }
        }}
      />

      <Dialog open={finalizarDialogOpen} onClose={() => setFinalizarDialogOpen(false)}>
        <DialogTitle>Finalizar Trayecto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad de Pasajeros"
            type="number"
            fullWidth
            value={cantidadPasajeros}
            onChange={(e) => setCantidadPasajeros(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizarDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleFinalizarConfirm} variant="contained" color="primary">
            Finalizar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrayectosList; 