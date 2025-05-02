import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  DirectionsBus,
  Person,
  Route
} from '@mui/icons-material';
import TrayectoProgress from './TrayectoProgress';
import { api } from '../../services/api';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehiculosRes, conductoresRes, rutasRes, trayectosRes] = await Promise.all([
          api.getVehiculos(),
          api.getConductores(),
          api.getRutas(),
          api.getTrayectos()
        ]);

        const activos = trayectosRes.data.filter(t => t.estado === 'EN_CURSO');
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
              'Total': conductoresRes.data.length,
              'En servicio': conductoresRes.data.filter(c => 
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

      {trayectosActivos.map((trayecto) => (
        <Box key={trayecto.id} sx={{ mb: 3 }}>
          <TrayectoProgress trayecto={trayecto} />
        </Box>
      ))}

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            icon={<DirectionsBus sx={{ color: 'white', fontSize: 40 }} />}
            title="VEHÍCULOS"
            stats={stats.vehiculos.data}
            loading={stats.vehiculos.loading}
            color="#4caf50"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            icon={<Person sx={{ color: 'white', fontSize: 40 }} />}
            title="CONDUCTORES"
            stats={stats.conductores.data}
            loading={stats.conductores.loading}
            color="#2196f3"
          />
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <StatCard
            icon={<Route sx={{ color: 'white', fontSize: 40 }} />}
            title="RUTAS"
            stats={stats.rutas.data}
            loading={stats.rutas.loading}
            color="#ff9800"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 