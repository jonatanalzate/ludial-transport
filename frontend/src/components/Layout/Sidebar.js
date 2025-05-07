import React from 'react';
import { Link } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  DirectionsBus,
  Person,
  Route,
  Group,
  Settings,
  Business,
} from '@mui/icons-material';

const Sidebar = ({ open, onClose }) => {
  const userRole = localStorage.getItem('role');

  // Definir los menús permitidos para cada rol
  const menuItems = {
    administrador: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Trayectos', icon: <DirectionsBus />, path: '/trayectos' },
      { text: 'Conductores', icon: <Person />, path: '/conductores' },
      { text: 'Vehículos', icon: <DirectionsBus />, path: '/vehiculos' },
      { text: 'Rutas', icon: <Route />, path: '/rutas' },
      { text: 'CRM', icon: <Business />, path: '/crm' },
      { text: 'Usuarios', icon: <Group />, path: '/usuarios' },
      { text: 'Configuración', icon: <Settings />, path: '/configuracion' },
    ],
    supervisor: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'CRM', icon: <Business />, path: '/crm' },
    ],
    operador: [
      { text: 'Trayectos', icon: <DirectionsBus />, path: '/trayectos' },
    ],
    conductor: [
      { text: 'Trayectos', icon: <DirectionsBus />, path: '/trayectos' },
    ],
  };

  // Obtener los menús correspondientes al rol del usuario
  const allowedMenuItems = menuItems[userRole] || [];

  return (
    <Drawer
      variant="permanent"
      open={open}
      onClose={onClose}
      sx={{
        width: open ? 240 : 64,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? 240 : 64,
          boxSizing: 'border-box',
          transition: 'width 0.2s',
        },
      }}
    >
      <List>
        {allowedMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ opacity: open ? 1 : 0 }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
    </Drawer>
  );
};

export default Sidebar; 