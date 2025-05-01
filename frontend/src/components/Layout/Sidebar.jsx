import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard,
  DirectionsBus,
  Person,
  Route,
  Business,
  Analytics,
  Timer,
  Group,
  Settings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Vehículos', icon: <DirectionsBus />, path: '/vehiculos' },
  { text: 'Conductores', icon: <Person />, path: '/conductores' },
  { text: 'Rutas', icon: <Route />, path: '/rutas' },
  { text: 'Trayectos', icon: <Timer />, path: '/trayectos' },
  { text: 'CRM', icon: <Business />, path: '/crm' },
  { text: 'Analítica', icon: <Analytics />, path: '/analitica' },
  { text: 'Usuarios', icon: <Group />, path: '/usuarios' },
  { text: 'Configuración', icon: <Settings />, path: '/configuracion' }
];

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const drawerContent = (
    <>
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.dark',
        color: 'white',
        mt: '64px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            sx={{ width: 50, height: 50, mr: 2 }}
            alt="Admin"
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Administrador
            </Typography>
            <Typography variant="body2" sx={{ color: 'success.light' }}>
              • Online
            </Typography>
          </Box>
        </Box>
      </Box>
      <List sx={{ bgcolor: '#1e2a38', color: 'white', height: '100%' }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) onClose();
            }}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
              pl: 3
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={onClose}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          bgcolor: '#1e2a38',
          border: 'none'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar; 