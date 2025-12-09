/**
 * HurricaneMarker Usage Example
 * 
 * Demonstrates how to use the HurricaneMarker component with various configurations.
 */

import { MapContainer, TileLayer, Popup } from 'react-leaflet';
import { HurricaneMarker, type StormPoint } from './HurricaneMarker';
import 'leaflet/dist/leaflet.css';

/**
 * Example storm points for demonstration
 */
const exampleStormPoints: StormPoint[] = [
  {
    timestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
    lat: 15.5,
    lng: 110.0,
    windSpeed: 85,
    pressure: 985,
    category: 'Bão cấp 1',
  },
  {
    timestamp: Date.now(),
    lat: 16.0,
    lng: 110.5,
    windSpeed: 120,
    pressure: 970,
    category: 'Bão cấp 2',
  },
  {
    timestamp: Date.now() + 6 * 60 * 60 * 1000, // 6 hours from now
    lat: 16.5,
    lng: 111.0,
    windSpeed: 150,
    pressure: 955,
    category: 'Bão cấp 3',
  },
];

/**
 * Example component showing HurricaneMarker usage
 */
export function HurricaneMarkerExample() {
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer
        center={[16.0, 110.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Example 1: Basic marker without pulsing */}
        <HurricaneMarker
          position={exampleStormPoints[0]}
          nextPosition={exampleStormPoints[1]}
        >
          <Popup>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Historical Position
              </h3>
              <p><strong>Time:</strong> {new Date(exampleStormPoints[0].timestamp).toLocaleString()}</p>
              <p><strong>Wind Speed:</strong> {exampleStormPoints[0].windSpeed} km/h</p>
              <p><strong>Pressure:</strong> {exampleStormPoints[0].pressure} hPa</p>
              <p><strong>Category:</strong> {exampleStormPoints[0].category}</p>
            </div>
          </Popup>
        </HurricaneMarker>
        
        {/* Example 2: Current position with pulsing animation */}
        <HurricaneMarker
          position={exampleStormPoints[1]}
          nextPosition={exampleStormPoints[2]}
          isPulsing={true}
        >
          <Popup>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Current Position (Pulsing)
              </h3>
              <p><strong>Time:</strong> {new Date(exampleStormPoints[1].timestamp).toLocaleString()}</p>
              <p><strong>Wind Speed:</strong> {exampleStormPoints[1].windSpeed} km/h</p>
              <p><strong>Pressure:</strong> {exampleStormPoints[1].pressure} hPa</p>
              <p><strong>Category:</strong> {exampleStormPoints[1].category}</p>
            </div>
          </Popup>
        </HurricaneMarker>
        
        {/* Example 3: Forecast position with custom size */}
        <HurricaneMarker
          position={exampleStormPoints[2]}
          size={35}
        >
          <Popup>
            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Forecast Position
              </h3>
              <p><strong>Time:</strong> {new Date(exampleStormPoints[2].timestamp).toLocaleString()}</p>
              <p><strong>Wind Speed:</strong> {exampleStormPoints[2].windSpeed} km/h</p>
              <p><strong>Pressure:</strong> {exampleStormPoints[2].pressure} hPa</p>
              <p><strong>Category:</strong> {exampleStormPoints[2].category}</p>
            </div>
          </Popup>
        </HurricaneMarker>
      </MapContainer>
      
      <div style={{ padding: '16px', background: '#f5f5f5', marginTop: '16px' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Usage Notes:</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Marker size automatically scales with wind speed (20-40px)</li>
          <li>Icon rotates based on bearing between consecutive points</li>
          <li>Set <code>isPulsing=true</code> for 2-second pulsing animation</li>
          <li>Color automatically matches storm category</li>
          <li>White 2px border included for visibility</li>
          <li>SVG icon ensures crisp display at all zoom levels</li>
        </ul>
      </div>
    </div>
  );
}

export default HurricaneMarkerExample;
