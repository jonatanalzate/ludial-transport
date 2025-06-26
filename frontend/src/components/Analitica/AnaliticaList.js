import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { api } from '../../services/api';
import { format, parseISO } from 'date-fns';

const METRICAS = [
  { value: 'novedades', label: 'Novedades' },
  { value: 'pasajeros', label: 'Pasajeros' },
  { value: 'trayectos', label: 'Trayectos' },
  { value: 'ocupacion', label: 'Ocupación' },
];
const AGRUPACIONES = [
  { value: 'tipo', label: 'Por tipo de novedad', metric: 'novedades' },
  { value: 'fecha', label: 'Por día', metric: 'pasajeros' },
  { value: 'ruta', label: 'Por ruta', metric: 'trayectos' },
  { value: 'conductor', label: 'Por conductor', metric: 'trayectos' },
  { value: 'vehiculo', label: 'Por vehículo', metric: 'trayectos' },
];
const TIPOS_GRAFICO = [
  { value: 'bar', label: 'Barras' },
  { value: 'line', label: 'Líneas' },
  { value: 'pie', label: 'Pastel' },
];
const COLORS = ['#1976d2', '#ff9800', '#43a047', '#d32f2f', '#7b1fa2', '#fbc02d'];

function AnaliticaList() {
  // Filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    ruta: '',
    conductor: '',
    vehiculo: '',
    trayecto: ''
  });
  const [metrica, setMetrica] = useState('novedades');
  const [agrupacion, setAgrupacion] = useState('tipo');
  const [tipoGrafico, setTipoGrafico] = useState('bar');
  const [aplicar, setAplicar] = useState(false);

  // Opciones de filtros
  const [rutas, setRutas] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [trayectos, setTrayectos] = useState([]);

  // Datos
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar opciones de filtros
  useEffect(() => {
    api.getRutasActivas().then(res => setRutas(res.data || []));
    api.getConductoresActivos().then(res => setConductores(res.data || []));
    api.getVehiculosActivos().then(res => setVehiculos(res.data || []));
    api.getTrayectos().then(res => setTrayectos(res.data || []));
  }, []);

  // Cargar datos solo al hacer clic en 'Aplicar'
  useEffect(() => {
    if (!aplicar) return;
    setLoading(true);
    const params = {};
    if (filtros.fechaInicio) params.fecha_inicio = filtros.fechaInicio;
    if (filtros.fechaFin) params.fecha_fin = filtros.fechaFin;
    if (filtros.ruta) params.ruta_id = filtros.ruta;
    if (filtros.conductor) params.conductor_id = filtros.conductor;
    if (filtros.vehiculo) params.vehiculo_id = filtros.vehiculo;
    if (filtros.trayecto) params.trayecto_id = filtros.trayecto;

    // Lógica dinámica según métrica y agrupación
    if (metrica === 'novedades') {
      api.getNovedades(params).then(res => {
        let arr = res.data || [];
        if (agrupacion === 'tipo') {
          const tipos = {};
          arr.forEach(nov => { tipos[nov.tipo] = (tipos[nov.tipo] || 0) + 1; });
          arr = Object.entries(tipos).map(([tipo, cantidad]) => ({ label: tipo, value: cantidad }));
        }
        setData(arr);
        setLoading(false);
      });
    } else if (metrica === 'pasajeros') {
      api.getTrayectos(params).then(res => {
        let arr = res.data || [];
        if (agrupacion === 'fecha') {
          const pasajerosPorFecha = {};
          arr.forEach(t => {
            if (!t.fecha_salida) return;
            const fecha = format(parseISO(t.fecha_salida), 'yyyy-MM-dd');
            pasajerosPorFecha[fecha] = (pasajerosPorFecha[fecha] || 0) + (t.cantidad_pasajeros || 0);
          });
          arr = Object.entries(pasajerosPorFecha).map(([fecha, cantidad]) => ({ label: fecha, value: cantidad }));
        }
        setData(arr);
        setLoading(false);
      });
    } else if (metrica === 'trayectos') {
      api.getTrayectos(params).then(res => {
        let arr = res.data || [];
        if (agrupacion === 'ruta') {
          const porRuta = {};
          arr.forEach(t => { porRuta[t.nombre_ruta] = (porRuta[t.nombre_ruta] || 0) + 1; });
          arr = Object.entries(porRuta).map(([label, value]) => ({ label, value }));
        } else if (agrupacion === 'conductor') {
          const porConductor = {};
          arr.forEach(t => { porConductor[t.nombre_conductor] = (porConductor[t.nombre_conductor] || 0) + 1; });
          arr = Object.entries(porConductor).map(([label, value]) => ({ label, value }));
        } else if (agrupacion === 'vehiculo') {
          const porVehiculo = {};
          arr.forEach(t => { porVehiculo[t.placa_vehiculo] = (porVehiculo[t.placa_vehiculo] || 0) + 1; });
          arr = Object.entries(porVehiculo).map(([label, value]) => ({ label, value }));
        }
        setData(arr);
        setLoading(false);
      });
    } else if (metrica === 'ocupacion') {
      api.getTrayectos(params).then(res => {
        let arr = res.data || [];
        // Ejemplo: ocupación promedio por ruta
        const ocupacionPorRuta = {};
        arr.forEach(t => {
          if (!t.nombre_ruta) return;
          if (!ocupacionPorRuta[t.nombre_ruta]) ocupacionPorRuta[t.nombre_ruta] = { suma: 0, count: 0 };
          ocupacionPorRuta[t.nombre_ruta].suma += t.cantidad_pasajeros || 0;
          ocupacionPorRuta[t.nombre_ruta].count += 1;
        });
        arr = Object.entries(ocupacionPorRuta).map(([label, { suma, count }]) => ({ label, value: count ? (suma / count) : 0 }));
        setData(arr);
        setLoading(false);
      });
    }
    setAplicar(false);
  }, [aplicar, filtros, metrica, agrupacion]);

  // Opciones de agrupación según métrica
  const agrupacionesDisponibles = AGRUPACIONES.filter(a => a.metric === metrica || (metrica === 'pasajeros' && a.value === 'fecha'));

  // Renderizado de gráfico dinámico
  const renderChart = () => {
    if (loading) return <Typography>Cargando datos...</Typography>;
    if (!data.length) return <Typography>No hay datos para mostrar.</Typography>;
    if (tipoGrafico === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (tipoGrafico === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    if (tipoGrafico === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={120} label>
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analítica Dinámica
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <TextField
              select
              label="Métrica"
              value={metrica}
              onChange={e => {
                setMetrica(e.target.value);
                setAgrupacion(AGRUPACIONES.find(a => a.metric === e.target.value)?.value || '');
              }}
              size="small"
            >
              {METRICAS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Agrupar por"
              value={agrupacion}
              onChange={e => setAgrupacion(e.target.value)}
              size="small"
            >
              {agrupacionesDisponibles.map(a => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Tipo de gráfico"
              value={tipoGrafico}
              onChange={e => setTipoGrafico(e.target.value)}
              size="small"
            >
              {TIPOS_GRAFICO.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
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
              size="small"
            >
              <MenuItem value="">Todas</MenuItem>
              {rutas.map(r => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Conductor"
              value={filtros.conductor}
              onChange={e => setFiltros(f => ({ ...f, conductor: e.target.value }))}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {conductores.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre_completo}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Vehículo"
              value={filtros.vehiculo}
              onChange={e => setFiltros(f => ({ ...f, vehiculo: e.target.value }))}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {vehiculos.map(v => <MenuItem key={v.id} value={v.id}>{v.placa}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Trayecto"
              value={filtros.trayecto}
              onChange={e => setFiltros(f => ({ ...f, trayecto: e.target.value }))}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              {trayectos.map(t => <MenuItem key={t.id} value={t.id}>{t.id}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" onClick={() => setAplicar(true)}>
              Aplicar
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 2, minHeight: 400 }}>
        {renderChart()}
      </Paper>
    </Box>
  );
}

export default AnaliticaList; 