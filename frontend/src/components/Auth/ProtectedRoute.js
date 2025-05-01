import { Navigate, useLocation } from 'react-router-dom';

const roleAccess = {
    operador: ['trayectos'],
    supervisor: ['dashboard', 'crm'],
    administrador: [
        'dashboard',
        'trayectos',
        'conductores',
        'vehiculos',
        'rutas',
        'crm',
        'usuarios',
        'configuracion'
    ]
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
        const defaultRoute = userRole === 'operador' ? '/trayectos' : '/dashboard';
        return <Navigate to={defaultRoute} replace />;
    }

    return children;
};

export default ProtectedRoute; 