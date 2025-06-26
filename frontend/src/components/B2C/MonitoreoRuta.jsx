import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const MonitoreoRuta = () => {
  const [rutas, setRutas] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState('');
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getRutasActivas()
      .then(res => setRutas(res.data))
      .catch(() => setError('No se pudieron cargar las rutas activas.'));
  }, []);

  useEffect(() => {
    if (!rutaSeleccionada) return;
    setLoading(true);
    api.getUbicaciones()
      .then(res => {
        setUbicaciones(res.data.filter(u => u.ruta_id === parseInt(rutaSeleccionada)));
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo obtener la ubicación del bus.');
        setLoading(false);
      });
  }, [rutaSeleccionada]);

  return (
    <div className="b2c-monitoreo">
      <h2>Monitoreo de Ruta</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <select onChange={e => setRutaSeleccionada(e.target.value)} value={rutaSeleccionada}>
        <option value="" disabled>Selecciona una ruta</option>
        {rutas.map(ruta => (
          <option key={ruta.id} value={ruta.id}>{ruta.nombre} ({ruta.origen} → {ruta.destino})</option>
        ))}
      </select>
      {loading && <p>Cargando ubicación...</p>}
      {rutaSeleccionada && !loading && (
        <div className="mapa-ejemplo">
          <p>Mostrando ubicación en tiempo real para: <b>{rutas.find(r => r.id === parseInt(rutaSeleccionada))?.nombre}</b></p>
          {ubicaciones.length > 0 ? (
            <div>
              {ubicaciones.map((u, idx) => (
                <div key={idx} style={{marginBottom: 8}}>
                  <span>Bus: <b>{u.placa_vehiculo}</b> | Conductor: <b>{u.nombre_conductor}</b></span><br/>
                  <span>Última posición: {u.lat}, {u.lng} ({u.timestamp ? new Date(u.timestamp).toLocaleTimeString() : 'sin hora'})</span>
                </div>
              ))}
              <div style={{width: '100%', height: 200, background: '#e0e0e0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <span>Mapa de ejemplo aquí</span>
              </div>
              <p>Tiempo estimado de llegada: 5 min (demo)</p>
            </div>
          ) : (
            <p>No hay buses en ruta actualmente.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MonitoreoRuta; 