/**
 * Type definitions for wind particle system
 */

/**
 * Wind field data structure containing wind vectors
 */
export interface WindField {
  width: number;
  height: number;
  uComponent: Float32Array; // East-west wind component (m/s)
  vComponent: Float32Array; // North-south wind component (m/s)
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  timestamp: number;
}

/**
 * Individual particle in the wind visualization
 */
export interface Particle {
  x: number; // Screen x coordinate
  y: number; // Screen y coordinate
  lat: number; // Geographic latitude
  lng: number; // Geographic longitude
  age: number; // Current age in frames
  maxAge: number; // Maximum age before respawn
  speed: number; // Wind speed at particle location (km/h)
  vx: number; // Velocity x component
  vy: number; // Velocity y component
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  particleCount: number;
  lastAdjustmentTime: number;
}

/**
 * Wind vector at a specific location
 */
export interface WindVector {
  u: number; // East-west component (m/s)
  v: number; // North-south component (m/s)
  speed: number; // Wind speed (km/h)
}

/**
 * Spatial grid cell for efficient wind vector lookups
 */
export interface GridCell {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  windVectors: WindVector[];
}
