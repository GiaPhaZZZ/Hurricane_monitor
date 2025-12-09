/**
 * StormTooltip Example Usage
 * 
 * Demonstrates how to integrate StormTooltip with HurricaneMarker
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { HurricaneMarker, type StormPoint } from './HurricaneMarker';
import { StormTooltip } from './StormTooltip';
import 'leaflet/dist/leaflet.css';

/**
 * Example storm data
 */
const exampleStormData: StormPoint = {
  timestamp: Date.now(),
  lat: 16.5,
  lng: 110.0,
  windSpeed: 150,
  pressure: 950,
  category: 'Category 3',
};

const nextPosition: StormPoint = {
  timestamp: Date.now() + 6 * 60 * 60 * 1000,
  lat: 17.0,
  lng: 109.5,
  windSpeed: 155,
  pressure: 948,
  category: 'Category 3',
};

/**
 * Example component showing StormTooltip integration
 */
export function StormTooltipExample() {
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MapContainer
        center={[16.5, 110.0]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hurricane marker with tooltip */}
        <HurricaneMarker
          position={exampleStormData}
          nextPosition={nextPosition}
          isPulsing={true}
        >
          <StormTooltip
            stormName="Bão Yagi"
            stormData={exampleStormData}
          />
        </HurricaneMarker>

        {/* Example with permanent tooltip */}
        <HurricaneMarker
          position={{
            ...exampleStormData,
            lat: 15.5,
            lng: 111.0,
            category: 'Category 5',
            windSpeed: 200,
            pressure: 920,
          }}
          isPulsing={false}
        >
          <StormTooltip
            stormName="Bão Mạnh"
            stormData={{
              ...exampleStormData,
              lat: 15.5,
              lng: 111.0,
              category: 'Category 5',
              windSpeed: 200,
              pressure: 920,
            }}
            permanent={true}
          />
        </HurricaneMarker>
      </MapContainer>
    </div>
  );
}

export default StormTooltipExample;
