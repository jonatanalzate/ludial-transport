import { Link } from 'react-router-dom';

const NavMenu = () => {
    const userRole = localStorage.getItem('role');

    const menuItems = {
        operador: [
            { path: '/trayectos', label: 'Trayectos' }
        ],
        supervisor: [
            { path: '/trayectos', label: 'Trayectos' },
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/crm', label: 'CRM' }
        ],
        administrador: [
            { path: '/trayectos', label: 'Trayectos' },
            { path: '/dashboard', label: 'Dashboard' },
            { path: '/crm', label: 'CRM' },
            { path: '/usuarios', label: 'Usuarios' },
            { path: '/configuracion', label: 'Configuración' }
        ]
    };

    return (
        <nav>
            {menuItems[userRole]?.map((item) => (
                <Link key={item.path} to={item.path}>
                    {item.label}
                </Link>
            ))}
        </nav>
    );
};

export default NavMenu; 