import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import { api } from '../../services/api';
import { Box, Typography, Card, CardContent, Stack, Select, MenuItem, CircularProgress, Alert } from '@mui/material';

// Token de Mapbox (mismo que en monitoreo)
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9uYXRhbmFsemF0ZSIsImEiOiJjbWIzbHpseWMwdjFiMmlwdmlnOWxpanJlIn0.f9HnAG8fxbXcRjWPphld1Q';

const manizalesCoords = [-75.5138, 5.0703];
const VEHICLE_ICON = 'https://cdn-icons-png.flaticon.com/512/744/744465.png';

const MonitoreoRuta = () => {
  const [rutas, setRutas] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState('');
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Referencias del mapa
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const routes = useRef({});

  // Inicializar mapa SOLO cuando el ref esté disponible
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: manizalesCoords,
      zoom: 13
    });

    return () => map.current?.remove();
  }, [mapContainer]);

  // Cargar rutas
  useEffect(() => {
    api.getRutasActivas()
      .then(res => setRutas(res.data))
      .catch(() => setError('No se pudieron cargar las rutas activas.'));
  }, []);

  // Cargar ubicaciones cuando cambie la ruta seleccionada
  useEffect(() => {
    if (!rutaSeleccionada) return;
    setLoading(true);
    api.getUbicaciones()
      .then(res => {
        const ubicacionesFiltradas = res.data.filter(u => u.ruta_id === parseInt(rutaSeleccionada));
        setUbicaciones(ubicacionesFiltradas);
        setLoading(false);
      })
      .catch(() => {
        setError('No se pudo obtener la ubicación del bus.');
        setLoading(false);
      });
  }, [rutaSeleccionada]);

  // Actualizar mapa con ubicaciones
  useEffect(() => {
    if (!map.current || !ubicaciones.length) return;

    // Limpiar marcadores anteriores
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    ubicaciones.forEach((u) => {
      const conductorId = u.conductor_id;
      const newPosition = [u.lng, u.lat];

      // Crear marcador
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
      el.style.backgroundColor = '#0a192f';

      markers.current[conductorId] = new mapboxgl.Marker(el)
        .setLngLat(newPosition)
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div>
            <b>Bus:</b> ${u.placa_vehiculo}<br />
            <b>Conductor:</b> ${u.nombre_conductor}<br />
            <b>Ruta:</b> ${u.nombre_ruta}<br />
            <b>Última actualización:</b> ${u.timestamp ? new Date(u.timestamp).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' }) : 'N/A'}
          </div>
        `))
        .addTo(map.current);

      // Actualizar ruta
      if (!routes.current[conductorId]) {
        routes.current[conductorId] = {
          coordinates: [newPosition]
        };
      } else {
        routes.current[conductorId].coordinates.push(newPosition);
      }

      // Dibujar línea de ruta
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
              'line-color': '#00bfff',
              'line-width': 5,
              'line-opacity': 0.85
            }
          });
        }
      }
    });
  }, [ubicaciones]);

  return (
    <Box sx={{ bgcolor: '#181c24', minHeight: '100vh', color: 'white', p: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#90caf9' }}>
        Monitoreo de Ruta
      </Typography>
      <Card sx={{ mb: 3, bgcolor: '#23293a', color: 'white', borderRadius: 3, boxShadow: 4, p: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#90caf9', mb: 1 }}>
                Selecciona una ruta
              </Typography>
              <Select
                value={rutaSeleccionada}
                onChange={e => setRutaSeleccionada(e.target.value)}
                displayEmpty
                sx={{ bgcolor: '#101828', color: 'white', borderRadius: 2, minWidth: 220 }}
                inputProps={{ 'aria-label': 'Selecciona una ruta' }}
              >
                <MenuItem value="" disabled>Selecciona una ruta</MenuItem>
                {rutas.map(ruta => (
                  <MenuItem key={ruta.id} value={ruta.id}>{ruta.nombre} ({ruta.origen} → {ruta.destino})</MenuItem>
                ))}
              </Select>
            </Box>
            {loading && <CircularProgress color="info" sx={{ mt: 2 }} />}
            {error && <Alert severity="error">{error}</Alert>}
            <Card sx={{ bgcolor: '#101828', color: 'white', borderRadius: 2, boxShadow: 2, mb: 2 }}>
              <CardContent>
                <Box sx={{ width: '100%', height: 400, borderRadius: 2, mt: 2, background: '#e0e0e0', overflow: 'hidden' }}>
                  <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MonitoreoRuta; 