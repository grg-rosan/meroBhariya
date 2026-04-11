// src/shared/hooks/useMapbox.js
// Wraps Mapbox GL JS with React lifecycle.
// Install: npm install mapbox-gl
// Set VITE_MAPBOX_TOKEN in .env

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

/**
 * @param {React.RefObject} containerRef  - ref attached to the map div
 * @param {object} options
 * @param {[lng, lat]} options.center
 * @param {number}   options.zoom
 * @param {string}   options.style       - mapbox style URL
 */
export function useMapbox(containerRef, { center = [85.314, 27.717], zoom = 13, style = 'mapbox://styles/mapbox/dark-v11' } = {}) {
  const mapRef     = useRef(null);
  const markersRef = useRef({});

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add or update a marker
  const upsertMarker = useCallback((id, lngLat, options = {}) => {
    const map = mapRef.current;
    if (!map) return;

    if (markersRef.current[id]) {
      markersRef.current[id].setLngLat(lngLat);
    } else {
      const el = document.createElement('div');
      el.className    = options.className ?? 'map-marker';
      el.style.cssText = options.style ?? 'width:14px;height:14px;border-radius:50%;background:#f43f5e;border:2px solid #fff;box-shadow:0 0 0 4px rgba(244,63,94,.3)';

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(map);

      if (options.popup) {
        marker.setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false })
          .setHTML(options.popup));
      }

      markersRef.current[id] = marker;
    }
  }, []);

  // Remove a marker
  const removeMarker = useCallback((id) => {
    markersRef.current[id]?.remove();
    delete markersRef.current[id];
  }, []);

  // Fly camera to position
  const flyTo = useCallback((lngLat, zoom = 15) => {
    mapRef.current?.flyTo({ center: lngLat, zoom, duration: 1200 });
  }, []);

  // Draw a line between two points
  const drawRoute = useCallback((id, coordinates) => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = `route-${id}`;
    const layerId  = `route-layer-${id}`;

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
    } else {
      map.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates } } });
      map.addLayer({ id: layerId, type: 'line', source: sourceId, paint: { 'line-color': '#10b981', 'line-width': 3, 'line-dasharray': [2, 2] } });
    }
  }, []);

  return { mapRef, upsertMarker, removeMarker, flyTo, drawRoute };
}
