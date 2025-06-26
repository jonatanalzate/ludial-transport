import React from 'react';

const Fidelizacion = () => {
  // Datos de ejemplo
  const puntos = 7;
  const meta = 10;
  return (
    <div className="b2c-fidelizacion">
      <h2>Fidelización</h2>
      <p>Puntos acumulados: <b>{puntos}</b> / {meta}</p>
      <div style={{background: '#e0e0e0', borderRadius: 8, height: 20, width: '100%', marginBottom: 10}}>
        <div style={{background: '#4caf50', width: `${(puntos/meta)*100}%`, height: '100%', borderRadius: 8}}></div>
      </div>
      <p>¡Viaja 3 veces más y gana un café gratis!</p>
      <p>Premios futuros: descuentos, regalos, sorpresas...</p>
    </div>
  );
};

export default Fidelizacion; 