// src/shared/hooks/useMapLibre.js
import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export function useMapLibre(containerRef, { center = [85.314, 27.717], zoom = 13 } = {}) {
  const mapRef     = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      // free tile options — pick one:
      style: 'https://tiles.openfreemap.org/styles/liberty',   // OpenFreeMap
      // style: 'https://demotiles.maplibre.org/style.json',   // MapLibre demo
      center,
      zoom,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const upsertMarker = useCallback((id, lngLat, options = {}) => {
    const map = mapRef.current;
    if (!map) return;

    if (markersRef.current[id]) {
      markersRef.current[id].setLngLat(lngLat);
    } else {
      const el = document.createElement('div');
      el.style.cssText = options.isActive
        ? 'width:14px;height:14px;border-radius:50%;background:#0ea5e9;border:2px solid #fff;box-shadow:0 0 0 4px rgba(14,165,233,.3)'
        : 'width:10px;height:10px;border-radius:50%;background:#71717a;border:2px solid #fff';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .addTo(map);

      if (options.popup) {
        marker.setPopup(
          new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(options.popup)
        );
      }
      markersRef.current[id] = marker;
    }
  }, []);

  const removeMarker = useCallback((id) => {
    markersRef.current[id]?.remove();
    delete markersRef.current[id];
  }, []);

  const flyTo = useCallback((lngLat, zoom = 15) => {
    mapRef.current?.flyTo({ center: lngLat, zoom, duration: 1200 });
  }, []);

  const drawRoute = useCallback((id, coordinates) => {
    const map = mapRef.current;
    if (!map) return;
    const sourceId = `route-${id}`;
    const layerId  = `route-layer-${id}`;

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates }
      });
    } else {
      map.on('load', () => {
        map.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates } }
        });
        map.addLayer({
          id: layerId, type: 'line', source: sourceId,
          paint: { 'line-color': '#10b981', 'line-width': 3, 'line-dasharray': [2, 2] }
        });
      });
    }
  }, []);

  return { mapRef, upsertMarker, removeMarker, flyTo, drawRoute };
}