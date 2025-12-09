/**
 * WindParticleCanvas Example
 * 
 * Demonstrates usage of the WindParticleCanvas component with mock wind data.
 * This example shows how to integrate the wind particle system into a map.
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import WindParticleCanvas from './WindParticleCanvas';
import type { WindField } from './types';
import 'leaflet/dist/leaflet.css';

// Mock wind field data for demonstration
const mockWindField: WindField = {
  width: 50,
  height: 50,
  uComponent: new Float32Array(2500).map(() => (Math.random() - 0.5) * 20),
  vComponent: new Float32Array(2500).map(() => (Math.random() - 0.5) * 20),
  bounds: {
    north: 23.5,
    south: 8.0,
    east: 110.0,
    west: 102.0,
  },
  timestamp: Date.now(),
};

export default function WindParticleCanvasExample() {
  return (
    <div className="h-screen w-screen">
      <MapContainer
        center={[15.75, 106.0]}
        zoom={6}
        className="h-full w-full"
      >
        <TileLayer
          attribution="© Google Satellite"
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        />

        {/* Wind Particle Canvas */}
        <WindParticleCanvas
          windData={mockWindField}
          particleCount={3000}
          isVisible={true}
          opacity={0.8}
          colorScheme="default"
        />
      </MapContainer>

      {/* Info Panel */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000]">
        <h3 className="font-bold text-sm mb-2">Wind Particle System</h3>
        <div className="text-xs space-y-1">
          <p>• 3000 particles</p>
          <p>• Velocity-based coloring</p>
          <p>• Adaptive performance scaling</p>
          <p>• 60 FPS target</p>
        </div>
      </div>
    </div>
  );
}
