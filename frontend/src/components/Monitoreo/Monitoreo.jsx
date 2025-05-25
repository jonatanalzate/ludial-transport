import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as turf from '@turf/turf';
import { api } from '../../services/api';

// Reemplaza esto con tu token de Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoiam9uYXRhbmFsemF0ZSIsImEiOiJjbWIzbHpseWMwdjFiMmlwdmlnOWxpanJlIn0.f9HnAG8fxbXcRjWPphld1Q';

const manizalesCoords = [-75.5138, 5.0703];

const Monitoreo = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const routes = useRef({});
  const [ubicaciones, setUbicaciones] = useState([]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: manizalesCoords,
      zoom: 13
    });

    map.current.on('load', () => {
      // Agregar capa de tráfico
      map.current.addSource('mapbox-traffic', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1'
      });

      map.current.addLayer({
        id: 'traffic-layer',
        type: 'line',
        source: 'mapbox-traffic',
        'source-layer': 'traffic',
        paint: {
          'line-width': 2,
          'line-color': [
            'case',
            ['==', ['get', 'congestion'], 'low'], '#00ff00',
            ['==', ['get', 'congestion'], 'moderate'], '#ffff00',
            ['==', ['get', 'congestion'], 'heavy'], '#ff0000',
            '#ff0000'
          ]
        }
      });
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
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.backgroundImage = 'url(https://cdn-icons-png.flaticon.com/512/194/194938.png)';
        el.style.backgroundSize = 'cover';

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
        const points = turf.points([oldPosition, newPosition]);
        const line = turf.lineString([oldPosition, newPosition]);
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
              'line-color': '#888',
              'line-width': 2
            }
          });
        }
      }
    });
  }, [ubicaciones]);

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <h2>Monitoreo de Conductores Activos</h2>
      <div ref={mapContainer} style={{ height: '70vh', width: '100%' }} />
    </div>
  );
};

export default Monitoreo; 