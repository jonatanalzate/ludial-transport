import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import { Edit, DirectionsBus, People } from '@mui/icons-material';

const VehiculoCard = ({ vehiculo }) => {
  return (
    <Card>
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
      </CardContent>
    </Card>
  );
};

export default VehiculoCard; 