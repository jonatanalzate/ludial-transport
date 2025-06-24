import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import { api } from '../../services/api';
import { Box, List, ListItem, ListItemAvatar, ListItemText, Avatar, Typography, Paper } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

// Reemplaza esto con tu token de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9uYXRhbmFsemF0ZSIsImEiOiJjbWIzbHpseWMwdjFiMmlwdmlnOWxpanJlIn0.f9HnAG8fxbXcRjWPphld1Q';

const manizalesCoords = [-75.5138, 5.0703];

const VEHICLE_ICON = 'https://cdn-icons-png.flaticon.com/512/744/744465.png'; // Ícono azul premium

const Monitoreo = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const routes = useRef({});
  const [ubicaciones, setUbicaciones] = useState([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // Estilo oscuro tipo Uber
      center: manizalesCoords,
      zoom: 13
    });

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const res = await api.getUbicaciones();
        setUbicaciones(res.data);
      } catch (err) {
        console.error('Error fetching ubicaciones:', err);
      }
    };

    fetchUbicaciones();
    const interval = setInterval(fetchUbicaciones, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!map.current || !ubicaciones.length) return;

    ubicaciones.forEach((u) => {
      const conductorId = u.conductor_id;
      const newPosition = [u.lng, u.lat];

      // Crear o actualizar marcador
      if (!markers.current[conductorId]) {
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.backgroundImage = `url(${VEHICLE_ICON})`;
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid #fff';
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)';
        el.style.backgroundColor = '#0a192f'; // Fondo oscuro para contraste

        markers.current[conductorId] = new mapboxgl.Marker(el)
          .setLngLat(newPosition)
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div>
              <b>Conductor ID:</b> ${conductorId}<br />
              <b>Última actualización:</b> ${new Date(u.timestamp).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' })}
            </div>
          `))
          .addTo(map.current);
      } else {
        // Animar el movimiento del marcador
        const oldPosition = markers.current[conductorId].getLngLat();
        const oldPositionArray = [oldPosition.lng, oldPosition.lat];
        const points = turf.points([oldPositionArray, newPosition]);
        const line = turf.lineString([oldPositionArray, newPosition]);
        const distance = turf.length(line);
        const duration = 5000; // 5 segundos para la animación

        let start = null;
        const animate = (timestamp) => {
          if (!start) start = timestamp;
          const progress = timestamp - start;
          const fraction = Math.min(progress / duration, 1);

          const point = turf.along(line, distance * fraction);
          markers.current[conductorId].setLngLat(point.geometry.coordinates);

          if (fraction < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }

      // Actualizar o crear ruta
      if (!routes.current[conductorId]) {
        routes.current[conductorId] = {
          coordinates: [newPosition]
        };
      } else {
        routes.current[conductorId].coordinates.push(newPosition);
      }

      // Actualizar la línea de ruta
      if (routes.current[conductorId].coordinates.length > 1) {
        const routeId = `route-${conductorId}`;
        if (map.current.getSource(routeId)) {
          map.current.getSource(routeId).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routes.current[conductorId].coordinates
            }
          });
        } else {
          map.current.addSource(routeId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routes.current[conductorId].coordinates
              }
            }
          });

          map.current.addLayer({
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#00bfff', // Azul vibrante, estilo Waymo
              'line-width': 5,
              'line-opacity': 0.85
            }
          });
        }
      }
    });
  }, [ubicaciones]);

  // Función para centrar el mapa en el vehículo seleccionado
  const handleSelectVehiculo = (vehiculo) => {
    setSelectedVehiculo(vehiculo.conductor_id);
    if (map.current && vehiculo.lat && vehiculo.lng) {
      map.current.flyTo({ center: [vehiculo.lng, vehiculo.lat], zoom: 16, speed: 1.2 });
      // Mostrar popup si existe
      if (markers.current[vehiculo.conductor_id]) {
        markers.current[vehiculo.conductor_id].togglePopup();
      }
    }
  };

  // Obtener vehículos únicos por conductor_id (última ubicación)
  const vehiculosActivos = Object.values(
    ubicaciones.reduce((acc, u) => {
      acc[u.conductor_id] = u;
      return acc;
    }, {})
  );

  return (
    <Box sx={{ display: 'flex', height: '80vh', width: '100%' }}>
      {/* Listado de vehículos activos */}
      <Paper elevation={4} sx={{ width: 320, minWidth: 220, maxWidth: 360, p: 0, mr: 2, overflowY: 'auto', borderRadius: 3, bgcolor: '#101828', color: '#fff', boxShadow: 6 }}>
        <Typography variant="h6" sx={{ p: 2, pb: 1, fontWeight: 700, color: '#fff' }}>
          Vehículos en Trayecto
        </Typography>
        <List dense>
          {vehiculosActivos.length === 0 && (
            <ListItem>
              <ListItemText primary="No hay vehículos activos" primaryTypographyProps={{ color: '#fff' }} />
            </ListItem>
          )}
          {vehiculosActivos.map((vehiculo) => (
            <ListItem
              key={vehiculo.conductor_id}
              button
              selected={selectedVehiculo === vehiculo.conductor_id}
              onClick={() => handleSelectVehiculo(vehiculo)}
              sx={{
                bgcolor: selectedVehiculo === vehiculo.conductor_id ? '#1e293b' : 'inherit',
                borderLeft: selectedVehiculo === vehiculo.conductor_id ? '4px solid #00bfff' : '4px solid transparent',
                transition: 'background 0.2s, border 0.2s',
                '&:hover': { bgcolor: '#263043' }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: '#00bfff' }}>
                  <DirectionsBusIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`Placa: ${vehiculo.placa_vehiculo || 'N/A'}`}
                secondary={vehiculo.nombre_conductor ? `Conductor: ${vehiculo.nombre_conductor}` : null}
                primaryTypographyProps={{ color: '#fff', fontWeight: 600 }}
                secondaryTypographyProps={{ color: '#b3c2d1' }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      {/* Mapa */}
      <Box sx={{ flexGrow: 1, height: '100%' }}>
        <div ref={mapContainer} style={{ height: '100%', width: '100%', borderRadius: 16, overflow: 'hidden' }} />
      </Box>
    </Box>
  );
};

export default Monitoreo; 