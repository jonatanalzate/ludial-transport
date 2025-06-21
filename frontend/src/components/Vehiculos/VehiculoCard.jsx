import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import { Edit, DirectionsBus, People, Warning, Block } from '@mui/icons-material';
import { differenceInDays, parseISO } from 'date-fns';

const getVencimientoColor = (fecha) => {
  if (!fecha) return 'default';
  const hoy = new Date();
  const fechaV = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  const diff = differenceInDays(fechaV, hoy);
  if (diff < 0) return 'error'; // Vencido
  if (diff <= 15) return 'warning'; // Próximo a vencer (15 días)
  return 'success';
};

const VehiculoCard = ({ vehiculo }) => {
  return (
    <Card sx={{ border: vehiculo.activo ? undefined : '2px solid #f44336', opacity: vehiculo.activo ? 1 : 0.7 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{vehiculo.placa}</Typography>
          <IconButton size="small">
            <Edit />
          </IconButton>
        </Box>
        
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DirectionsBus fontSize="small" />
          {vehiculo.modelo}
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <People fontSize="small" />
          <Typography variant="body2">
            Capacidad: {vehiculo.capacidad} pasajeros
          </Typography>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={`SOAT: ${vehiculo.soat_vencimiento || '-'}`}
            color={getVencimientoColor(vehiculo.soat_vencimiento)}
            icon={<Warning />}
            size="small"
          />
          <Chip label={`Tecnomecánica: ${vehiculo.tecnomecanica_vencimiento || '-'}`}
            color={getVencimientoColor(vehiculo.tecnomecanica_vencimiento)}
            icon={<Warning />}
            size="small"
          />
          <Chip label={`Kit: ${vehiculo.kit_vencimiento || '-'}`}
            color={getVencimientoColor(vehiculo.kit_vencimiento)}
            icon={<Warning />}
            size="small"
          />
          {vehiculo.pico_placa && (
            <Chip label={`Pico y Placa: ${vehiculo.pico_placa}`}
              color="info"
              size="small"
            />
          )}
          <Chip
            label={vehiculo.activo ? 'Activo' : 'Inactivo'}
            color={vehiculo.activo ? 'success' : 'error'}
            icon={!vehiculo.activo ? <Block /> : undefined}
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default VehiculoCard; 