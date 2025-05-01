import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

const UnauthorizedAccess = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
    >
      <Paper 
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 400
        }}
      >
        <BlockIcon 
          sx={{ 
            fontSize: 60, 
            color: 'error.main',
            mb: 2
          }} 
        />
        <Typography variant="h5" gutterBottom>
          Acceso No Autorizado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No tienes permisos para acceder a este módulo. Por favor, contacta al administrador si crees que esto es un error.
        </Typography>
      </Paper>
    </Box>
  );
};

export default UnauthorizedAccess; 