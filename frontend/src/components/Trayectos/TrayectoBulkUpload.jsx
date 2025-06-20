import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, Divider
} from '@mui/material';
import { CloudUpload, Download } from '@mui/icons-material';
import Papa from 'papaparse';
import { api } from '../../services/api';

const TrayectoBulkUpload = ({ open, onClose, onUploadSuccess }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const trayectos = results.data.map(row => ({
          conductor_id: parseInt(row.conductor_id),
          vehiculo_id: parseInt(row.vehiculo_id),
          ruta_id: parseInt(row.ruta_id)
        }));
        if (!validateTrayectos(trayectos)) return;
        uploadTrayectos(trayectos);
      },
      error: () => setError('Error al parsear el archivo CSV')
    });
  };

  const processJsonFile = (content) => {
    try {
      const trayectos = JSON.parse(content);
      if (!Array.isArray(trayectos)) {
        setError('El archivo debe contener un array de trayectos');
        return;
      }
      if (!validateTrayectos(trayectos)) return;
      uploadTrayectos(trayectos);
    } catch {
      setError('Error al parsear el archivo JSON');
    }
  };

  const validateTrayectos = (trayectos) => {
    const isValid = trayectos.every(t =>
      t.conductor_id && t.vehiculo_id && t.ruta_id
    );
    if (!isValid) {
      setError('Todos los trayectos deben tener conductor_id, vehiculo_id y ruta_id (números válidos)');
      return false;
    }
    return true;
  };

  const uploadTrayectos = async (trayectos) => {
    setLoading(true);
    setError(null);
    try {
      await api.createTrayectosBulk(trayectos);
      if (onUploadSuccess) onUploadSuccess();
      onClose();
    } catch (e) {
      setError('Error al cargar los trayectos: ' + (e.response?.data?.detail || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (format) => {
    let content, filename, type;
    if (format === 'csv') {
      content = 'conductor_id,vehiculo_id,ruta_id\n1,2,3\n2,3,1';
      filename = 'plantilla_trayectos.csv';
      type = 'text/csv';
    } else {
      content = JSON.stringify([
        { conductor_id: 1, vehiculo_id: 2, ruta_id: 3 },
        { conductor_id: 2, vehiculo_id: 3, ruta_id: 1 }
      ], null, 2);
      filename = 'plantilla_trayectos.json';
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
      <DialogTitle>Cargar Trayectos Masivamente</DialogTitle>
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
              id="bulk-upload-trayecto-file"
              type="file"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <label htmlFor="bulk-upload-trayecto-file">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                sx={{ mb: 2 }}
                disabled={loading}
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

export default TrayectoBulkUpload; 