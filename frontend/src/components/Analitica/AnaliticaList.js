import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { api } from '../../services/api';
import { format, parseISO } from 'date-fns';

function AnaliticaList() {
  // Filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipoDato: 'novedades',
    ruta: '',
    conductor: '',
    vehiculo: '',
    trayecto: ''
  });

  // Opciones de filtros
  const [rutas, setRutas] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [trayectos, setTrayectos] = useState([]);

  // Datos
  const [novedades, setNovedades] = useState([]);
  const [trayectosData, setTrayectosData] = useState([]);
  const [novedadesPorTipo, setNovedadesPorTipo] = useState([]);
  const [pasajerosPorDia, setPasajerosPorDia] = useState([]);

  // Cargar opciones de filtros
  useEffect(() => {
    api.getRutasActivas().then(res => setRutas(res.data || []));
    api.getConductoresActivos().then(res => setConductores(res.data || []));
    api.getVehiculosActivos().then(res => setVehiculos(res.data || []));
    api.getTrayectos().then(res => setTrayectos(res.data || []));
  }, []);

  // Cargar datos según filtros
  useEffect(() => {
    const params = {};
    if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio;
    if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin;
    if (filtros.ruta) params.ruta_id = filtros.ruta;
    if (filtros.conductor) params.conductor_id = filtros.conductor;
    if (filtros.vehiculo) params.vehiculo_id = filtros.vehiculo;
    if (filtros.trayecto) params.trayecto_id = filtros.trayecto;

    api.getNovedades(params).then(res => setNovedades(res.data || []));
    api.getTrayectos(params).then(res => setTrayectosData(res.data || []));
  }, [filtros]);

  // Procesar datos para gráficos
  useEffect(() => {
    // Novedades por tipo
    const tipos = {};
    novedades.forEach(nov => {
      tipos[nov.tipo] = (tipos[nov.tipo] || 0) + 1;
    });
    setNovedadesPorTipo(Object.entries(tipos).map(([tipo, cantidad]) => ({ tipo, cantidad })));

    // Pasajeros por día
    const pasajerosPorFecha = {};
    trayectosData.forEach(t => {
      if (!t.fecha_salida) return;
      const fecha = format(parseISO(t.fecha_salida), 'yyyy-MM-dd');
      pasajerosPorFecha[fecha] = (pasajerosPorFecha[fecha] || 0) + (t.cantidad_pasajeros || 0);
    });
    const pasajerosArray = Object.entries(pasajerosPorFecha)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    setPasajerosPorDia(pasajerosArray);
  }, [novedades, trayectosData]);

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
              value={filtros.fechaInicio}
              onChange={e => setFiltros(f => ({ ...f, fechaInicio: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item>
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              value={filtros.fechaFin}
              onChange={e => setFiltros(f => ({ ...f, fechaFin: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item>
            <TextField
              select
              label="Ruta"
              value={filtros.ruta}
              onChange={e => setFiltros(f => ({ ...f, ruta: e.target.value }))}
              SelectProps={{ native: true }}
              size="small"
            >
              <option value="">Todas</option>
              {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Conductor"
              value={filtros.conductor}
              onChange={e => setFiltros(f => ({ ...f, conductor: e.target.value }))}
              SelectProps={{ native: true }}
              size="small"
            >
              <option value="">Todos</option>
              {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Vehículo"
              value={filtros.vehiculo}
              onChange={e => setFiltros(f => ({ ...f, vehiculo: e.target.value }))}
              SelectProps={{ native: true }}
              size="small"
            >
              <option value="">Todos</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Trayecto"
              value={filtros.trayecto}
              onChange={e => setFiltros(f => ({ ...f, trayecto: e.target.value }))}
              SelectProps={{ native: true }}
              size="small"
            >
              <option value="">Todos</option>
              {trayectos.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
            </TextField>
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
    </Box>
  );
}

export default AnaliticaList; 