import React from 'react';
import { Link } from 'react-router-dom';
import './B2C.css';

const B2CHome = () => (
  <div className="b2c-home">
    <h1>Bienvenido a Ludial B2C</h1>
    <p>Monitorea tu bus, gana puntos y comunícate con nosotros. ¡Sin registro, solo selecciona tu ruta!</p>
    <nav className="b2c-nav">
      <Link to="/b2c/monitoreo">Ubicación del Bus</Link>
      <Link to="/b2c/fidelizacion">Fidelización</Link>
      <Link to="/b2c/contacto">Comunicación Directa</Link>
    </nav>
  </div>
);

export default B2CHome; 