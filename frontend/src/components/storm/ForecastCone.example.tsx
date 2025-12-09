/**
 * ForecastCone Component Example
 * 
 * Demonstrates usage of the ForecastCone component with sample storm data
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { ForecastCone, type StormPoint } from './ForecastCone';
import { HurricaneMarker } from './HurricaneMarker';
import { GradientStormTrack } from './GradientStormTrack';
import 'leaflet/dist/leaflet.css';

/**
 * Example forecast cone visualization
 */
export function ForecastConeExample() {
  // Current storm position
  const currentPosition: StormPoint = {
    timestamp: Date.now(),
    lat: 15.5,
    lng: 110.0,
    windSpeed: 150,
    pressure: 950,
    category: 'C3',
  };

  // Forecast points (24, 48, 72 hours)
  const forecastPoints: StormPoint[] = [
    {
      timestamp: Date.now() + 24 * 60 * 60 * 1000,
      lat: 16.0,
      lng: 109.0,
      windSpeed: 160,
      pressure: 945,
      category: 'C3',
    },
    {
      timestamp: Date.now() + 48 * 60 * 60 * 1000,
      lat: 16.8,
      lng: 108.0,
      windSpeed: 170,
      pressure: 940,
      category: 'C4',
    },
    {
      timestamp: Date.now() + 72 * 60 * 60 * 1000,
      lat: 17.5,
      lng: 107.0,
      windSpeed: 165,
      pressure: 942,
      category: 'C4',
    },
  ];

  // Alternative forecast scenarios (optional)
  const alternativeScenarios: StormPoint[][] = [
    [
      {
        timestamp: Date.now() + 24 * 60 * 60 * 1000,
        lat: 15.8,
        lng: 109.2,
        windSpeed: 155,
        pressure: 948,
        category: 'C3',
      },
      {
        timestamp: Date.now() + 48 * 60 * 60 * 1000,
        lat: 16.5,
        lng: 108.5,
        windSpeed: 165,
        pressure: 943,
        category: 'C3',
      },
      {
        timestamp: Date.now() + 72 * 60 * 60 * 1000,
        lat: 17.2,
        lng: 107.5,
        windSpeed: 160,
        pressure: 945,
        category: 'C3',
      },
    ],
  ];

  // Historical track points
  const historicalPoints: StormPoint[] = [
    {
      timestamp: Date.now() - 48 * 60 * 60 * 1000,
      lat: 13.0,
      lng: 112.0,
      windSpeed: 120,
      pressure: 970,
      category: 'C1',
    },
    {
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
      lat: 14.0,
      lng: 111.0,
      windSpeed: 140,
      pressure: 960,
      category: 'C2',
    },
    currentPosition,
  ];

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <MapContainer
        center={[15.5, 109.0]}
        zoom={7}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Historical track */}
        <GradientStormTrack
          points={historicalPoints}
          isHistorical={true}
        />

        {/* Forecast track */}
        <GradientStormTrack
          points={[currentPosition, ...forecastPoints]}
          isHistorical={false}
        />

        {/* Forecast cone */}
        <ForecastCone
          currentPosition={currentPosition}
          forecastPoints={forecastPoints}
          alternativeScenarios={alternativeScenarios}
        />

        {/* Current position marker */}
        <HurricaneMarker
          position={currentPosition}
          nextPosition={forecastPoints[0]}
          isPulsing={true}
        />

        {/* Forecast markers */}
        {forecastPoints.map((point, index) => (
          <HurricaneMarker
            key={index}
            position={point}
            nextPosition={forecastPoints[index + 1]}
            isPulsing={false}
          />
        ))}
      </MapContainer>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Forecast Cone Features:</h3>
        <ul>
          <li>Cone width increases by 50 nautical miles per 24-hour forecast period</li>
          <li>White dashed border (2px width, [10, 5] dash pattern)</li>
          <li>Gradient fill from 25% opacity at current position to 5% at end</li>
          <li>Encompasses multiple forecast scenarios when provided</li>
          <li>Uses geodesic calculations for accurate cone geometry</li>
        </ul>
        
        <h4>Current Storm Data:</h4>
        <ul>
          <li>Position: {currentPosition.lat.toFixed(2)}°N, {currentPosition.lng.toFixed(2)}°E</li>
          <li>Category: {currentPosition.category}</li>
          <li>Wind Speed: {currentPosition.windSpeed} km/h</li>
          <li>Pressure: {currentPosition.pressure} mb</li>
        </ul>
      </div>
    </div>
  );
}

export default ForecastConeExample;
