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
  Divider
} from '@mui/material';
import { CloudUpload, Download } from '@mui/icons-material';

const VehiculoBulkUpload = ({ open, onClose, onUpload }) => {
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

    reader.readAsText(file);
  };

  const processCsvFile = (content) => {
    const lines = content.split('\n');
    if (lines.length < 2) {
      setError('El archivo CSV está vacío o no tiene el formato correcto');
      return;
    }

    const headers = lines[0].split(',').map(header => 
      header.trim().replace(/["']/g, '')
    );

    const expectedHeaders = ['placa', 'modelo', 'capacidad'];
    if (!expectedHeaders.every(header => headers.includes(header))) {
      setError('El CSV debe tener las columnas: placa, modelo, capacidad');
      return;
    }

    const vehiculos = lines
      .slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(value => value.trim().replace(/["']/g, ''));
        return {
          placa: values[headers.indexOf('placa')],
          modelo: values[headers.indexOf('modelo')],
          capacidad: parseInt(values[headers.indexOf('capacidad')])
        };
      });

    if (!validateVehiculos(vehiculos)) {
      return;
    }

    onUpload(vehiculos);
    setError(null);
  };

  const processJsonFile = (content) => {
    const vehiculos = JSON.parse(content);
    if (!Array.isArray(vehiculos)) {
      setError('El archivo debe contener un array de vehículos');
      return;
    }

    if (!validateVehiculos(vehiculos)) {
      return;
    }

    onUpload(vehiculos);
    setError(null);
  };

  const validateVehiculos = (vehiculos) => {
    const isValid = vehiculos.every(vehiculo => 
      vehiculo.placa && 
      vehiculo.modelo && 
      typeof vehiculo.capacidad === 'number' && 
      vehiculo.capacidad > 0
    );

    if (!isValid) {
      setError('Todos los vehículos deben tener placa, modelo y capacidad (número positivo)');
      return false;
    }

    return true;
  };

  const downloadTemplate = (format) => {
    let content;
    let filename;
    let type;

    if (format === 'csv') {
      content = 'placa,modelo,capacidad\nABC123,Toyota Hiace,15\nXYZ789,Mercedes Sprinter,20';
      filename = 'plantilla_vehiculos.csv';
      type = 'text/csv';
    } else {
      content = JSON.stringify([
        {
          "placa": "ABC123",
          "modelo": "Toyota Hiace",
          "capacidad": 15
        },
        {
          "placa": "XYZ789",
          "modelo": "Mercedes Sprinter",
          "capacidad": 20
        }
      ], null, 2);
      filename = 'plantilla_vehiculos.json';
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
      <DialogTitle>Cargar Vehículos Masivamente</DialogTitle>
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

export default VehiculoBulkUpload; 