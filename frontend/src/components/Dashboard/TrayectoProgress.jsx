import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import { DirectionsBus } from '@mui/icons-material';

const getStartTimeColombia = (fecha) => {
  if (!fecha) return 0;
  // Convertir a hora Colombia usando toLocaleString y luego parsear
  const localString = new Date(fecha).toLocaleString('en-US', { timeZone: 'America/Bogota' });
  return new Date(localString).getTime();
};

const formatTimeColombia = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' });
};

const TrayectoProgress = ({ trayecto }) => {
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (trayecto.estado && trayecto.estado.toLowerCase() === 'en_curso') {
      const startTime = getStartTimeColombia(trayecto.fecha_salida);
      const now = new Date().getTime();
      const elapsedMinutes = Math.max(0, (now - startTime) / (1000 * 60));
      // Calcular progreso inicial
      const initialProgress = Math.min((elapsedMinutes / 60) * 100, 100);
      setProgress(initialProgress);
      setPosition(initialProgress);

      // Actualizar la posición cada segundo
      const interval = setInterval(() => {
        const currentTime = new Date().getTime();
        const currentElapsed = Math.max(0, (currentTime - startTime) / (1000 * 60));
        const newProgress = Math.min((currentElapsed / 60) * 100, 100);
        setProgress(newProgress);
        setPosition(newProgress);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [trayecto]);

  return (
    <Paper 
      sx={{ 
        p: 2, 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom color="primary">
            Trayecto en Curso
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {trayecto.nombre_ruta}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Conductor: {trayecto.nombre_conductor}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Vehículo: {trayecto.placa_vehiculo}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" color="primary">
            {Math.round(progress)}%
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Completado
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 3, mb: 1, position: 'relative' }}>
        <LinearProgress
          variant="determinate"
          value={100}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#4caf50'
            }
          }}
        />
        <DirectionsBus
          sx={{
            position: 'absolute',
            top: -18,
            left: `${position}%`,
            transform: 'translateX(-50%)',
            color: '#1976d2',
            fontSize: 36,
            transition: 'left 1s linear'
          }}
        />
        <Box
          sx={{
            display: 'flex', 
            justifyContent: 'space-between',
            mt: 1
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Origen
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Destino
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mt: 2,
        pt: 2,
        borderTop: '1px solid #e0e0e0'
      }}>
        <Typography variant="body2">
          Salida: {formatTimeColombia(trayecto.fecha_salida)}
        </Typography>
        <Typography variant="body2">
          Tiempo transcurrido: {Math.floor(progress * 0.6)} min
        </Typography>
      </Box>
    </Paper>
  );
};

export default TrayectoProgress; 