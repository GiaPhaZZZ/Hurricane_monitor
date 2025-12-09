/**
 * GradientStormTrack Example
 * 
 * Demonstrates usage of the GradientStormTrack component with sample storm data.
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { GradientStormTrack, type StormPoint } from './GradientStormTrack';
import 'leaflet/dist/leaflet.css';

// Sample storm data with varying categories
const sampleHistoricalPoints: StormPoint[] = [
  {
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    lat: 15.0,
    lng: 110.0,
    windSpeed: 50,
    pressure: 1000,
    category: 'Áp thấp nhiệt đới',
  },
  {
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    lat: 15.5,
    lng: 110.5,
    windSpeed: 70,
    pressure: 995,
    category: 'Bão cấp 1',
  },
  {
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    lat: 16.0,
    lng: 111.0,
    windSpeed: 100,
    pressure: 985,
    category: 'Bão cấp 2',
  },
  {
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    lat: 16.5,
    lng: 111.5,
    windSpeed: 130,
    pressure: 975,
    category: 'Bão cấp 3',
  },
];

const sampleForecastPoints: StormPoint[] = [
  {
    timestamp: Date.now(),
    lat: 17.0,
    lng: 112.0,
    windSpeed: 150,
    pressure: 970,
    category: 'Bão cấp 4',
  },
  {
    timestamp: Date.now() + 6 * 60 * 60 * 1000,
    lat: 17.5,
    lng: 112.5,
    windSpeed: 170,
    pressure: 960,
    category: 'Siêu bão',
  },
  {
    timestamp: Date.now() + 12 * 60 * 60 * 1000,
    lat: 18.0,
    lng: 113.0,
    windSpeed: 160,
    pressure: 965,
    category: 'Bão cấp 4',
  },
  {
    timestamp: Date.now() + 18 * 60 * 60 * 1000,
    lat: 18.5,
    lng: 113.5,
    windSpeed: 140,
    pressure: 972,
    category: 'Bão cấp 3',
  },
];

/**
 * Example component showing GradientStormTrack usage
 */
export function GradientStormTrackExample() {
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer
        center={[16.5, 111.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Historical track - solid line with 80% opacity */}
        <GradientStormTrack
          points={sampleHistoricalPoints}
          isHistorical={true}
        />

        {/* Forecast track - dashed line with 60% opacity */}
        <GradientStormTrack
          points={sampleForecastPoints}
          isHistorical={false}
        />
      </MapContainer>

      <div style={{ padding: '20px', background: '#f5f5f5' }}>
        <h3>GradientStormTrack Features:</h3>
        <ul>
          <li>✓ Smooth color gradients based on storm category</li>
          <li>✓ Historical track: solid line, 80% opacity</li>
          <li>✓ Forecast track: dashed line, 60% opacity</li>
          <li>✓ Glow effect with white shadow</li>
          <li>✓ 4px line width with smooth joins</li>
          <li>✓ Color interpolation between adjacent points</li>
        </ul>
      </div>
    </div>
  );
}

export default GradientStormTrackExample;
