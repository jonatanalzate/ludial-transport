import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import { DirectionsBus } from '@mui/icons-material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const TrayectoProgress = ({ trayecto }) => {
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let interval;
    if (trayecto.estado === 'EN_CURSO' && trayecto.fecha_salida) {
      const startTime = new Date(trayecto.fecha_salida).getTime();
      // Duración estimada: 1 hora (puedes ajustar esto si tienes un campo de duración estimada)
      const duration = 60 * 60 * 1000;
      const updateProgress = () => {
        const now = new Date().getTime();
        const elapsed = now - startTime;
        let percent = Math.max(0, Math.min(100, (elapsed / duration) * 100));
        setProgress(percent);
        setPosition(percent);
      };
      updateProgress(); // Inicial
      interval = setInterval(updateProgress, 1000); // Actualiza cada segundo
    }
    return () => clearInterval(interval);
  }, [trayecto]);

  const formatTimeColombia = (date) => {
    if (!date) return '-';
    // Forzar a UTC si la fecha viene como string ISO
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' });
  };

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

      <Box sx={{ position: 'relative', width: '100%', height: 16, my: 2 }}>
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 7, height: 4, bgcolor: '#4caf50', borderRadius: 2 }} />
        {/* Bus icon animado */}
        <DirectionsBusIcon
          sx={{
            position: 'absolute',
            top: -8,
            left: `calc(${progress}% - 12px)`,
            color: '#1976d2',
            fontSize: 24,
            transition: 'left 1s linear',
            zIndex: 2
          }}
        />
        <Typography variant="caption" sx={{ position: 'absolute', left: 0, top: 18 }}>Origen</Typography>
        <Typography variant="caption" sx={{ position: 'absolute', right: 0, top: 18 }}>Destino</Typography>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        mt: 2,
        pt: 2,
        borderTop: '1px solid #e0e0e0'
      }}>
        {trayecto.fecha_salida && (
          <Typography variant="body2" color="text.secondary">
            Salida: {formatTimeColombia(trayecto.fecha_salida)}
          </Typography>
        )}
        {trayecto.fecha_llegada && (
          <Typography variant="body2" color="text.secondary">
            Llegada: {formatTimeColombia(trayecto.fecha_llegada)}
          </Typography>
        )}
        <Typography variant="body2">
          Tiempo transcurrido: {Math.floor(progress * 0.6)} min
        </Typography>
      </Box>
    </Paper>
  );
};

export default TrayectoProgress; 