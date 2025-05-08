import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../../services/api';

const manizalesCoords = [5.0703, -75.5138];

const iconConductor = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/194/194938.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const Monitoreo = () => {
  const [ubicaciones, setUbicaciones] = useState([]);

  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const res = await api.getUbicaciones();
        setUbicaciones(res.data);
      } catch (err) {
        setUbicaciones([]);
      }
    };
    fetchUbicaciones();
    const interval = setInterval(fetchUbicaciones, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <h2>Monitoreo de Conductores Activos</h2>
      <MapContainer center={manizalesCoords} zoom={13} style={{ height: '70vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {ubicaciones.map((u) => (
          <Marker key={u.conductor_id} position={[u.lat, u.lng]} icon={iconConductor}>
            <Popup>
              <div>
                <b>Conductor ID:</b> {u.conductor_id}<br />
                <b>Última actualización:</b> {new Date(u.timestamp).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Monitoreo; 