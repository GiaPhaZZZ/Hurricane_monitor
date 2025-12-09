/**
 * WindLayerController Usage Example
 * 
 * Demonstrates how to integrate the wind particle layer with loading states and error handling.
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { WindLayerController } from './index';
import type { WindDataError } from './WindFieldManager';
import { useState } from 'react';

export default function WindLayerControllerExample() {
  const [isWindLayerVisible, setIsWindLayerVisible] = useState(true);
  const [windOpacity, setWindOpacity] = useState(0.8);
  const [colorScheme, setColorScheme] = useState<'default' | 'monochrome'>('default');

  const handleWindError = (error: WindDataError) => {
    console.error('Wind layer error:', error);
    
    // You can show a toast notification or handle the error in other ways
    if (error.type === 'api_key_missing') {
      console.log('API key not configured, using demo data');
    } else if (error.type === 'offline') {
      console.log('Device is offline, using cached data');
    } else if (error.type === 'fetch_failed') {
      console.error('Failed to fetch wind data:', error.message);
    }
  };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      {/* Controls */}
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>
        <label style={{ marginRight: '16px' }}>
          <input
            type="checkbox"
            checked={isWindLayerVisible}
            onChange={(e) => setIsWindLayerVisible(e.target.checked)}
          />
          {' '}Show Wind Layer
        </label>

        <label style={{ marginRight: '16px' }}>
          Opacity:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={windOpacity}
            onChange={(e) => setWindOpacity(parseFloat(e.target.value))}
            style={{ marginLeft: '8px' }}
          />
          {' '}{Math.round(windOpacity * 100)}%
        </label>

        <label>
          Color Scheme:
          <select
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value as 'default' | 'monochrome')}
            style={{ marginLeft: '8px' }}
          >
            <option value="default">Default</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </label>
      </div>

      {/* Map */}
      <MapContainer
        center={[25.0, -80.0]}
        zoom={6}
        style={{ width: '100%', height: 'calc(100% - 60px)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Wind Layer with Loading States and Error Handling */}
        <WindLayerController
          isVisible={isWindLayerVisible}
          opacity={windOpacity}
          colorScheme={colorScheme}
          particleCount={3000}
          onError={handleWindError}
        />
      </MapContainer>
    </div>
  );
}

/**
 * Integration Notes:
 * 
 * 1. API Key Configuration:
 *    - Set VITE_OPENWEATHER_API_KEY in your .env file
 *    - Get a free API key from https://openweathermap.org/api
 *    - Without an API key, the component will use demo wind data
 * 
 * 2. Loading States:
 *    - Shows a loading spinner when fetching wind data for the first time
 *    - Non-blocking: subsequent fetches happen in the background
 * 
 * 3. Error Handling:
 *    - API key missing: Shows info notification, uses demo data
 *    - Offline: Shows offline notification, uses cached data
 *    - Fetch failed: Shows error notification, falls back to cached/demo data
 *    - All errors are logged to console for debugging
 * 
 * 4. Automatic Refresh:
 *    - Wind data refreshes every 10 minutes automatically
 *    - Also refreshes when map bounds change significantly
 * 
 * 5. Performance:
 *    - Particle count adapts based on device capabilities
 *    - Animation pauses when map is not visible
 *    - Uses stale-while-revalidate caching pattern
 */
