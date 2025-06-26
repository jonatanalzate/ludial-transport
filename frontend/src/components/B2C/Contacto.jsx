import React, { useState } from 'react';

const Contacto = () => {
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    setEnviado(true);
    setMensaje('');
  };

  return (
    <div className="b2c-contacto">
      <h2>Comunicación Directa</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          placeholder="Escribe tu mensaje, sugerencia o reporte..."
          rows={4}
          style={{width: '100%', marginBottom: 8}}
        />
        <button type="submit">Enviar</button>
      </form>
      {enviado && <p>¡Gracias por tu mensaje! Te responderemos pronto.</p>}
      <div className="b2c-faq">
        <h3>Preguntas Frecuentes</h3>
        <ul>
          <li>¿Cómo monitoreo mi bus? <br/>Selecciona tu ruta y ve la ubicación en tiempo real.</li>
          <li>¿Cómo gano puntos? <br/>Cada viaje suma puntos automáticamente.</li>
          <li>¿Necesito registrarme? <br/>No, para el piloto puedes usar la app sin registro.</li>
        </ul>
      </div>
    </div>
  );
};

export default Contacto; 