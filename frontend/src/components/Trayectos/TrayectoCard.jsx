import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Stack
} from '@mui/material';
import { DirectionsBus, Person, Route } from '@mui/icons-material';

const getEstadoColor = (estado) => {
  switch (estado.toLowerCase()) {
    case 'programado':
      return 'info';
    case 'en_curso':
      return 'warning';
    case 'completado':
      return 'success';
    case 'cancelado':
      return 'error';
    default:
      return 'default';
  }
};

const TrayectoCard = ({ trayecto, onIniciar, onFinalizar }) => {
  const formatTime = (date) => {
    if (!date) return 'No definido';
    return new Date(date).toLocaleTimeString();
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={trayecto.estado}
            color={getEstadoColor(trayecto.estado)}
            sx={{ mb: 1 }}
          />
        </Box>

        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Route color="primary" />
            <Typography variant="body1">{trayecto.nombre_ruta}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            <Typography variant="body2">{trayecto.nombre_conductor}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsBus color="primary" />
            <Typography variant="body2">{trayecto.placa_vehiculo}</Typography>
          </Box>

          {trayecto.fecha_salida && (
            <Typography variant="body2" color="text.secondary">
              Salida: {formatTime(trayecto.fecha_salida)}
            </Typography>
          )}

          {trayecto.fecha_llegada && (
            <Typography variant="body2" color="text.secondary">
              Llegada: {formatTime(trayecto.fecha_llegada)}
            </Typography>
          )}

          {trayecto.duracion_actual && trayecto.estado === 'EN_CURSO' && (
            <Typography variant="body2" color="text.secondary">
              Duración actual: {trayecto.duracion_actual} minutos
            </Typography>
          )}
        </Stack>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {trayecto.estado.toLowerCase() === 'programado' && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => onIniciar(trayecto.id)}
            >
              Iniciar
            </Button>
          )}
          {trayecto.estado.toLowerCase() === 'en_curso' && (
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() => onFinalizar(trayecto)}
            >
              Finalizar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrayectoCard; 