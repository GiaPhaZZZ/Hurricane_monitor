/**
 * SimplifiedTooltip Advanced Example
 * 
 * Demonstrates closest-point detection with multiple nearby storm points
 */

import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import { SimplifiedTooltip } from './SimplifiedTooltip';
import { useSimplifiedTooltip } from '../../hooks/useSimplifiedTooltip';
import 'leaflet/dist/leaflet.css';

/**
 * Multiple storm tracks with nearby points
 */
const stormTracks = {
  yagi: [
    {
      timestamp: new Date('2024-09-07T00:00:00Z').getTime(),
      lat: 16.0,
      lng: 110.5,
      windSpeed: 120,
      pressure: 970,
      category: 'Category 2',
    },
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
  ],
  bebinca: [
    {
      timestamp: new Date('2024-09-07T00:00:00Z').getTime(),
      lat: 16.2,
      lng: 110.3,
      windSpeed: 100,
      pressure: 985,
      category: 'Category 1',
    },
    {
      timestamp: new Date('2024-09-07T06:00:00Z').getTime(),
      lat: 16.7,
      lng: 109.8,
      windSpeed: 110,
      pressure: 980,
      category: 'Category 2',
    },
    {
      timestamp: new Date('2024-09-07T12:00:00Z').getTime(),
      lat: 17.2,
      lng: 109.3,
      windSpeed: 125,
      pressure: 975,
      category: 'Category 2',
    },
  ],
};

/**
 * Interactive map with multiple storm tracks
 */
function InteractiveMultiStormMap() {
  const { tooltipState, showTooltip, hideTooltip, updatePosition } = useSimplifiedTooltip();

  // Track mouse movement
  useMapEvents({
    mousemove: (e) => {
      updatePosition({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
      });
    },
  });

  return (
    <>
      {/* Render Yagi track points */}
      {stormTracks.yagi.map((point, index) => (
        <CircleMarker
          key={`yagi-${index}`}
          center={[point.lat, point.lng]}
          radius={6}
          pathOptions={{
            color: 'white',
            fillColor: '#ef4444',
            fillOpacity: 0.8,
            weight: 2,
          }}
          eventHandlers={{
            mouseover: (e) => {
              showTooltip(
                point,
                {
                  x: e.originalEvent.clientX,
                  y: e.originalEvent.clientY,
                },
                `yagi-${index}`
              );
            },
            mouseout: () => {
              hideTooltip(`yagi-${index}`);
            },
          }}
        />
      ))}

      {/* Render Bebinca track points */}
      {stormTracks.bebinca.map((point, index) => (
        <CircleMarker
          key={`bebinca-${index}`}
          center={[point.lat, point.lng]}
          radius={6}
          pathOptions={{
            color: 'white',
            fillColor: '#3b82f6',
            fillOpacity: 0.8,
            weight: 2,
          }}
          eventHandlers={{
            mouseover: (e) => {
              showTooltip(
                point,
                {
                  x: e.originalEvent.clientX,
                  y: e.originalEvent.clientY,
                },
                `bebinca-${index}`
              );
            },
            mouseout: () => {
              hideTooltip(`bebinca-${index}`);
            },
          }}
        />
      ))}

      {/* Render tooltip for closest point */}
      {tooltipState.isVisible && tooltipState.stormData && (
        <SimplifiedTooltip
          stormData={tooltipState.stormData}
          position={tooltipState.position}
          isVisible={tooltipState.isVisible}
        />
      )}
    </>
  );
}

/**
 * Advanced example showing closest-point detection
 */
export function SimplifiedTooltipAdvancedExample() {
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer
        center={[16.6, 110.0]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InteractiveMultiStormMap />
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
        maxWidth: '300px',
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>
          Closest-Point Detection Demo
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
          Hover over nearby markers (red = Yagi, blue = Bebinca). 
          The tooltip automatically shows data for the closest point to your cursor.
        </p>
      </div>
    </div>
  );
}

export default SimplifiedTooltipAdvancedExample;
