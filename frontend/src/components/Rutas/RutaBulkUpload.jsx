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

const RutaBulkUpload = ({ open, onClose, onUpload }) => {
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

    const expectedHeaders = ['nombre', 'origen', 'destino', 'distancia', 'tiempo_estimado', 'activa'];
    if (!expectedHeaders.every(header => headers.includes(header))) {
      setError('El CSV debe tener las columnas: nombre, origen, destino, distancia, tiempo_estimado, activa');
      return;
    }

    const rutas = lines
      .slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(value => value.trim().replace(/["']/g, ''));
        return {
          nombre: values[headers.indexOf('nombre')],
          origen: values[headers.indexOf('origen')],
          destino: values[headers.indexOf('destino')],
          distancia: parseFloat(values[headers.indexOf('distancia')]) || null,
          tiempo_estimado: parseInt(values[headers.indexOf('tiempo_estimado')]) || null,
          activa: values[headers.indexOf('activa')] === 'false' ? false : true
        };
      });

    if (!validateRutas(rutas)) {
      return;
    }

    onUpload(rutas);
    setError(null);
  };

  const processJsonFile = (content) => {
    const rutas = JSON.parse(content);
    if (!Array.isArray(rutas)) {
      setError('El archivo debe contener un array de rutas');
      return;
    }

    if (!validateRutas(rutas)) {
      return;
    }

    onUpload(rutas);
    setError(null);
  };

  const validateRutas = (rutas) => {
    const isValid = rutas.every(ruta => 
      ruta.nombre && 
      ruta.origen && 
      ruta.destino &&
      (typeof ruta.distancia === 'number' || ruta.distancia === null) &&
      (typeof ruta.tiempo_estimado === 'number' || ruta.tiempo_estimado === null)
    );

    if (!isValid) {
      setError('Todas las rutas deben tener nombre, origen, destino, distancia (número), tiempo_estimado (número)');
      return false;
    }

    return true;
  };

  const downloadTemplate = (format) => {
    let content;
    let filename;
    let type;

    if (format === 'csv') {
      content = 'nombre,origen,destino,distancia,tiempo_estimado,activa\nRuta Norte,Ciudad A,Ciudad B,10.5,30,true\nRuta Sur,Ciudad C,Ciudad D,15.2,45,false';
      filename = 'plantilla_rutas.csv';
      type = 'text/csv';
    } else {
      content = JSON.stringify([
        {
          "nombre": "Ruta Norte",
          "origen": "Ciudad A",
          "destino": "Ciudad B",
          "distancia": 10.5,
          "tiempo_estimado": 30,
          "activa": true
        },
        {
          "nombre": "Ruta Sur",
          "origen": "Ciudad C",
          "destino": "Ciudad D",
          "distancia": 15.2,
          "tiempo_estimado": 45,
          "activa": false
        }
      ], null, 2);
      filename = 'plantilla_rutas.json';
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
      <DialogTitle>Cargar Rutas Masivamente</DialogTitle>
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

export default RutaBulkUpload; 