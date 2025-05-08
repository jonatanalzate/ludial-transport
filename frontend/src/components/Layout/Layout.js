import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  AppBar,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import MapIcon from '@mui/icons-material/Map';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import TimelineIcon from '@mui/icons-material/Timeline';
import InsightsIcon from '@mui/icons-material/Insights';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import UnauthorizedAccess from '../Common/UnauthorizedAccess';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Trayectos', icon: <TimelineIcon />, path: '/trayectos' },
  { text: 'Conductores', icon: <PersonIcon />, path: '/conductores' },
  { text: 'Vehículos', icon: <DirectionsBusIcon />, path: '/vehiculos' },
  { text: 'Rutas', icon: <MapIcon />, path: '/rutas' },
  { text: 'CRM', icon: <BusinessIcon />, path: '/crm' },
  { text: 'Analítica', icon: <InsightsIcon />, path: '/analitica' },
  { text: 'Usuarios', icon: <GroupIcon />, path: '/usuarios' },
];

// Mover roleAccess fuera de los componentes para que sea accesible por ambos
const roleAccess = {
  operador: ['trayectos'],
  supervisor: ['dashboard', 'crm', 'analitica'],
  administrador: [
    'dashboard',
    'trayectos',
    'conductores',
    'vehiculos',
    'rutas',
    'crm',
    'analitica',
    'usuarios',
    'configuracion'
  ],
  conductor: ['trayectos']
};

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userRole = localStorage.getItem('role');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  // Verificar si el usuario tiene acceso a la ruta actual
  const currentPath = location.pathname.split('/')[1];
  const hasAccess = roleAccess[userRole]?.includes(currentPath);

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#E8E9EA',
          color: '#2C2C2C',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: '#2C2C2C'
            }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, display: { xs: 'none', sm: 'block' }, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h5" 
            noWrap 
            component="div"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              letterSpacing: '3px',
              fontSize: '1.5rem',
              textTransform: 'uppercase'
            }}
          >
            Ludial
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer para móviles */}
      <Drawer
        variant="temporary"
        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            marginTop: '64px',
            height: `calc(100% - 64px)`,
          },
        }}
      >
        <DrawerContent 
          parentOpen={open} 
          setParentOpen={setOpen} 
          onMobileClick={handleDrawerToggle}
          isMobile={true}
        />
      </Drawer>

      {/* Drawer para desktop */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            marginTop: '64px',
            height: `calc(100% - 64px)`,
          },
        }}
      >
        <DrawerContent 
          parentOpen={open} 
          setParentOpen={setOpen}
          isMobile={false}
        />
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: '100%',
          minHeight: '100vh',
          marginTop: '64px',
        }}
      >
        {hasAccess ? children : <UnauthorizedAccess />}
      </Box>
    </Box>
  );
}

// Componente auxiliar para el contenido del drawer
const DrawerContent = ({ parentOpen, setParentOpen, onMobileClick, isMobile }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (isMobile && onMobileClick) {
      onMobileClick();
    }
    navigate('/login');
  };

  const handleItemClick = () => {
    if (isMobile && onMobileClick) {
      onMobileClick();
    }
  };

  return (
    <>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            onClick={handleItemClick}
            sx={{
              minHeight: 48,
              justifyContent: parentOpen ? 'initial' : 'center',
              px: 2.5,
              display: roleAccess[userRole]?.includes(item.path.slice(1)) ? 'flex' : 'none',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: parentOpen ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ opacity: parentOpen ? 1 : 0 }} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" sx={{ opacity: parentOpen ? 1 : 0 }} />
        </ListItem>
      </List>
    </>
  );
};

export default Layout; 