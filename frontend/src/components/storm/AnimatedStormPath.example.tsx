/**
 * AnimatedStormPath Component Example
 * 
 * Demonstrates usage of the AnimatedStormPath component with sample storm data.
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { AnimatedStormPath } from './AnimatedStormPath';
import type { StormPoint } from '../../lib/stormData';
import 'leaflet/dist/leaflet.css';

/**
 * Sample storm data for demonstration
 */
const sampleStormPoints: StormPoint[] = [
  {
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    lat: 15.5,
    lng: 110.0,
    windSpeed: 65,
    pressure: 990,
    category: 'Áp thấp nhiệt đới',
  },
  {
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    lat: 16.0,
    lng: 109.5,
    windSpeed: 85,
    pressure: 985,
    category: 'Bão cấp 1',
  },
  {
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    lat: 16.5,
    lng: 109.0,
    windSpeed: 110,
    pressure: 975,
    category: 'Bão cấp 2',
  },
  {
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    lat: 17.0,
    lng: 108.5,
    windSpeed: 140,
    pressure: 960,
    category: 'Bão cấp 3',
  },
  {
    timestamp: Date.now(),
    lat: 17.5,
    lng: 108.0,
    windSpeed: 165,
    pressure: 945,
    category: 'Bão cấp 4',
  },
];

/**
 * Example component demonstrating AnimatedStormPath
 */

export function AnimatedStormPathExample() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <MapContainer
        center={[16.5, 109.0]}
        zoom={7}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Animated storm path with auto-play */}
        <AnimatedStormPath
          stormName="Bão Yagi"
          stormId="yagi-example"
          points={sampleStormPoints}
          isHistorical={true}
          autoPlay={true}
          onComplete={() => console.log('Animation completed!')}
        />
      </MapContainer>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>AnimatedStormPath Features:</h3>
        <ul>
          <li>✅ Progressive track drawing over 3 seconds</li>
          <li>✅ Smooth marker interpolation at 60fps</li>
          <li>✅ Timestamp labels at key points</li>
          <li>✅ Easing function for natural acceleration/deceleration</li>
          <li>✅ Animation state management (playing, paused, completed)</li>
          <li>✅ All markers shown when animation completes</li>
        </ul>

        <h4>Configuration Options:</h4>
        <ul>
          <li><strong>autoPlay:</strong> Start animation automatically on mount</li>
          <li><strong>config.duration:</strong> Total animation duration (default: 3000ms)</li>
          <li><strong>config.easing:</strong> Easing function ('linear', 'ease-in-out', 'ease-out')</li>
          <li><strong>config.showTimestamps:</strong> Display timestamp labels (default: true)</li>
          <li><strong>config.timestampInterval:</strong> Show timestamp every N points (default: 5)</li>
          <li><strong>onComplete:</strong> Callback when animation finishes</li>
        </ul>
      </div>
    </div>
  );
}

export default AnimatedStormPathExample;
