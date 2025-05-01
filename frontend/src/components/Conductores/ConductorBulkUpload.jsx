import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  Link
} from '@mui/material';
import { CloudUpload, Download } from '@mui/icons-material';

const ConductorBulkUpload = ({ open, onClose, onUpload }) => {
  const [error, setError] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (fileExtension === 'csv') {
          processCsvFile(e.target.result);
        } else if (fileExtension === 'json') {
          processJsonFile(e.target.result);
        } else {
          setError('Formato de archivo no soportado. Use CSV o JSON');
        }
      } catch (error) {
        setError('Error al procesar el archivo. Verifique el formato');
      }
    };

    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  };

  const processCsvFile = (content) => {
    const lines = content.split('\n');
    if (lines.length < 2) {
      setError('El archivo CSV está vacío o no tiene el formato correcto');
      return;
    }

    // Remover espacios en blanco y comillas de los headers
    const headers = lines[0].split(',').map(header => 
      header.trim().replace(/["']/g, '')
    );

    const expectedHeaders = ['nombre', 'licencia', 'telefono'];
    if (!expectedHeaders.every(header => headers.includes(header))) {
      setError('El CSV debe tener las columnas: nombre, licencia, telefono');
      return;
    }

    const conductores = lines
      .slice(1) // Saltar la línea de headers
      .filter(line => line.trim()) // Filtrar líneas vacías
      .map(line => {
        const values = line.split(',').map(value => value.trim().replace(/["']/g, ''));
        return {
          nombre: values[headers.indexOf('nombre')],
          licencia: values[headers.indexOf('licencia')],
          telefono: values[headers.indexOf('telefono')]
        };
      });

    if (!validateConductores(conductores)) {
      return;
    }

    onUpload(conductores);
    setError(null);
  };

  const processJsonFile = (content) => {
    const conductores = JSON.parse(content);
    if (!Array.isArray(conductores)) {
      setError('El archivo debe contener un array de conductores');
      return;
    }

    if (!validateConductores(conductores)) {
      return;
    }

    onUpload(conductores);
    setError(null);
  };

  const validateConductores = (conductores) => {
    const isValid = conductores.every(conductor => 
      conductor.nombre && 
      conductor.licencia && 
      conductor.telefono
    );

    if (!isValid) {
      setError('Todos los conductores deben tener nombre, licencia y teléfono');
      return false;
    }

    return true;
  };

  const downloadTemplate = (format) => {
    let content;
    let filename;
    let type;

    if (format === 'csv') {
      content = 'nombre,licencia,telefono\nJuan Pérez,A12345,1234567890\nMaría García,B67890,0987654321';
      filename = 'plantilla_conductores.csv';
      type = 'text/csv';
    } else {
      content = JSON.stringify([
        {
          "nombre": "Juan Pérez",
          "licencia": "A12345",
          "telefono": "1234567890"
        },
        {
          "nombre": "María García",
          "licencia": "B67890",
          "telefono": "0987654321"
        }
      ], null, 2);
      filename = 'plantilla_conductores.json';
      type = 'application/json';
    }

    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cargar Conductores Masivamente</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Descargar Plantillas
          </Typography>
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => downloadTemplate('csv')}
            >
              Plantilla CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => downloadTemplate('json')}
            >
              Plantilla JSON
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Cargar Archivo
          </Typography>
          <Box sx={{ textAlign: 'center' }}>
            <input
              accept=".csv,.json"
              style={{ display: 'none' }}
              id="bulk-upload-file"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="bulk-upload-file">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                sx={{ mb: 2 }}
              >
                Seleccionar Archivo
              </Button>
            </label>
            <Typography variant="body2" color="text.secondary">
              Formatos aceptados: CSV y JSON
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConductorBulkUpload; 