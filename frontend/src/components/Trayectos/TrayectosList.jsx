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
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../../services/api';
import TrayectoCard from './TrayectoCard';
import TrayectoForm from './TrayectoForm';

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
        <Grid container spacing={3}>
          {trayectosFiltrados.map((trayecto) => (
            <Grid item xs={12} sm={6} md={4} key={trayecto.id}>
              <TrayectoCard
                trayecto={trayecto}
                onIniciar={handleIniciarTrayecto}
                onFinalizar={handleFinalizarClick}
              />
            </Grid>
          ))}
        </Grid>
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