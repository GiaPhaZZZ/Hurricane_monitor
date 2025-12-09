/**
 * CurrentPositionMarker Example
 * 
 * Demonstrates the CurrentPositionMarker component with various configurations.
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { CurrentPositionMarker } from './CurrentPositionMarker';
import type { StormPoint } from './CurrentPositionMarker';
import 'leaflet/dist/leaflet.css';

/**
 * Example storm current position data
 */
const exampleCurrentPosition: StormPoint = {
  timestamp: Date.now(),
  lat: 16.5,
  lng: 110.0,
  windSpeed: 120,
  pressure: 960,
  category: 'Bão cấp 3',
};

const exampleCurrentPosition2: StormPoint = {
  timestamp: Date.now() - 3600000, // 1 hour ago
  lat: 18.0,
  lng: 112.0,
  windSpeed: 150,
  pressure: 945,
  category: 'Bão cấp 4',
};

const exampleCurrentPosition3: StormPoint = {
  timestamp: Date.now() - 7200000, // 2 hours ago
  lat: 14.0,
  lng: 108.0,
  windSpeed: 80,
  pressure: 985,
  category: 'Bão cấp 1',
};

/**
 * CurrentPositionMarker Example Component
 */
export function CurrentPositionMarkerExample() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Current Position Marker Examples</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Example 1: Category 3 Storm with Label</h2>
        <p>Shows the current position marker with full label including storm name</p>
        <MapContainer
          center={[16.5, 110.0]}
          zoom={7}
          style={{ height: '400px', width: '100%', marginTop: '10px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <CurrentPositionMarker
            position={exampleCurrentPosition}
            stormName="Typhoon Yagi"
            showLabel={true}
          />
        </MapContainer>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Example 2: Category 4 Storm without Storm Name</h2>
        <p>Shows the current position marker with label but no storm name</p>
        <MapContainer
          center={[18.0, 112.0]}
          zoom={7}
          style={{ height: '400px', width: '100%', marginTop: '10px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <CurrentPositionMarker
            position={exampleCurrentPosition2}
            showLabel={true}
          />
        </MapContainer>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Example 3: Category 1 Storm without Label</h2>
        <p>Shows the current position marker without any label (marker only)</p>
        <MapContainer
          center={[14.0, 108.0]}
          zoom={7}
          style={{ height: '400px', width: '100%', marginTop: '10px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <CurrentPositionMarker
            position={exampleCurrentPosition3}
            showLabel={false}
          />
        </MapContainer>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Example 4: Multiple Current Positions</h2>
        <p>Shows multiple current position markers on the same map</p>
        <MapContainer
          center={[16.0, 110.0]}
          zoom={6}
          style={{ height: '400px', width: '100%', marginTop: '10px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          <CurrentPositionMarker
            position={exampleCurrentPosition}
            stormName="Typhoon Yagi"
            showLabel={true}
          />
          
          <CurrentPositionMarker
            position={exampleCurrentPosition2}
            stormName="Typhoon Bebinca"
            showLabel={true}
          />
          
          <CurrentPositionMarker
            position={exampleCurrentPosition3}
            stormName="Tropical Storm Soulik"
            showLabel={true}
          />
        </MapContainer>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>✓ Distinct marker design with crosshair and concentric circles</li>
          <li>✓ Pulsing animation (2-second cycle)</li>
          <li>✓ Larger size (32px) compared to regular markers (20-40px)</li>
          <li>✓ Enhanced styling with white border and shadow</li>
          <li>✓ "Current Position" label with timestamp</li>
          <li>✓ Optional storm name display</li>
          <li>✓ Color coding based on storm category</li>
          <li>✓ Smooth fade-in animation for label</li>
          <li>✓ Higher z-index to appear above other markers</li>
        </ul>
      </div>
    </div>
  );
}

export default CurrentPositionMarkerExample;
