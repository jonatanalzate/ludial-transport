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
          { path: '/configuracion', component: <Configuracion /> }
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
      </Routes>
    </Router>
  );
}

export default App; 