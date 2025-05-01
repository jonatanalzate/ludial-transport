import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const Configuracion = () => {
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Configuración del Sistema
          </Typography>
          <Typography variant="body1" paragraph>
            Esta sección está en desarrollo. Aquí podrás gestionar la configuración general del sistema.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Configuracion; 