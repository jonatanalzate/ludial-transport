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

const UsuarioBulkUpload = ({ open, onClose, onUpload }) => {
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

    const expectedHeaders = ['username', 'email', 'nombre_completo', 'password', 'rol'];
    if (!expectedHeaders.every(header => headers.includes(header))) {
      setError('El CSV debe tener las columnas: username, email, nombre_completo, password, rol');
      return;
    }

    const usuarios = lines
      .slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(value => value.trim().replace(/["']/g, ''));
        return {
          username: values[headers.indexOf('username')],
          email: values[headers.indexOf('email')],
          nombre_completo: values[headers.indexOf('nombre_completo')],
          password: values[headers.indexOf('password')],
          rol: values[headers.indexOf('rol')].toLowerCase()
        };
      });

    if (!validateUsuarios(usuarios)) {
      return;
    }

    onUpload(usuarios);
    setError(null);
  };

  const processJsonFile = (content) => {
    const usuarios = JSON.parse(content);
    if (!Array.isArray(usuarios)) {
      setError('El archivo debe contener un array de usuarios');
      return;
    }

    if (!validateUsuarios(usuarios)) {
      return;
    }

    onUpload(usuarios);
    setError(null);
  };

  const validateUsuarios = (usuarios) => {
    const validRoles = ['administrador', 'operador', 'supervisor'];
    const isValid = usuarios.every(usuario => 
      usuario.username && 
      usuario.email && 
      usuario.email.includes('@') &&
      usuario.nombre_completo && 
      usuario.password &&
      usuario.password.length >= 6 &&
      validRoles.includes(usuario.rol.toLowerCase())
    );

    if (!isValid) {
      setError(`Todos los usuarios deben tener:
        - Nombre de usuario
        - Email válido
        - Nombre completo
        - Contraseña (mínimo 6 caracteres)
        - Rol válido (administrador, operador, supervisor)`);
      return false;
    }

    return true;
  };

  const downloadTemplate = (format) => {
    let content;
    let filename;
    let type;

    if (format === 'csv') {
      content = 'username,email,nombre_completo,password,rol\nuser1,user1@example.com,Usuario Uno,password123,operador\nuser2,user2@example.com,Usuario Dos,password123,supervisor';
      filename = 'plantilla_usuarios.csv';
      type = 'text/csv';
    } else {
      content = JSON.stringify([
        {
          "username": "user1",
          "email": "user1@example.com",
          "nombre_completo": "Usuario Uno",
          "password": "password123",
          "rol": "operador"
        },
        {
          "username": "user2",
          "email": "user2@example.com",
          "nombre_completo": "Usuario Dos",
          "password": "password123",
          "rol": "supervisor"
        }
      ], null, 2);
      filename = 'plantilla_usuarios.json';
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
      <DialogTitle>Cargar Usuarios Masivamente</DialogTitle>
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Nota: Los usuarios existentes serán omitidos
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
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

export default UsuarioBulkUpload; 