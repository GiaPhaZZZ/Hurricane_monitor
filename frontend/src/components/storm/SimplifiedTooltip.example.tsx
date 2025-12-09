/**
 * SimplifiedTooltip Example Usage
 * 
 * Demonstrates how to use SimplifiedTooltip with hover interactions
 */

import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import { SimplifiedTooltip } from './SimplifiedTooltip';
import type { StormPoint } from './HurricaneMarker';
import 'leaflet/dist/leaflet.css';

/**
 * Example storm data points
 */
const stormPoints: StormPoint[] = [
  {
    timestamp: new Date('2024-09-07T06:00:00Z').getTime(),
    lat: 16.5,
    lng: 110.0,
    windSpeed: 150,
    pressure: 950,
    category: 'Category 3',
  },
  {
    timestamp: new Date('2024-09-07T12:00:00Z').getTime(),
    lat: 17.0,
    lng: 109.5,
    windSpeed: 165,
    pressure: 945,
    category: 'Category 4',
  },
  {
    timestamp: new Date('2024-09-07T18:00:00Z').getTime(),
    lat: 17.5,
    lng: 109.0,
    windSpeed: 180,
    pressure: 935,
    category: 'Category 4',
  },
];

/**
 * Interactive map component with hover detection
 */
function InteractiveMap() {
  const [hoveredPoint, setHoveredPoint] = useState<StormPoint | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Track mouse movement
  useMapEvents({
    mousemove: (e) => {
      setCursorPosition({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
      });
    },
  });

  return (
    <>
      {stormPoints.map((point, index) => (
        <CircleMarker
          key={index}
          center={[point.lat, point.lng]}
          radius={6}
          pathOptions={{
            color: 'white',
            fillColor: '#ef4444',
            fillOpacity: 0.8,
            weight: 2,
          }}
          eventHandlers={{
            mouseover: () => setHoveredPoint(point),
            mouseout: () => setHoveredPoint(null),
          }}
        />
      ))}

      {hoveredPoint && (
        <SimplifiedTooltip
          stormData={hoveredPoint}
          position={cursorPosition}
          isVisible={true}
        />
      )}
    </>
  );
}

/**
 * Example component showing SimplifiedTooltip integration
 */
export function SimplifiedTooltipExample() {
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer
        center={[17.0, 109.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InteractiveMap />
      </MapContainer>

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'white',
        padding: '12px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
          SimplifiedTooltip Demo
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          Hover over the red markers to see the simplified tooltip
        </p>
      </div>
    </div>
  );
}

export default SimplifiedTooltipExample;
