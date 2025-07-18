import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/Dashboard/Dashboard';
import TrayectosList from './components/Trayectos/TrayectosList';
import VehiculosList from './components/Vehiculos/VehiculosList';
import RutasList from './components/Rutas/RutasList';
import UsuariosList from './components/Usuarios/UsuariosList';
import CRMList from './components/CRM/CRMList';
import Configuracion from './components/Configuracion/Configuracion';
import AnaliticaList from './components/Analitica/AnaliticaList';
import Monitoreo from './components/Monitoreo/Monitoreo';
import MisTrayectosMobile from './components/Conductores/MisTrayectosMobile';
import B2CHome from './components/B2C/B2CHome';
import MonitoreoRuta from './components/B2C/MonitoreoRuta';
import Fidelizacion from './components/B2C/Fidelizacion';
import Contacto from './components/B2C/Contacto';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Todas las rutas están disponibles pero protegidas */}
        {[
          { path: '/dashboard', component: <Dashboard /> },
          { path: '/trayectos', component: <TrayectosList /> },
          { path: '/vehiculos', component: <VehiculosList /> },
          { path: '/rutas', component: <RutasList /> },
          { path: '/crm', component: <CRMList /> },
          { path: '/analitica', component: <AnaliticaList /> },
          { path: '/usuarios', component: <UsuariosList /> },
          { path: '/configuracion', component: <Configuracion /> },
          { path: '/monitoreo', component: <Monitoreo /> },
          { path: '/mis-trayectos', component: <MisTrayectosMobile /> }
        ].map(({ path, component }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <Layout>
                  {component}
                </Layout>
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="/b2c" element={<B2CHome />} />
        <Route path="/b2c/monitoreo" element={<MonitoreoRuta />} />
        <Route path="/b2c/fidelizacion" element={<Fidelizacion />} />
        <Route path="/b2c/contacto" element={<Contacto />} />
      </Routes>
    </Router>
  );
}

export default App; 