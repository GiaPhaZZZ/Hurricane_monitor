/**
 * Storm Animation Utilities
 * 
 * Provides utility functions for smooth storm marker animations,
 * including size calculations, easing functions, and position interpolation.
 */

import type { LatLngExpression } from 'leaflet';

/**
 * Animation timing constants
 */
export const ANIMATION_CONSTANTS = {
  TOTAL_DURATION: 3000, // Total animation duration in milliseconds
  TARGET_FPS: 60, // Target frames per second
  MARKER_PULSE_DURATION: 2000, // Pulsing animation cycle duration
  TIMESTAMP_INTERVAL: 500, // Show timestamp label every 500ms
} as const;

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
  duration: number; // Total animation duration in ms
  fps: number; // Target frames per second
  easing: 'linear' | 'ease-in-out' | 'ease-out';
  showTimestamps: boolean;
  timestampInterval: number; // Show timestamp every N points
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 3000,
  fps: 60,
  easing: 'ease-in-out',
  showTimestamps: true,
  timestampInterval: 5,
};

/**
 * Marker size range constants
 */
const MIN_MARKER_SIZE = 20; // pixels
const MAX_MARKER_SIZE = 40; // pixels
const MIN_WIND_SPEED = 30; // km/h
const MAX_WIND_SPEED = 200; // km/h

/**
 * Calculate marker size based on wind speed
 * 
 * Maps wind speed to marker size in the range of 20-40 pixels.
 * Uses linear interpolation with clamping to ensure size stays within bounds.
 * 
 * @param windSpeed - Wind speed in km/h
 * @returns Marker size in pixels (20-40px range)
 * 
 * Requirements: 2.2 - Storm_Marker size proportional to wind speed
 */
export function calculateMarkerSize(windSpeed: number): number {
  // Normalize wind speed to 0-1 range
  const normalized = (windSpeed - MIN_WIND_SPEED) / (MAX_WIND_SPEED - MIN_WIND_SPEED);
  
  // Clamp to 0-1 range
  const clamped = Math.max(0, Math.min(1, normalized));
  
  // Map to marker size range
  return MIN_MARKER_SIZE + (MAX_MARKER_SIZE - MIN_MARKER_SIZE) * clamped;
}

/**
 * Ease-in-out cubic easing function
 * 
 * Provides smooth acceleration and deceleration for natural-looking animations.
 * Accelerates quickly at the start, maintains speed in the middle, and decelerates at the end.
 * 
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 * 
 * Requirements: 3.2, 6.2 - Smooth animation with easing
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Ease-out quadratic easing function
 * 
 * Provides deceleration for animations that should slow down at the end.
 * Creates a natural stopping motion.
 * 
 * @param t - Progress value between 0 and 1
 * @returns Eased value between 0 and 1
 * 
 * Requirements: 3.2, 6.2 - Smooth animation with easing
 */
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Position point interface for interpolation
 */
export interface Position {
  lat: number;
  lng: number;
}

/**
 * Interpolate position between two points
 * 
 * Performs linear interpolation between start and end positions.
 * Used for smooth marker movement along the storm track.
 * 
 * @param start - Starting position with lat/lng
 * @param end - Ending position with lat/lng
 * @param progress - Progress value between 0 and 1
 * @returns Interpolated position as [lat, lng] tuple
 * 
 * Requirements: 3.3, 6.2, 6.3 - Smooth marker movement between points at 60fps
 */
export function interpolatePosition(
  start: Position,
  end: Position,
  progress: number
): LatLngExpression {
  // Clamp progress to 0-1 range
  const t = Math.max(0, Math.min(1, progress));
  
  // Linear interpolation for latitude and longitude
  const lat = start.lat + (end.lat - start.lat) * t;
  const lng = start.lng + (end.lng - start.lng) * t;
  
  return [lat, lng];
}

/**
 * Animation state interface
 */
export interface AnimationState {
  isPlaying: boolean;
  currentSegment: number;
  segmentProgress: number; // 0-1 within current segment
  startTime: number;
  duration: number;
}

/**
 * Calculate animation progress for a given timestamp
 * 
 * @param startTime - Animation start timestamp in milliseconds
 * @param currentTime - Current timestamp in milliseconds
 * @param duration - Total animation duration in milliseconds
 * @returns Progress value between 0 and 1
 */
export function calculateAnimationProgress(
  startTime: number,
  currentTime: number,
  duration: number
): number {
  const elapsed = currentTime - startTime;
  return Math.max(0, Math.min(1, elapsed / duration));
}

/**
 * Get frame interval for target FPS
 * 
 * @param fps - Target frames per second
 * @returns Frame interval in milliseconds
 */
export function getFrameInterval(fps: number): number {
  return 1000 / fps;
}
