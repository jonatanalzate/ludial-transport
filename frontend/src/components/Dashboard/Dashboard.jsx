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
  const [novedadesDia, setNovedadesDia] = useState([]);
  const [vehiculosFueraDeTiempo, setVehiculosFueraDeTiempo] = useState(0);
  const [fueraDeTiempoModalOpen, setFueraDeTiempoModalOpen] = useState(false);
  const [trayectosFueraDeTiempo, setTrayectosFueraDeTiempo] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehiculosRes, usuariosRes, rutasRes, trayectosRes, novedadesRes, novedadesListRes] = await Promise.all([
          api.getVehiculos(),
          api.getUsuarios(),
          api.getRutas(),
          api.getTrayectos(),
          api.getNovedadesStats(),
          api.getNovedades()
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
        setNovedadesStats({ loading: false, data: novedadesRes.data });

        // Filtrar novedades del día
        const novedadesHoy = (novedadesListRes.data || []).filter(nov =>
          nov.fecha_reporte && format(new Date(nov.fecha_reporte), 'yyyy-MM-dd') === today
        );
        setNovedadesDia(novedadesHoy);

        // Calcular vehículos fuera de tiempo
        const now = new Date();
        const trayectosFuera = trayectosRes.data.filter(t => {
          if (!t.estado || t.estado.toLowerCase() !== 'en_curso') return false;
          if (!t.fecha_salida || !t.duracion_minutos) return false;
          const salida = new Date(t.fecha_salida);
          const estimadoMs = (t.duracion_minutos || 60) * 60 * 1000;
          return now.getTime() > salida.getTime() + estimadoMs;
        });
        setVehiculosFueraDeTiempo(trayectosFuera.length);
        setTrayectosFueraDeTiempo(trayectosFuera);
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

      {/* KPI Row: Pasajeros y Novedades */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* KPI PASAJEROS HOY */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', background: 'linear-gradient(90deg, #e3ffe6 0%, #b2f7c1 100%)', boxShadow: theme.shadows[4], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              PASAJEROS HOY
            </Typography>
            <Typography variant="h3" color="success.dark" sx={{ fontWeight: 900, mt: 1 }}>
              {pasajerosHoy}
            </Typography>
          </Paper>
        </Grid>

        {/* KPI Novedades Hoy */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', background: 'linear-gradient(90deg, #fff3e0 0%, #ffe0b2 100%)', boxShadow: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="subtitle2" color="#ff9800" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              NOVEDADES HOY
            </Typography>
            {novedadesStats.loading ? <CircularProgress size={20} /> : (
              <Typography variant="h4" color="#ff9800" sx={{ fontWeight: 900, mt: 1 }}>
                {novedadesStats.data.hoy}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* KPI Vehículos fuera de tiempo */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{ p: 3, borderRadius: 3, height: '100%', background: 'linear-gradient(90deg, #ffeaea 0%, #ffcdd2 100%)', boxShadow: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: vehiculosFueraDeTiempo > 0 ? 'pointer' : 'default', opacity: vehiculosFueraDeTiempo > 0 ? 1 : 0.7 }}
            onClick={() => vehiculosFueraDeTiempo > 0 && setFueraDeTiempoModalOpen(true)}
          >
            <Typography variant="subtitle2" color="#f44336" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              VEHÍCULOS FUERA DE TIEMPO
            </Typography>
            <Typography variant="h4" color="#f44336" sx={{ fontWeight: 900, mt: 1 }}>
              {vehiculosFueraDeTiempo}
            </Typography>
            {vehiculosFueraDeTiempo > 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                Haz clic para ver detalles
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Desglose de Novedades del Día */}
      <Typography variant="h6" sx={{ mb: 2, mt: 4, color: 'text.secondary' }}>Novedades del Día</Typography>
      {novedadesStats.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : novedadesDia.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 4 }}>
          No hay novedades reportadas hoy.
        </Typography>
      ) : (
        <Box>
          {novedadesDia.map((nov) => (
            <Accordion key={nov.id} sx={{ mb: 2, borderRadius: 2, boxShadow: theme.shadows[1] }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: NOVEDAD_COLORS[nov.tipo] }}>
                    {nov.tipo}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {nov.nombre_conductor} &nbsp;|&nbsp; {nov.nombre_ruta} &nbsp;|&nbsp; {format(new Date(nov.fecha_reporte), 'HH:mm')}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 1 }}><b>Observación:</b> {nov.notas || 'Sin observación'}</Typography>
                <Typography variant="body2"><b>Conductor:</b> {nov.nombre_conductor}</Typography>
                <Typography variant="body2"><b>Ruta:</b> {nov.nombre_ruta}</Typography>
                <Typography variant="body2"><b>Fecha reporte:</b> {format(new Date(nov.fecha_reporte), 'yyyy-MM-dd HH:mm')}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Tarjetas de módulos informativas */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6} lg={4}>
          <Box
            sx={{
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
            sx={{
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
            sx={{
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

      {/* Modal de trayectos fuera de tiempo */}
      <Dialog open={fueraDeTiempoModalOpen} onClose={() => setFueraDeTiempoModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Vehículos fuera de tiempo</span>
          <IconButton onClick={() => setFueraDeTiempoModalOpen(false)}>
            <span style={{ fontSize: 24, fontWeight: 'bold' }}>&times;</span>
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f5f5f5' }}>
          {trayectosFueraDeTiempo.length === 0 ? (
            <Typography>No hay trayectos fuera de tiempo.</Typography>
          ) : (
            <Box>
              {trayectosFueraDeTiempo.map((t) => {
                const salida = new Date(t.fecha_salida);
                const estimado = t.duracion_minutos || 60;
                const transcurrido = Math.floor((Date.now() - salida.getTime()) / 60000);
                return (
                  <Paper key={t.id} sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 1, background: '#fff3e0' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f44336' }}>
                      {t.placa_vehiculo || 'Vehículo'} - {t.nombre_ruta || 'Ruta'}
                    </Typography>
                    <Typography variant="body2"><b>Conductor:</b> {t.nombre_conductor || '-'}</Typography>
                    <Typography variant="body2"><b>Hora de salida:</b> {format(salida, 'yyyy-MM-dd HH:mm')}</Typography>
                    <Typography variant="body2"><b>Tiempo estimado:</b> {estimado} min</Typography>
                    <Typography variant="body2" color="#f44336"><b>Tiempo transcurrido:</b> {transcurrido} min</Typography>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 