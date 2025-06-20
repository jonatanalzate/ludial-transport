import { Navigate, useLocation } from 'react-router-dom';

const roleAccess = {
    operador: ['trayectos'],
    supervisor: ['dashboard', 'crm'],
    administrador: [
        'dashboard',
        'trayectos',
        'vehiculos',
        'rutas',
        'crm',
        'usuarios',
        'configuracion',
        'mis-trayectos'
    ],
    conductor: ['trayectos', 'mis-trayectos']
};

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    // Si no hay token, redirigir al login
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si no hay rol o el rol no es válido, redirigir al login
    if (!userRole || !roleAccess[userRole]) {
        localStorage.clear();
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si la ruta está vacía, redirigir al dashboard o trayectos según el rol
    const currentPath = location.pathname.split('/')[1];
    if (!currentPath) {
        const defaultRoute = (userRole === 'operador' || userRole === 'conductor') ? '/trayectos' : '/dashboard';
        return <Navigate to={defaultRoute} replace />;
    }

    // Validar acceso a la ruta según el rol
    if (!roleAccess[userRole].includes(currentPath)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: 48, color: '#f44336', textAlign: 'center' }}>⛔</div>
                    <h2 style={{ textAlign: 'center', color: '#222' }}>Acceso No Autorizado</h2>
                    <p style={{ textAlign: 'center', color: '#444' }}>
                        No tienes permisos para acceder a este módulo.<br />
                        Por favor, contacta al administrador si crees que esto es un error.
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute; 