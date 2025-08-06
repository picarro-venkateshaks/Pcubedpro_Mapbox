import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import bbox from '@turf/bbox';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import intersect from '@turf/intersect';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiaXRhZG1pbi1waWNhcnJvIiwiYSI6ImNtNzJmbGZraDA5eGYyaW9qa2U2a3RiZ2IifQ.OaC7I0Br7Ht8EAG2EvxwSw';


const basemaps = [
  { label: 'Streets', style: 'mapbox://styles/mapbox/streets-v12' },
  { label: 'Satellite', style: 'mapbox://styles/mapbox/satellite-v9' },
  { label: 'Light', style: 'mapbox://styles/mapbox/light-v11' },
  { label: 'Dark', style: 'mapbox://styles/mapbox/dark-v11' }
];

const overlayLayers = [
  { label: 'Report Area', id: 'reportarea_atco', api: 'http://localhost:5000/api/reportarea_atco', color: '#1976d2' },
  { label: 'Breadcrumb Summit', id: 'breadcrumb_summit', api: 'http://localhost:5000/api/breadcrumb_summit', color: '#d2691e' }
];


function App() {
  const mapRef = useRef(null);
  const [basemap, setBasemap] = useState(basemaps[0].style);
  const [activeLayer, setActiveLayer] = useState(overlayLayers[0].id);
  const [geojsonCache, setGeojsonCache] = useState({});
  // Center and zoom for United States
  const homeCenter = [-98.5795, 39.8283]; // Longitude, Latitude (center of contiguous US)
  const homeZoom = 3.5;

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: basemap,
      center: homeCenter,
      zoom: homeZoom
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    // Add Draw control
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'draw_polygon'
    });
    map.addControl(draw, 'top-left');

    // Add Home (pan) button
    class HomeControl {
      onAdd(map) {
        this._map = map;
        this._container = document.createElement('button');
        this._container.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-home';
        this._container.type = 'button';
        this._container.title = 'Pan to Home';
        this._container.onclick = () => {
          map.flyTo({ center: homeCenter, zoom: homeZoom });
        };
        return this._container;
      }
      onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
      }
    }
    map.addControl(new HomeControl(), 'top-left');



    // Add both GeoJSON layers from Flask API, but only show the active one
    map.on('load', () => {
      const cache = {};
      overlayLayers.forEach(layer => {
        fetch(layer.api)
          .then(res => res.json())
          .then(geojson => {
            cache[layer.id] = geojson;
            if (geojson && geojson.features && geojson.features.length > 0) {
              map.addSource(layer.id, {
                type: 'geojson',
                data: geojson
              });
              // Add polygon fill layer
              map.addLayer({
                id: `${layer.id}-fill`,
                type: 'fill',
                source: layer.id,
                paint: {
                  'fill-color': layer.color,
                  'fill-opacity': 0.3
                },
                filter: ['==', '$type', 'Polygon'],
                layout: { visibility: layer.id === activeLayer ? 'visible' : 'none' }
              });
              // Add polygon outline layer
              map.addLayer({
                id: `${layer.id}-outline`,
                type: 'line',
                source: layer.id,
                paint: {
                  'line-color': layer.color,
                  'line-width': 2
                },
                filter: ['==', '$type', 'Polygon'],
                layout: { visibility: layer.id === activeLayer ? 'visible' : 'none' }
              });
              // Zoom to bounds for the first loaded layer
              if (layer.id === activeLayer) {
                try {
                  const boundsArray = bbox(geojson);
                  if (
                    Array.isArray(boundsArray) &&
                    boundsArray.length === 4 &&
                    boundsArray.every(Number.isFinite)
                  ) {
                    map.fitBounds([
                      [boundsArray[0], boundsArray[1]],
                      [boundsArray[2], boundsArray[3]]
                    ], { padding: 40, duration: 1200 });
                  }
                } catch (e) {
                  console.warn('Could not fit bounds to data:', e);
                }
              }
              // Add click handler for identifier popup
              map.on('click', `${layer.id}-fill`, (e) => {
                const features = map.queryRenderedFeatures(e.point, { layers: [`${layer.id}-fill`] });
                if (features.length > 0) {
                  const feature = features[0];
                  const props = feature.properties;
                  let html = '<div style="font-size:14px;max-width:300px;">';
                  if (props) {
                    const idKey = Object.keys(props).find(k => /id|name|identifier/i.test(k));
                    if (idKey) {
                      html += `<strong>${idKey}:</strong> ${props[idKey]}<br/>`;
                    }
                    html += '<hr style="margin:4px 0;"/>';
                    for (const key in props) {
                      html += `<strong>${key}:</strong> ${props[key]}<br/>`;
                    }
                  } else {
                    html += 'No properties found.';
                  }
                  html += '</div>';
                  new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(map);
                }
              });
              // Change cursor to pointer when hovering over polygons
              map.on('mouseenter', `${layer.id}-fill`, () => {
                map.getCanvas().style.cursor = 'pointer';
              });
              map.on('mouseleave', `${layer.id}-fill`, () => {
                map.getCanvas().style.cursor = '';
              });
            } else {
              console.warn(`GeoJSON loaded but no features found for ${layer.label}.`);
            }
          })
          .catch(err => {
            console.error(`Error loading GeoJSON for ${layer.label}:`, err);
          });
      });
      setGeojsonCache(cache);

      // Draw event: spatial query and highlight
      map.on('draw.create', (e) => {
        const drawn = e.features[0];
        if (!drawn) return;
        const activeGeojson = cache[activeLayer];
        if (!activeGeojson) return;
        // Intersect each feature
        const intersected = activeGeojson.features.filter(f => {
          try {
            return intersect(f, drawn) !== null;
          } catch {
            return false;
          }
        });
        // Add highlight source/layer
        if (map.getSource('highlight')) map.removeSource('highlight');
        if (map.getLayer('highlight-fill')) map.removeLayer('highlight-fill');
        if (intersected.length > 0) {
          map.addSource('highlight', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: intersected }
          });
          map.addLayer({
            id: 'highlight-fill',
            type: 'fill',
            source: 'highlight',
            paint: {
              'fill-color': '#ffeb3b',
              'fill-opacity': 0.6
            },
            filter: ['==', '$type', 'Polygon']
          });
        }
      });
      // Remove highlight on draw.delete
      map.on('draw.delete', () => {
        if (map.getLayer('highlight-fill')) map.removeLayer('highlight-fill');
        if (map.getSource('highlight')) map.removeSource('highlight');
      });
    });

    return () => map.remove();
  }, [basemap]);

  return (
    <>
      <div id="map" style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }} />
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
        <span style={{ fontWeight: 600, marginRight: 8 }}>Basemap:</span>
        {basemaps.map(b => (
          <button
            key={b.style}
            onClick={() => setBasemap(b.style)}
            style={{
              marginRight: 6,
              padding: '4px 10px',
              borderRadius: 4,
              border: basemap === b.style ? '2px solid #1976d2' : '1px solid #aaa',
              background: basemap === b.style ? '#1976d2' : '#fff',
              color: basemap === b.style ? '#fff' : '#222',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {b.label}
          </button>
        ))}
        <div style={{ marginTop: 12 }}>
          <span style={{ fontWeight: 600, marginRight: 8 }}>Layer:</span>
          {overlayLayers.map(l => (
            <button
              key={l.id}
              onClick={() => {
                setActiveLayer(l.id);
                // Toggle layer visibility
                if (mapRef.current) {
                  overlayLayers.forEach(ol => {
                    if (mapRef.current.getLayer(`${ol.id}-fill`)) {
                      mapRef.current.setLayoutProperty(`${ol.id}-fill`, 'visibility', ol.id === l.id ? 'visible' : 'none');
                    }
                    if (mapRef.current.getLayer(`${ol.id}-outline`)) {
                      mapRef.current.setLayoutProperty(`${ol.id}-outline`, 'visibility', ol.id === l.id ? 'visible' : 'none');
                    }
                  });
                }
              }}
              style={{
                marginRight: 6,
                padding: '4px 10px',
                borderRadius: 4,
                border: activeLayer === l.id ? `2px solid ${l.color}` : '1px solid #aaa',
                background: activeLayer === l.id ? l.color : '#fff',
                color: activeLayer === l.id ? '#fff' : '#222',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
