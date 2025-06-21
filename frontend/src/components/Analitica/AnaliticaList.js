import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { api } from '../../services/api';
import { format, parseISO, isWithinInterval } from 'date-fns';

function AnaliticaList() {
  // Filtros de fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Datos
  const [novedades, setNovedades] = useState([]);
  const [trayectos, setTrayectos] = useState([]);

  // Procesados para gráficos
  const [novedadesPorTipo, setNovedadesPorTipo] = useState([]);
  const [pasajerosPorDia, setPasajerosPorDia] = useState([]);

  useEffect(() => {
    // Cargar datos de backend
    const fetchData = async () => {
      try {
        const [novedadesRes, trayectosRes] = await Promise.all([
          api.getNovedades(),
          api.getTrayectos()
        ]);
        setNovedades(novedadesRes.data || []);
        setTrayectos(trayectosRes.data || []);
      } catch (err) {
        console.error('Error cargando datos de analítica:', err);
      }
    };
    fetchData();
  }, []);

  // Procesar datos para gráficos cuando cambian los datos o los filtros
  useEffect(() => {
    // Filtro de fechas
    const filtrarPorFecha = (arr, campoFecha) => {
      if (!fechaInicio && !fechaFin) return arr;
      return arr.filter(item => {
        const fecha = item[campoFecha] ? parseISO(item[campoFecha]) : null;
        if (!fecha) return false;
        if (fechaInicio && fecha < parseISO(fechaInicio)) return false;
        if (fechaFin && fecha > parseISO(fechaFin)) return false;
        return true;
      });
    };

    // Novedades por tipo
    const novedadesFiltradas = filtrarPorFecha(novedades, 'fecha_reporte');
    const tipos = {};
    novedadesFiltradas.forEach(nov => {
      tipos[nov.tipo] = (tipos[nov.tipo] || 0) + 1;
    });
    setNovedadesPorTipo(Object.entries(tipos).map(([tipo, cantidad]) => ({ tipo, cantidad })));

    // Pasajeros por día
    const trayectosFiltrados = filtrarPorFecha(trayectos, 'fecha_salida');
    const pasajerosPorFecha = {};
    trayectosFiltrados.forEach(t => {
      if (!t.fecha_salida) return;
      const fecha = format(parseISO(t.fecha_salida), 'yyyy-MM-dd');
      pasajerosPorFecha[fecha] = (pasajerosPorFecha[fecha] || 0) + (t.cantidad_pasajeros || 0);
    });
    // Ordenar por fecha
    const pasajerosArray = Object.entries(pasajerosPorFecha)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    setPasajerosPorDia(pasajerosArray);
  }, [novedades, trayectos, fechaInicio, fechaFin]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analítica
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <TextField
              label="Fecha inicio"
              type="date"
              size="small"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item>
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>
      <Grid container spacing={3}>
        {/* Gráfico 1: Novedades por tipo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>Novedades por tipo</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={novedadesPorTipo} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#ff9800" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        {/* Gráfico 2: Pasajeros por día */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 350 }}>
            <Typography variant="h6" gutterBottom>Pasajeros por día</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={pasajerosPorDia} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cantidad" stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
      {/* Puedes agregar más gráficos aquí fácilmente */}
    </Box>
  );
}

export default AnaliticaList; 