/**
 * Storm Performance Optimization Utilities
 * 
 * Provides utilities for optimizing storm rendering and animation performance
 * when dealing with multiple active storms and large datasets.
 * 
 * Requirements: Performance optimization (design section)
 */

import type { StormPoint } from './stormData';

/**
 * Performance configuration constants
 */
export const PERFORMANCE_CONFIG = {
  // Track simplification
  SIMPLIFICATION_THRESHOLD: 100, // Simplify tracks with more than this many points
  SIMPLIFICATION_TOLERANCE: 0.01, // Douglas-Peucker tolerance (degrees)
  
  // Zoom-based rendering
  SIMPLIFIED_ZOOM_THRESHOLD: 7, // Use simplified rendering below this zoom level
  
  // Animation limits
  MAX_SIMULTANEOUS_ANIMATIONS: 5, // Maximum number of storms animating at once
  REDUCED_FPS_THRESHOLD: 3, // Reduce FPS when more than this many storms are active
  NORMAL_FPS: 60, // Normal animation FPS
  REDUCED_FPS: 30, // Reduced animation FPS for performance
} as const;

/**
 * Calculate perpendicular distance from a point to a line segment
 * 
 * @param point - Point to measure distance from
 * @param lineStart - Start point of line segment
 * @param lineEnd - End point of line segment
 * @returns Perpendicular distance in degrees
 */
function perpendicularDistance(
  point: StormPoint,
  lineStart: StormPoint,
  lineEnd: StormPoint
): number {
  const { lat: x, lng: y } = point;
  const { lat: x1, lng: y1 } = lineStart;
  const { lat: x2, lng: y2 } = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Handle case where line segment is actually a point
  if (dx === 0 && dy === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }

  // Calculate perpendicular distance
  const numerator = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(dx ** 2 + dy ** 2);

  return numerator / denominator;
}

/**
 * Douglas-Peucker algorithm for track simplification
 * 
 * Recursively simplifies a polyline by removing points that contribute
 * less than the tolerance threshold to the overall shape.
 * 
 * @param points - Array of storm points to simplify
 * @param tolerance - Maximum distance a point can be from the simplified line (in degrees)
 * @returns Simplified array of storm points
 * 
 * Requirements: Task 12.1 - Implement track simplification using Douglas-Peucker algorithm
 */
export function simplifyTrack(
  points: StormPoint[],
  tolerance: number = PERFORMANCE_CONFIG.SIMPLIFICATION_TOLERANCE
): StormPoint[] {
  if (points.length <= 2) {
    return points;
  }

  // Find the point with maximum distance from the line between first and last
  let maxDistance = 0;
  let maxIndex = 0;

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Recursively simplify both segments
    const leftSegment = simplifyTrack(points.slice(0, maxIndex + 1), tolerance);
    const rightSegment = simplifyTrack(points.slice(maxIndex), tolerance);

    // Combine results (remove duplicate point at junction)
    return [...leftSegment.slice(0, -1), ...rightSegment];
  } else {
    // All points between first and last can be removed
    return [firstPoint, lastPoint];
  }
}

/**
 * Determine if a track should be simplified based on point count
 * 
 * @param points - Array of storm points
 * @returns True if track should be simplified
 * 
 * Requirements: Task 12.1 - Simplify tracks with >100 points
 */
export function shouldSimplifyTrack(points: StormPoint[]): boolean {
  return points.length > PERFORMANCE_CONFIG.SIMPLIFICATION_THRESHOLD;
}

/**
 * Get appropriate track points based on zoom level
 * 
 * @param points - Original array of storm points
 * @param zoomLevel - Current map zoom level
 * @returns Appropriate points array (simplified or full resolution)
 * 
 * Requirements: Task 12.2 - Add zoom-level based rendering
 */
export function getTrackForZoomLevel(
  points: StormPoint[],
  zoomLevel: number
): StormPoint[] {
  // Use simplified track at low zoom levels
  if (zoomLevel < PERFORMANCE_CONFIG.SIMPLIFIED_ZOOM_THRESHOLD) {
    if (shouldSimplifyTrack(points)) {
      return simplifyTrack(points);
    }
  }

  // Use full resolution at high zoom levels
  return points;
}

/**
 * Animation queue manager for limiting simultaneous animations
 */
export class AnimationQueue {
  private activeAnimations: Set<string> = new Set();
  private queuedAnimations: Array<{ stormId: string; callback: () => void }> = [];
  private maxSimultaneous: number;

  constructor(maxSimultaneous: number = PERFORMANCE_CONFIG.MAX_SIMULTANEOUS_ANIMATIONS) {
    this.maxSimultaneous = maxSimultaneous;
  }

  /**
   * Request to start an animation
   * 
   * @param stormId - Unique identifier for the storm
   * @param callback - Function to call when animation can start
   * @returns True if animation started immediately, false if queued
   * 
   * Requirements: Task 12.3 - Limit simultaneous animations to 5 storms with queueing
   */
  requestAnimation(stormId: string, callback: () => void): boolean {
    // If already animating, ignore
    if (this.activeAnimations.has(stormId)) {
      return true;
    }

    // If under limit, start immediately
    if (this.activeAnimations.size < this.maxSimultaneous) {
      this.activeAnimations.add(stormId);
      callback();
      return true;
    }

    // Otherwise, queue it
    this.queuedAnimations.push({ stormId, callback });
    return false;
  }

  /**
   * Mark an animation as complete and start next queued animation
   * 
   * @param stormId - Unique identifier for the storm
   */
  completeAnimation(stormId: string): void {
    this.activeAnimations.delete(stormId);

    // Start next queued animation if any
    if (this.queuedAnimations.length > 0) {
      const next = this.queuedAnimations.shift();
      if (next) {
        this.activeAnimations.add(next.stormId);
        next.callback();
      }
    }
  }

  /**
   * Cancel a queued animation
   * 
   * @param stormId - Unique identifier for the storm
   */
  cancelAnimation(stormId: string): void {
    this.activeAnimations.delete(stormId);
    this.queuedAnimations = this.queuedAnimations.filter(
      (item) => item.stormId !== stormId
    );
  }

  /**
   * Get number of active animations
   */
  getActiveCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Get number of queued animations
   */
  getQueuedCount(): number {
    return this.queuedAnimations.length;
  }

  /**
   * Clear all animations
   */
  clear(): void {
    this.activeAnimations.clear();
    this.queuedAnimations = [];
  }
}

/**
 * Calculate appropriate FPS based on number of active storms
 * 
 * @param activeStormCount - Number of storms currently being animated
 * @returns Target FPS for animations
 * 
 * Requirements: Task 12.4 - Reduce animation quality to 30fps when more than 3 storms are active
 */
export function getTargetFPS(activeStormCount: number): number {
  if (activeStormCount > PERFORMANCE_CONFIG.REDUCED_FPS_THRESHOLD) {
    return PERFORMANCE_CONFIG.REDUCED_FPS;
  }
  return PERFORMANCE_CONFIG.NORMAL_FPS;
}

/**
 * Animation frame manager for cleanup
 * 
 * Tracks animation frames and provides cleanup functionality
 * to prevent memory leaks.
 * 
 * Requirements: Task 12.5 - Add cleanup logic for animation frames
 */
export class AnimationFrameManager {
  private frames: Map<string, number> = new Map();
  private eventListeners: Map<string, Array<{ element: EventTarget; type: string; listener: EventListener }>> = new Map();

  /**
   * Register an animation frame
   * 
   * @param id - Unique identifier for the animation
   * @param frameId - requestAnimationFrame ID
   */
  registerFrame(id: string, frameId: number): void {
    // Cancel existing frame if any
    const existingFrame = this.frames.get(id);
    if (existingFrame !== undefined) {
      cancelAnimationFrame(existingFrame);
    }

    this.frames.set(id, frameId);
  }

  /**
   * Cancel and remove an animation frame
   * 
   * @param id - Unique identifier for the animation
   */
  cancelFrame(id: string): void {
    const frameId = this.frames.get(id);
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
      this.frames.delete(id);
    }
  }

  /**
   * Register an event listener for cleanup
   * 
   * @param id - Unique identifier for the component
   * @param element - DOM element or EventTarget
   * @param type - Event type
   * @param listener - Event listener function
   */
  registerEventListener(
    id: string,
    element: EventTarget,
    type: string,
    listener: EventListener
  ): void {
    if (!this.eventListeners.has(id)) {
      this.eventListeners.set(id, []);
    }

    const listeners = this.eventListeners.get(id)!;
    listeners.push({ element, type, listener });

    // Add the event listener
    element.addEventListener(type, listener);
  }

  /**
   * Remove all event listeners for a component
   * 
   * @param id - Unique identifier for the component
   */
  removeEventListeners(id: string): void {
    const listeners = this.eventListeners.get(id);
    if (listeners) {
      listeners.forEach(({ element, type, listener }) => {
        element.removeEventListener(type, listener);
      });
      this.eventListeners.delete(id);
    }
  }

  /**
   * Clean up all resources for a component
   * 
   * @param id - Unique identifier for the component
   * 
   * Requirements: Task 12.5 - Add cleanup logic for animation frames and event listeners on unmount
   */
  cleanup(id: string): void {
    this.cancelFrame(id);
    this.removeEventListeners(id);
  }

  /**
   * Clean up all resources
   */
  cleanupAll(): void {
    // Cancel all animation frames
    this.frames.forEach((frameId) => {
      cancelAnimationFrame(frameId);
    });
    this.frames.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listeners) => {
      listeners.forEach(({ element, type, listener }) => {
        element.removeEventListener(type, listener);
      });
    });
    this.eventListeners.clear();
  }

  /**
   * Get number of active frames
   */
  getActiveFrameCount(): number {
    return this.frames.size;
  }

  /**
   * Get number of registered event listeners
   */
  getEventListenerCount(): number {
    let count = 0;
    this.eventListeners.forEach((listeners) => {
      count += listeners.length;
    });
    return count;
  }
}

/**
 * Global animation frame manager instance
 */
export const globalAnimationFrameManager = new AnimationFrameManager();

/**
 * Global animation queue instance
 */
export const globalAnimationQueue = new AnimationQueue();
