import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
  Alert,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../../services/api';
import TrayectoCard from './TrayectoCard';
import TrayectoForm from './TrayectoForm';
import { 
  DirectionsBus, 
  Person, 
  Route, 
  PlayArrow, 
  CheckCircle, 
  FlagCircle,
  Warning,
  Report,
  Build,
  LocalHospital,
  Traffic,
  MoreVert
} from '@mui/icons-material';

const TrayectosList = () => {
  const [trayectos, setTrayectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [finalizarDialogOpen, setFinalizarDialogOpen] = useState(false);
  const [selectedTrayecto, setSelectedTrayecto] = useState(null);
  const [cantidadPasajeros, setCantidadPasajeros] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRuta, setFiltroRuta] = useState('');
  const userRole = localStorage.getItem('role');
  const userId = parseInt(localStorage.getItem('user_id'));
  const intervalRef = useRef(null);
  const [geoStatus, setGeoStatus] = useState('pending'); // 'pending', 'active', 'denied', 'error'
  const [geoError, setGeoError] = useState('');
  const [geoWatcher, setGeoWatcher] = useState(null);
  
  // Estados para novedades
  const [novedadMenuAnchor, setNovedadMenuAnchor] = useState(null);
  const [selectedTrayectoForNovedad, setSelectedTrayectoForNovedad] = useState(null);
  const [novedadDialogOpen, setNovedadDialogOpen] = useState(false);
  const [novedadTipo, setNovedadTipo] = useState('');
  const [novedadNotas, setNovedadNotas] = useState('');

  // Tipos de novedades
  const tiposNovedades = [
    { tipo: 'Accidente', icon: <LocalHospital />, color: '#f44336' },
    { tipo: 'Avería Mecánica', icon: <Build />, color: '#ff9800' },
    { tipo: 'Tráfico', icon: <Traffic />, color: '#ffc107' },
    { tipo: 'Problema de Ruta', icon: <Route />, color: '#2196f3' },
    { tipo: 'Otro', icon: <MoreVert />, color: '#ffb74d' } // Naranja claro
  ];

  const fetchTrayectos = async () => {
    try {
      const response = await api.getTrayectos();
      setTrayectos(response.data);
    } catch (error) {
      // console.error('Error al cargar trayectos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrayectos();
    // Si es conductor, enviar ubicación periódicamente si tiene trayecto activo
    if (userRole === 'conductor') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const trayectoActivo = trayectos.find(t => t.conductor_id === userId && t.estado && t.estado.toLowerCase() === 'en_curso');
        if (trayectoActivo && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            api.enviarUbicacion({
              conductor_id: userId,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          });
        }
      }, 10000); // cada 10 segundos
    }
    if (userRole === 'conductor') {
      if (geoWatcher) navigator.geolocation.clearWatch(geoWatcher);
      if (navigator.geolocation) {
        const watcher = navigator.geolocation.watchPosition(
          (pos) => {
            setGeoStatus('active');
            setGeoError('');
            const trayectoActivo = trayectos.find(t => t.conductor_id === userId && t.estado && t.estado.toLowerCase() === 'en_curso');
            if (trayectoActivo) {
              api.enviarUbicacion({
                conductor_id: userId,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
            }
          },
          (err) => {
            setGeoStatus('denied');
            setGeoError('Debes permitir el acceso a la ubicación para ser monitoreado.');
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
        );
        setGeoWatcher(watcher);
      } else {
        setGeoStatus('error');
        setGeoError('Tu dispositivo no soporta geolocalización.');
      }
      return () => {
        if (geoWatcher) navigator.geolocation.clearWatch(geoWatcher);
      };
    }
    // eslint-disable-next-line
  }, [userRole, userId, trayectos]);

  const handleIniciarTrayecto = async (id) => {
    try {
      await api.iniciarTrayecto(id);

      // Añadir un pequeño retraso para dar tiempo a la base de datos
      await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms

      // Una vez iniciado el trayecto, enviar la ubicación actual
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            api.enviarUbicacion({
              conductor_id: userId, // Asumiendo que userId está disponible en este alcance
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          },
          (err) => {
            console.error('Error obteniendo ubicación al iniciar trayecto:', err);
            alert('No se pudo obtener la ubicación inicial. Asegúrate de permitir el acceso a la ubicación.');
          }
        );
      } else {
        alert('Tu dispositivo no soporta geolocalización, no se podrá registrar la ubicación inicial.');
      }
      fetchTrayectos();
    } catch (error) {
      // console.error('Error al iniciar trayecto:', error);
      alert('Error al iniciar el trayecto: ' + (error.response?.data?.detail || 'Error desconocido'));
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
      // console.error('Error al finalizar trayecto:', error);
      alert('Error al finalizar el trayecto: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  // Funciones para manejar novedades
  const handleNovedadClick = (event, trayecto) => {
    setNovedadMenuAnchor(event.currentTarget);
    setSelectedTrayectoForNovedad(trayecto);
  };

  const handleNovedadMenuClose = () => {
    setNovedadMenuAnchor(null);
    setSelectedTrayectoForNovedad(null);
  };

  const handleNovedadTipoSelect = (tipo) => {
    setNovedadTipo(tipo);
    setNovedadMenuAnchor(null);
    setNovedadDialogOpen(true);
  };

  const handleNovedadSubmit = async () => {
    if (!novedadTipo) {
      alert('Por favor seleccione un tipo de novedad');
      return;
    }

    try {
      await api.getNovedades({
        trayecto_id: selectedTrayectoForNovedad.id,
        tipo: novedadTipo,
        notas: novedadNotas,
        conductor_id: userId
      });
      setNovedadDialogOpen(false);
      setNovedadTipo('');
      setNovedadNotas('');
      setSelectedTrayectoForNovedad(null);
      alert('Novedad reportada exitosamente');
      fetchTrayectos();
    } catch (error) {
      console.error('Error al reportar novedad:', error);
      alert('Error al reportar la novedad: ' + (error.response?.data?.detail || 'Error desconocido'));
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

    // Si es conductor, solo mostrar trayectos asignados a él
    if (userRole === 'conductor') {
      cumpleFiltros = cumpleFiltros && trayecto.conductor_id === userId;
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
                    {trayecto.fecha_salida ? new Date(trayecto.fecha_salida).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' }) : '-'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {trayecto.fecha_llegada ? new Date(trayecto.fecha_llegada).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' }) : '-'}
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
                      <Box sx={{ display: 'flex', gap: 1 }}>
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
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<Warning />}
                          onClick={(event) => handleNovedadClick(event, trayecto)}
                          sx={{
                            borderRadius: 3,
                            fontWeight: 'bold',
                            textTransform: 'none',
                            boxShadow: 2,
                            bgcolor: '#ff9800',
                            '&:hover': { bgcolor: '#f57c00' }
                          }}
                        >
                          Novedad
                        </Button>
                      </Box>
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
            // console.error('Error al crear trayecto:', error);
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

      {/* Menú desplegable de novedades */}
      <Menu
        anchorEl={novedadMenuAnchor}
        open={Boolean(novedadMenuAnchor)}
        onClose={handleNovedadMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 200
          }
        }}
      >
        {tiposNovedades.map((novedad) => (
          <MenuItem
            key={novedad.tipo}
            onClick={() => handleNovedadTipoSelect(novedad.tipo)}
            sx={{
              '&:hover': {
                bgcolor: novedad.tipo === 'Otro' ? '#fff3e0' : '#f5f5f5'
              }
            }}
          >
            <ListItemIcon>
              <Box sx={{ color: novedad.color }}>
                {novedad.icon}
              </Box>
            </ListItemIcon>
            <ListItemText 
              primary={novedad.tipo}
              primaryTypographyProps={{
                sx: {
                  color: novedad.tipo === 'Otro' ? '#ff9800' : 'inherit',
                  fontWeight: novedad.tipo === 'Otro' ? 600 : 400
                }
              }}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Diálogo para ingresar notas de novedad */}
      <Dialog open={novedadDialogOpen} onClose={() => setNovedadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: novedadTipo === 'Otro' ? '#ff9800' : '#f44336'
        }}>
          <Warning />
          Reportar Novedad: {novedadTipo}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notas adicionales (opcional)"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={novedadNotas}
            onChange={(e) => setNovedadNotas(e.target.value)}
            placeholder="Describe los detalles de la novedad..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNovedadDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleNovedadSubmit} 
            variant="contained" 
            sx={{
              bgcolor: novedadTipo === 'Otro' ? '#ff9800' : '#f44336',
              '&:hover': {
                bgcolor: novedadTipo === 'Otro' ? '#f57c00' : '#d32f2f'
              }
            }}
          >
            Reportar
          </Button>
        </DialogActions>
      </Dialog>

      {userRole === 'conductor' && (
        <Snackbar open={geoStatus !== 'active'} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity={geoStatus === 'denied' ? 'error' : 'info'} sx={{ width: '100%' }}>
            {geoStatus === 'pending' && 'Solicitando permiso de ubicación...'}
            {geoStatus === 'denied' && geoError}
            {geoStatus === 'error' && geoError}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default TrayectosList; 