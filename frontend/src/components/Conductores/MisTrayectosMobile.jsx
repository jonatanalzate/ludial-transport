import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Collapse,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import RouteIcon from '@mui/icons-material/Route';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlagCircleIcon from '@mui/icons-material/FlagCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { api } from '../../services/api';

const tiposNovedades = [
  { tipo: 'Accidente', icon: <WarningIcon />, color: '#f44336' },
  { tipo: 'Avería Mecánica', icon: <Build />, color: '#ff9800' },
  { tipo: 'Tráfico', icon: <RouteIcon />, color: '#ffc107' },
  { tipo: 'Problema de Ruta', icon: <RouteIcon />, color: '#2196f3' },
  { tipo: 'Otro', icon: <HelpIcon />, color: '#ffb74d' }
];

const MisTrayectosMobile = () => {
  const [trayectos, setTrayectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novedadMenuAnchor, setNovedadMenuAnchor] = useState(null);
  const [novedadDialogOpen, setNovedadDialogOpen] = useState(false);
  const [novedadTipo, setNovedadTipo] = useState('');
  const [novedadNotas, setNovedadNotas] = useState('');
  const [selectedTrayecto, setSelectedTrayecto] = useState(null);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const userRole = localStorage.getItem('role');
  const userId = parseInt(localStorage.getItem('user_id'));
  const userName = localStorage.getItem('nombre_completo') || 'Conductor';

  useEffect(() => {
    if (userRole !== 'conductor') {
      window.location.href = '/';
    }
    fetchTrayectos();
    // eslint-disable-next-line
  }, []);

  const fetchTrayectos = async () => {
    setLoading(true);
    try {
      const response = await api.getTrayectos();
      setTrayectos(response.data.filter(t => t.conductor_id === userId));
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al cargar trayectos', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const trayectoEnCurso = trayectos.find(t => t.estado && t.estado.toLowerCase() === 'en_curso');
  const proximoTrayecto = trayectos
    .filter(t => t.estado && t.estado.toLowerCase() === 'programado')
    .sort((a, b) => new Date(a.fecha_salida) - new Date(b.fecha_salida))[0];
  const historial = trayectos
    .filter(t => t.estado && t.estado.toLowerCase() === 'completado')
    .sort((a, b) => new Date(b.fecha_llegada) - new Date(a.fecha_llegada))
    .slice(0, 5);

  // Acciones trayecto
  const handleIniciarTrayecto = async (id) => {
    try {
      await api.iniciarTrayecto(id);
      setSnackbar({ open: true, message: 'Trayecto iniciado', severity: 'success' });
      fetchTrayectos();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al iniciar trayecto', severity: 'error' });
    }
  };

  const handleFinalizarTrayecto = async (trayecto) => {
    const cantidad = prompt('¿Cuántos pasajeros transportó?');
    if (!cantidad || isNaN(cantidad) || cantidad < 0) {
      setSnackbar({ open: true, message: 'Cantidad inválida', severity: 'warning' });
      return;
    }
    try {
      await api.finalizarTrayecto(trayecto.id, cantidad);
      setSnackbar({ open: true, message: 'Trayecto finalizado', severity: 'success' });
      fetchTrayectos();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al finalizar trayecto', severity: 'error' });
    }
  };

  // Novedad
  const handleNovedadClick = (event, trayecto) => {
    setSelectedTrayecto(trayecto);
    setNovedadMenuAnchor(event.currentTarget);
  };
  const handleNovedadTipoSelect = (tipo) => {
    setNovedadTipo(tipo);
    setNovedadMenuAnchor(null);
    setNovedadDialogOpen(true);
  };
  const handleNovedadSubmit = async () => {
    if (!novedadTipo) {
      setSnackbar({ open: true, message: 'Seleccione un tipo de novedad', severity: 'warning' });
      return;
    }
    try {
      await api.reportarNovedad({
        trayecto_id: selectedTrayecto.id,
        tipo: novedadTipo,
        notas: novedadNotas,
        conductor_id: userId,
      });
      setNovedadDialogOpen(false);
      setNovedadTipo('');
      setNovedadNotas('');
      setSelectedTrayecto(null);
      setSnackbar({ open: true, message: 'Novedad reportada', severity: 'success' });
      fetchTrayectos();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al reportar novedad', severity: 'error' });
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ bgcolor: '#181c24', minHeight: '100vh', color: 'white', pb: 8 }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ bgcolor: '#11151c' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Mis Trayectos
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{userName}</Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar />

      <Box sx={{ p: 2 }}>
        {/* Trayecto en curso o próximo */}
        {(trayectoEnCurso || proximoTrayecto) ? (
          <Card sx={{ mb: 3, bgcolor: '#23293a', color: 'white', borderRadius: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#90caf9' }}>
                {trayectoEnCurso ? 'En curso' : 'Próximo trayecto'}
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RouteIcon color="primary" />
                  <Typography>{(trayectoEnCurso || proximoTrayecto).nombre_ruta}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DirectionsBusIcon color="primary" />
                  <Typography>{(trayectoEnCurso || proximoTrayecto).placa_vehiculo}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" />
                  <Typography>{userName}</Typography>
                </Box>
                <Box>
                  <Chip
                    label={(trayectoEnCurso || proximoTrayecto).estado}
                    color={trayectoEnCurso ? 'warning' : 'info'}
                    sx={{ fontWeight: 'bold', fontSize: 14 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    Salida: {new Date((trayectoEnCurso || proximoTrayecto).fecha_salida).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                {trayectoEnCurso ? (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<FlagCircleIcon />}
                      sx={{ flex: 1, fontWeight: 700, fontSize: 18, borderRadius: 3 }}
                      onClick={() => handleFinalizarTrayecto(trayectoEnCurso)}
                    >
                      Finalizar
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<WarningIcon />}
                      sx={{ flex: 1, fontWeight: 700, fontSize: 18, borderRadius: 3 }}
                      onClick={(e) => handleNovedadClick(e, trayectoEnCurso)}
                    >
                      Novedad
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    sx={{ flex: 1, fontWeight: 700, fontSize: 18, borderRadius: 3 }}
                    onClick={() => handleIniciarTrayecto(proximoTrayecto.id)}
                  >
                    Iniciar
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Typography variant="h6" sx={{ mb: 3, color: '#90caf9' }}>
            No tienes trayectos asignados para hoy.
          </Typography>
        )}

        {/* Próximos trayectos */}
        <Typography variant="subtitle1" sx={{ mb: 1, mt: 2, color: '#90caf9' }}>
          Próximos trayectos
        </Typography>
        <Stack spacing={2}>
          {trayectos.filter(t => t.estado && t.estado.toLowerCase() === 'programado').map((t) => (
            <Card key={t.id} sx={{ bgcolor: '#23293a', color: 'white', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RouteIcon color="primary" />
                    <Typography>{t.nombre_ruta}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsBusIcon color="primary" />
                    <Typography>{t.placa_vehiculo}</Typography>
                  </Box>
                  <Box>
                    <Chip label={t.estado} color="info" sx={{ fontWeight: 'bold', fontSize: 14 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      Salida: {new Date(t.fecha_salida).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Historial */}
        <Box sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            color="secondary"
            endIcon={historialOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setHistorialOpen((prev) => !prev)}
            sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}
          >
            Historial reciente
          </Button>
          <Collapse in={historialOpen}>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {historial.length === 0 && (
                <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                  No hay trayectos completados recientes.
                </Typography>
              )}
              {historial.map((t) => (
                <Card key={t.id} sx={{ bgcolor: '#23293a', color: 'white', borderRadius: 2, boxShadow: 1 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RouteIcon color="primary" />
                        <Typography>{t.nombre_ruta}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DirectionsBusIcon color="primary" />
                        <Typography>{t.placa_vehiculo}</Typography>
                      </Box>
                      <Box>
                        <Chip label={t.estado} color="success" sx={{ fontWeight: 'bold', fontSize: 14 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          Llegada: {new Date(t.fecha_llegada).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Collapse>
        </Box>
      </Box>

      {/* Menú de novedades */}
      <Menu
        anchorEl={novedadMenuAnchor}
        open={Boolean(novedadMenuAnchor)}
        onClose={() => setNovedadMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: 2, boxShadow: 3, minWidth: 200 } }}
      >
        {tiposNovedades.map((novedad) => (
          <MenuItem
            key={novedad.tipo}
            onClick={() => handleNovedadTipoSelect(novedad.tipo)}
            sx={{ '&:hover': { bgcolor: novedad.tipo === 'Otro' ? '#fff3e0' : '#f5f5f5' } }}
          >
            <ListItemIcon>
              <Box sx={{ color: novedad.color }}>{novedad.icon}</Box>
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

      {/* Diálogo para notas de novedad */}
      <Dialog open={novedadDialogOpen} onClose={() => setNovedadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: novedadTipo === 'Otro' ? '#ff9800' : '#f44336' }}>
          <WarningIcon /> Reportar Novedad: {novedadTipo}
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

      {/* Botón flotante de ayuda */}
      <Fab
        color="primary"
        aria-label="ayuda"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
        onClick={() => setSnackbar({ open: true, message: 'Contacta a soporte: +57 300 000 0000', severity: 'info' })}
      >
        <HelpIcon />
      </Fab>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MisTrayectosMobile; 