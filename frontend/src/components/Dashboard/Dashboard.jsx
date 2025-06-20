import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  useTheme,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  DirectionsBus,
  Person,
  Route,
  Warning
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrayectoProgress from './TrayectoProgress';
import { api } from '../../services/api';
import { format } from 'date-fns';

const NOVEDAD_COLORS = {
  'Accidente': '#f44336',
  'Avería Mecánica': '#ff9800',
  'Tráfico': '#ffc107',
  'Problema de Ruta': '#2196f3',
  'Otro': '#ffb74d'
};

const StatCard = ({ icon, title, stats, color, loading }) => {
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        minHeight: 120
      }}
    >
      <Box
        sx={{
          bgcolor: color,
          borderRadius: 2,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          Object.entries(stats).map(([key, value]) => (
            <Typography key={key} variant="body1">
              {key}: <strong>{value}</strong>
            </Typography>
          ))
        )}
      </Box>
    </Paper>
  );
};

const Dashboard = () => {
  const [trayectosActivos, setTrayectosActivos] = useState([]);
  const [stats, setStats] = useState({
    vehiculos: { loading: true, data: {} },
    conductores: { loading: true, data: {} },
    rutas: { loading: true, data: {} }
  });
  const [trayectosModalOpen, setTrayectosModalOpen] = useState(false);
  const [vehiculosModalOpen, setVehiculosModalOpen] = useState(false);
  const [conductoresModalOpen, setConductoresModalOpen] = useState(false);
  const [rutasModalOpen, setRutasModalOpen] = useState(false);
  const [pasajerosHoy, setPasajerosHoy] = useState(0);
  const [novedadesStats, setNovedadesStats] = useState({ loading: true, data: { total: 0, hoy: 0, por_tipo: {} } });
  const theme = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehiculosRes, usuariosRes, rutasRes, trayectosRes] = await Promise.all([
          api.getVehiculos(),
          api.getUsuarios(),
          api.getRutas(),
          api.getTrayectos()
        ]);

        // Filtrar conductores desde usuarios
        const conductores = usuariosRes.data.filter(u => u.rol === 'conductor');

        const activos = trayectosRes.data.filter(
          t => t.estado && t.estado.toLowerCase() === 'en_curso'
        );
        setTrayectosActivos(activos);

        setStats({
          vehiculos: {
            loading: false,
            data: {
              'Total': vehiculosRes.data.length,
              'En servicio': vehiculosRes.data.filter(v => 
                activos.some(t => t.vehiculo_id === v.id)
              ).length
            }
          },
          conductores: {
            loading: false,
            data: {
              'Total': conductores.length,
              'En servicio': conductores.filter(c => 
                activos.some(t => t.conductor_id === c.id)
              ).length
            }
          },
          rutas: {
            loading: false,
            data: {
              'Total': rutasRes.data.length,
              'Activas': rutasRes.data.filter(r => 
                activos.some(t => t.ruta_id === r.id)
              ).length
            }
          }
        });

        // KPI: Pasajeros hoy
        const today = format(new Date(), 'yyyy-MM-dd');
        const pasajerosHoy = trayectosRes.data
          .filter(t => t.estado && t.estado.toLowerCase() === 'completado')
          .filter(t => t.fecha_salida && format(new Date(t.fecha_salida), 'yyyy-MM-dd') === today)
          .reduce((acc, t) => acc + (t.cantidad_pasajeros || 0), 0);
        setPasajerosHoy(pasajerosHoy);

        // Cargar KPIs de novedades
        const novedadesRes = await api.getNovedadesStats();
        setNovedadesStats({ loading: false, data: novedadesRes.data });
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Dashboard</Typography>

      {/* Resumen compacto de trayectos activos */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#e3f2fd', borderRadius: 2, p: 2, boxShadow: theme.shadows[1] }}>
        <Box>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            Trayectos en Curso
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {trayectosActivos.length > 0
              ? `Hay ${trayectosActivos.length} trayecto${trayectosActivos.length > 1 ? 's' : ''} activo${trayectosActivos.length > 1 ? 's' : ''}`
              : 'No hay trayectos en curso'}
          </Typography>
        </Box>
        {trayectosActivos.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setTrayectosModalOpen(true)}
            sx={{ boxShadow: theme.shadows[2], fontWeight: 600 }}
          >
            Ver Detalles
          </Button>
        )}
      </Box>

      {/* Modal elegante con accordions para trayectos activos */}
      <Dialog open={trayectosModalOpen} onClose={() => setTrayectosModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Trayectos en Curso</span>
          <IconButton onClick={() => setTrayectosModalOpen(false)}>
            <span style={{ fontSize: 24, fontWeight: 'bold' }}>&times;</span>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f5f5f5' }}>
          {trayectosActivos.length === 0 ? (
            <Typography>No hay trayectos en curso.</Typography>
          ) : (
            trayectosActivos.map((trayecto) => (
              <Accordion key={trayecto.id} sx={{ mb: 2, borderRadius: 2, boxShadow: theme.shadows[1] }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {trayecto.nombre_ruta || trayecto.id}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Conductor: {trayecto.nombre_conductor} &nbsp;|&nbsp; Vehículo: {trayecto.placa_vehiculo}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TrayectoProgress trayecto={trayecto} />
                </AccordionDetails>
              </Accordion>
            ))
          )}
          <Button variant="contained" color="secondary" fullWidth sx={{ mt: 3, fontWeight: 600 }} onClick={() => window.location.href = '/trayectos'}>
            Ver todos los trayectos
          </Button>
        </DialogContent>
      </Dialog>

      {/* KPI PASAJEROS HOY */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ p: 3, borderRadius: 3, minWidth: 260, background: 'linear-gradient(90deg, #e3ffe6 0%, #b2f7c1 100%)', boxShadow: theme.shadows[4], display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            PASAJEROS HOY
          </Typography>
          <Typography variant="h3" color="success.dark" sx={{ fontWeight: 900, mt: 1 }}>
            {pasajerosHoy}
          </Typography>
        </Paper>
      </Box>

      {/* KPIs de Novedades */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4} lg={3}>
          <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(90deg, #fff3e0 0%, #ffe0b2 100%)', boxShadow: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning sx={{ color: '#ff9800', fontSize: 40 }} />
            <Box>
              <Typography variant="subtitle2" color="#ff9800" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                NOVEDADES HOY
              </Typography>
              {novedadesStats.loading ? <CircularProgress size={20} /> : (
                <Typography variant="h4" color="#ff9800" sx={{ fontWeight: 900, mt: 1 }}>
                  {novedadesStats.data.hoy}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4} lg={3}>
          <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(90deg, #ffeaea 0%, #ffcdd2 100%)', boxShadow: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Warning sx={{ color: '#f44336', fontSize: 40 }} />
            <Box>
              <Typography variant="subtitle2" color="#f44336" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                TOTAL NOVEDADES
              </Typography>
              {novedadesStats.loading ? <CircularProgress size={20} /> : (
                <Typography variant="h4" color="#f44336" sx={{ fontWeight: 900, mt: 1 }}>
                  {novedadesStats.data.total}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        {/* Novedades por tipo */}
        {Object.entries(novedadesStats.data.por_tipo || {}).map(([tipo, cantidad]) => (
          <Grid item xs={12} md={4} lg={3} key={tipo}>
            <Paper sx={{ p: 2, borderRadius: 3, background: NOVEDAD_COLORS[tipo] + '22', boxShadow: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Warning sx={{ color: NOVEDAD_COLORS[tipo], fontSize: 40 }} />
              <Box>
                <Typography variant="subtitle2" color={NOVEDAD_COLORS[tipo]} sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  {tipo.toUpperCase()}
                </Typography>
                <Typography variant="h4" color={NOVEDAD_COLORS[tipo]} sx={{ fontWeight: 900, mt: 1 }}>
                  {cantidad}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tarjetas de módulos clickables y animadas */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Box
            onClick={() => setVehiculosModalOpen(true)}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s cubic-bezier(.4,2,.6,1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 32px 0 rgba(76,175,80,0.25)',
                border: '2px solid #388e3c',
                background: 'linear-gradient(90deg, #e8f5e9 0%, #c8e6c9 100%)',
              },
              borderRadius: 3,
              boxShadow: theme.shadows[3],
              border: '2px solid transparent',
              background: 'linear-gradient(90deg, #f5fff7 0%, #e8f5e9 100%)',
            }}
          >
            <StatCard
              icon={<DirectionsBus sx={{ color: 'white', fontSize: 40 }} />}
              title="VEHÍCULOS"
              stats={stats.vehiculos.data}
              loading={stats.vehiculos.loading}
              color="#4caf50"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Box
            onClick={() => setConductoresModalOpen(true)}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s cubic-bezier(.4,2,.6,1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 32px 0 rgba(33,150,243,0.25)',
                border: '2px solid #1565c0',
                background: 'linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%)',
              },
              borderRadius: 3,
              boxShadow: theme.shadows[3],
              border: '2px solid transparent',
              background: 'linear-gradient(90deg, #f5faff 0%, #e3f2fd 100%)',
            }}
          >
            <StatCard
              icon={<Person sx={{ color: 'white', fontSize: 40 }} />}
              title="CONDUCTORES"
              stats={stats.conductores.data}
              loading={stats.conductores.loading}
              color="#2196f3"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Box
            onClick={() => setRutasModalOpen(true)}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s cubic-bezier(.4,2,.6,1)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 32px 0 rgba(255,152,0,0.25)',
                border: '2px solid #ef6c00',
                background: 'linear-gradient(90deg, #fff8e1 0%, #ffe0b2 100%)',
              },
              borderRadius: 3,
              boxShadow: theme.shadows[3],
              border: '2px solid transparent',
              background: 'linear-gradient(90deg, #fffdf5 0%, #fff8e1 100%)',
            }}
          >
            <StatCard
              icon={<Route sx={{ color: 'white', fontSize: 40 }} />}
              title="RUTAS"
              stats={stats.rutas.data}
              loading={stats.rutas.loading}
              color="#ff9800"
            />
          </Box>
        </Grid>
      </Grid>

      {/* Modales para cada módulo */}
      <Dialog open={vehiculosModalOpen} onClose={() => setVehiculosModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#388e3c', bgcolor: '#e8f5e9' }}>Vehículos</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f5fff7' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>Total: <b>{stats.vehiculos.data['Total']}</b></Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>En servicio: <b>{stats.vehiculos.data['En servicio']}</b></Typography>
          <Button variant="contained" color="success" fullWidth sx={{ mt: 2 }} onClick={() => window.location.href = '/vehiculos'}>Ver lista de vehículos</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={conductoresModalOpen} onClose={() => setConductoresModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1565c0', bgcolor: '#e3f2fd' }}>Conductores</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f5faff' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>Total: <b>{stats.conductores.data['Total']}</b></Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>En servicio: <b>{stats.conductores.data['En servicio']}</b></Typography>
          <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={() => window.location.href = '/conductores'}>Ver lista de conductores</Button>
        </DialogContent>
      </Dialog>
      <Dialog open={rutasModalOpen} onClose={() => setRutasModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef6c00', bgcolor: '#fff8e1' }}>Rutas</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#fffdf5' }}>
          <Typography variant="body1" sx={{ mb: 2 }}>Total: <b>{stats.rutas.data['Total']}</b></Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>Activas: <b>{stats.rutas.data['Activas']}</b></Typography>
          <Button variant="contained" color="warning" fullWidth sx={{ mt: 2 }} onClick={() => window.location.href = '/rutas'}>Ver lista de rutas</Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 