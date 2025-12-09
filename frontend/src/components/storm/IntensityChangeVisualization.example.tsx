/**
 * IntensityChangeVisualization Example
 * 
 * Demonstrates storm intensity change visualization features including:
 * - Dynamic marker size updates based on wind speed
 * - Smooth color transitions when storm category changes
 * - Glow animation when storm intensifies
 * - Larger markers for major hurricanes (Category 3+)
 * - Proper color scale from blue (TD) through yellow, orange, to red (Cat 5)
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { HurricaneMarker } from './HurricaneMarker';
import { GradientStormTrack } from './GradientStormTrack';
import type { StormPoint } from '../../lib/stormData';
import 'leaflet/dist/leaflet.css';

/**
 * Example storm track showing intensity changes
 * Progresses from Tropical Storm to Category 5 Hurricane
 */
const intensifyingStormTrack: StormPoint[] = [
  {
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    lat: 15.0,
    lng: 110.0,
    windSpeed: 65,
    pressure: 1000,
    category: 'TS', // Tropical Storm - Blue
  },
  {
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    lat: 15.5,
    lng: 110.5,
    windSpeed: 120,
    pressure: 985,
    category: 'C1', // Category 1 - Yellow
  },
  {
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    lat: 16.0,
    lng: 111.0,
    windSpeed: 155,
    pressure: 970,
    category: 'C2', // Category 2 - Orange
  },
  {
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    lat: 16.5,
    lng: 111.5,
    windSpeed: 180,
    pressure: 955,
    category: 'C3', // Category 3 - Red (Major Hurricane)
  },
  {
    timestamp: Date.now(),
    lat: 17.0,
    lng: 112.0,
    windSpeed: 210,
    pressure: 935,
    category: 'C4', // Category 4 - Dark Red (Major Hurricane)
  },
  {
    timestamp: Date.now() + 6 * 60 * 60 * 1000,
    lat: 17.5,
    lng: 112.5,
    windSpeed: 250,
    pressure: 915,
    category: 'C5', // Category 5 - Purple (Major Hurricane)
  },
];

/**
 * Example storm track showing weakening
 * Progresses from Category 4 to Tropical Depression
 */
const weakeningStormTrack: StormPoint[] = [
  {
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    lat: 18.0,
    lng: 115.0,
    windSpeed: 220,
    pressure: 930,
    category: 'C4', // Category 4 - Dark Red
  },
  {
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    lat: 18.5,
    lng: 115.5,
    windSpeed: 175,
    pressure: 950,
    category: 'C3', // Category 3 - Red
  },
  {
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    lat: 19.0,
    lng: 116.0,
    windSpeed: 140,
    pressure: 975,
    category: 'C2', // Category 2 - Orange
  },
  {
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    lat: 19.5,
    lng: 116.5,
    windSpeed: 110,
    pressure: 990,
    category: 'C1', // Category 1 - Yellow
  },
  {
    timestamp: Date.now(),
    lat: 20.0,
    lng: 117.0,
    windSpeed: 75,
    pressure: 1000,
    category: 'TS', // Tropical Storm - Blue
  },
  {
    timestamp: Date.now() + 6 * 60 * 60 * 1000,
    lat: 20.5,
    lng: 117.5,
    windSpeed: 45,
    pressure: 1008,
    category: 'TD', // Tropical Depression - Green
  },
];

/**
 * IntensityChangeVisualization Example Component
 */
export function IntensityChangeVisualizationExample() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <h2 style={{ padding: '10px', margin: 0, background: '#f0f0f0' }}>
        Storm Intensity Change Visualization
      </h2>
      
      <div style={{ padding: '10px', background: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Features Demonstrated:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
          <li><strong>Dynamic Marker Size:</strong> Markers grow with wind speed (20-40px range)</li>
          <li><strong>Major Hurricane Boost:</strong> Category 3+ storms have larger markers (10% boost, min 32px)</li>
          <li><strong>Smooth Color Transitions:</strong> Colors interpolate smoothly between categories</li>
          <li><strong>Glow Animation:</strong> Brief glow effect when storm intensifies</li>
          <li><strong>Color Scale:</strong> Blue (TD) → Yellow (C1) → Orange (C2) → Red (C3) → Dark Red (C4) → Purple (C5)</li>
        </ul>
      </div>

      <MapContainer
        center={[17.5, 113.5]}
        zoom={6}
        style={{ width: '100%', height: 'calc(100% - 140px)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Intensifying Storm Track (Left) */}
        <GradientStormTrack
          points={intensifyingStormTrack}
          isHistorical={true}
          isAnimating={false}
          animationProgress={1}
        />

        {/* Intensifying Storm Markers */}
        {intensifyingStormTrack.map((point, index) => (
          <HurricaneMarker
            key={`intensifying-${index}`}
            position={point}
            nextPosition={intensifyingStormTrack[index + 1]}
            previousPosition={intensifyingStormTrack[index - 1]}
            isPulsing={index === intensifyingStormTrack.length - 1}
            useIntensitySize={true}
            showIntensityGlow={index > 0 && point.windSpeed > intensifyingStormTrack[index - 1].windSpeed}
          />
        ))}

        {/* Weakening Storm Track (Right) */}
        <GradientStormTrack
          points={weakeningStormTrack}
          isHistorical={true}
          isAnimating={false}
          animationProgress={1}
        />

        {/* Weakening Storm Markers */}
        {weakeningStormTrack.map((point, index) => (
          <HurricaneMarker
            key={`weakening-${index}`}
            position={point}
            nextPosition={weakeningStormTrack[index + 1]}
            previousPosition={weakeningStormTrack[index - 1]}
            isPulsing={index === weakeningStormTrack.length - 1}
            useIntensitySize={true}
            showIntensityGlow={false}
          />
        ))}
      </MapContainer>

      <div style={{ padding: '10px', background: '#f9f9f9', borderTop: '1px solid #ddd', fontSize: '12px' }}>
        <strong>Left Track:</strong> Intensifying storm (TS → C5) with glow animations
        <br />
        <strong>Right Track:</strong> Weakening storm (C4 → TD) showing size reduction
      </div>
    </div>
  );
}

export default IntensityChangeVisualizationExample;
