/**
 * WindStrengthCircles Component Examples
 * 
 * Demonstrates usage of the WindStrengthCircles component with various storm intensities.
 */

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { WindStrengthCircles } from './WindStrengthCircles';
import { HurricaneMarker } from './HurricaneMarker';
import 'leaflet/dist/leaflet.css';

/**
 * Example 1: Tropical Storm (34-63 knots)
 * Shows 1-2 circles for tropical storm force winds
 */
export function TropicalStormExample() {
  const center = { lat: 25.0, lng: -80.0 };
  const stormPoint = {
    timestamp: Date.now(),
    lat: 25.0,
    lng: -80.0,
    windSpeed: 45, // knots
    pressure: 1000,
    category: 'TS',
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={6}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <WindStrengthCircles
        center={center}
        windSpeed={stormPoint.windSpeed}
        category={stormPoint.category}
        visible={true}
      />
      
      <HurricaneMarker
        position={stormPoint}
        isPulsing={true}
      />
    </MapContainer>
  );
}

/**
 * Example 2: Category 2 Hurricane (83-95 knots)
 * Shows 3 circles (34kt, 50kt, 64kt)
 */
export function Category2HurricaneExample() {
  const center = { lat: 28.0, lng: -85.0 };
  const stormPoint = {
    timestamp: Date.now(),
    lat: 28.0,
    lng: -85.0,
    windSpeed: 90, // knots
    pressure: 965,
    category: 'H2',
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={6}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <WindStrengthCircles
        center={center}
        windSpeed={stormPoint.windSpeed}
        category={stormPoint.category}
        visible={true}
      />
      
      <HurricaneMarker
        position={stormPoint}
        isPulsing={true}
      />
    </MapContainer>
  );
}

/**
 * Example 3: Category 5 Hurricane (>137 knots)
 * Shows 4 circles (34kt, 50kt, 64kt, 100kt)
 */
export function Category5HurricaneExample() {
  const center = { lat: 26.0, lng: -90.0 };
  const stormPoint = {
    timestamp: Date.now(),
    lat: 26.0,
    lng: -90.0,
    windSpeed: 150, // knots
    pressure: 920,
    category: 'H5',
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={6}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <WindStrengthCircles
        center={center}
        windSpeed={stormPoint.windSpeed}
        category={stormPoint.category}
        visible={true}
      />
      
      <HurricaneMarker
        position={stormPoint}
        isPulsing={true}
      />
    </MapContainer>
  );
}

/**
 * Example 4: With Custom Wind Radii
 * Uses actual wind radii data from API instead of calculated values
 */
export function CustomWindRadiiExample() {
  const center = { lat: 30.0, lng: -88.0 };
  const stormPoint = {
    timestamp: Date.now(),
    lat: 30.0,
    lng: -88.0,
    windSpeed: 110, // knots
    pressure: 945,
    category: 'H4',
  };

  // Custom wind radii from API (in kilometers)
  const windRadii = {
    kt34: 250,  // 34-knot winds extend 250km
    kt50: 150,  // 50-knot winds extend 150km
    kt64: 100,  // 64-knot winds extend 100km
    kt100: 50,  // 100-knot winds extend 50km
  };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={6}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      <WindStrengthCircles
        center={center}
        windSpeed={stormPoint.windSpeed}
        category={stormPoint.category}
        windRadii={windRadii}
        visible={true}
      />
      
      <HurricaneMarker
        position={stormPoint}
        isPulsing={true}
      />
    </MapContainer>
  );
}

/**
 * Example 5: Hidden During Animation
 * Demonstrates circles being hidden while storm is animating
 */
export function AnimationHiddenExample() {
  const [isAnimating, setIsAnimating] = React.useState(true);
  
  const center = { lat: 27.0, lng: -82.0 };
  const stormPoint = {
    timestamp: Date.now(),
    lat: 27.0,
    lng: -82.0,
    windSpeed: 75, // knots
    pressure: 980,
    category: 'H1',
  };

  return (
    <div>
      <button
        onClick={() => setIsAnimating(!isAnimating)}
        style={{
          padding: '8px 16px',
          marginBottom: '8px',
          cursor: 'pointer',
        }}
      >
        {isAnimating ? 'Stop Animation (Show Circles)' : 'Start Animation (Hide Circles)'}
      </button>
      
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={6}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <WindStrengthCircles
          center={center}
          windSpeed={stormPoint.windSpeed}
          category={stormPoint.category}
          isAnimating={isAnimating}
          visible={true}
        />
        
        <HurricaneMarker
          position={stormPoint}
          isPulsing={!isAnimating}
        />
      </MapContainer>
    </div>
  );
}

/**
 * Example 6: Intensity Change Demonstration
 * Shows smooth radius transitions when wind speed changes
 */
export function IntensityChangeExample() {
  const [windSpeed, setWindSpeed] = React.useState(50);
  
  const center = { lat: 29.0, lng: -87.0 };
  const stormPoint = {
    timestamp: Date.now(),
    lat: 29.0,
    lng: -87.0,
    windSpeed: windSpeed,
    pressure: 1000 - windSpeed,
    category: windSpeed < 64 ? 'TS' : windSpeed < 83 ? 'H1' : windSpeed < 96 ? 'H2' : 'H3',
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <label>
          Wind Speed: {windSpeed} knots
          <input
            type="range"
            min="34"
            max="150"
            value={windSpeed}
            onChange={(e) => setWindSpeed(Number(e.target.value))}
            style={{ marginLeft: '8px', width: '200px' }}
          />
        </label>
      </div>
      
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={6}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <WindStrengthCircles
          center={center}
          windSpeed={stormPoint.windSpeed}
          category={stormPoint.category}
          visible={true}
        />
        
        <HurricaneMarker
          position={stormPoint}
          isPulsing={true}
        />
      </MapContainer>
    </div>
  );
}

export default {
  TropicalStormExample,
  Category2HurricaneExample,
  Category5HurricaneExample,
  CustomWindRadiiExample,
  AnimationHiddenExample,
  IntensityChangeExample,
};
