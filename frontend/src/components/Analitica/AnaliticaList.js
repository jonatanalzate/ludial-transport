import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

function AnaliticaList() {
  const powerBIUrl = "https://app.powerbi.com/reportEmbed?reportId=cbcef983-ed05-4b33-9135-5655602234c6&autoAuth=true&ctid=4f1e044d-3d70-4990-b26a-b95f0c642e1a";

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analítica
      </Typography>
      <Paper 
        sx={{ 
          width: '100%',
          height: 'calc(100vh - 200px)',
          overflow: 'hidden',
          bgcolor: '#f5f5f5'
        }}
      >
        <iframe
          title="Base de Datos"
          width="100%"
          height="100%"
          src={powerBIUrl}
          frameBorder="0"
          allowFullScreen
          style={{
            border: 'none',
            display: 'block'
          }}
        />
      </Paper>
    </Box>
  );
}

export default AnaliticaList; 