import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Edit, Phone } from '@mui/icons-material';

const ConductorCard = ({ conductor }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">{conductor.nombre}</Typography>
          <IconButton size="small">
            <Edit />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone fontSize="small" />
          {conductor.telefono}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Licencia: {conductor.licencia}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ConductorCard; 