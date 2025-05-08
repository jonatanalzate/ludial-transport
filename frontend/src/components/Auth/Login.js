import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new URLSearchParams();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('password', formData.password);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/token`, 
        formDataToSend,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, role, user_id } = response.data;
      // console.log('Role recibido:', role); // (comentado por seguridad)
      
      // Normalizar el rol recibido
      const normalizedRole = role.toLowerCase();
      // console.log('Role normalizado:', normalizedRole); // (comentado por seguridad)
      
      if (!normalizedRole || !['operador', 'supervisor', 'administrador', 'conductor'].includes(normalizedRole)) {
        console.error('Rol inválido recibido:', role);
        throw new Error('Rol de usuario inválido');
      }

      localStorage.setItem('token', access_token);
      localStorage.setItem('role', normalizedRole);
      localStorage.setItem('user_id', user_id);
      
      if (normalizedRole === 'operador' || normalizedRole === 'conductor') {
        navigate('/trayectos');
      } else if (normalizedRole === 'supervisor') {
        navigate('/dashboard');
      } else if (normalizedRole === 'administrador') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error de login:', error);
      setError('Credenciales inválidas o error en el servidor');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            LUDIAL
          </Typography>
          <Typography component="h2" variant="h6" align="center" sx={{ mb: 3 }}>
            Iniciar Sesión
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Correo electrónico"
              name="username"
              type="email"
              autoComplete="email"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            {error && (
              <Typography color="error" align="center" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Ingresar
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login; 