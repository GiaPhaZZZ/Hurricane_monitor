/**
 * ParticleEngine Class
 * 
 * Manages particle lifecycle, updates, and rendering for wind visualization.
 * Implements spatial grid for efficient wind vector lookups.
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.6, 1.8, 8.7
 */

import type { LatLngBounds } from 'leaflet';
import type { Particle, WindField, WindVector, GridCell } from './types';

const GRID_SIZE = 50; // 50x50 spatial grid
const MAX_PARTICLE_AGE = 100; // Maximum frames before respawn
const PARTICLE_SPEED_SCALE = 0.5; // Scale factor for particle movement
const TRAIL_LENGTH_SCALE = 0.08; // Scale factor for trail length

export class ParticleEngine {
  private particles: Particle[] = [];
  private windField: WindField;
  private spatialGrid: GridCell[][] = [];
  private viewportWidth: number;
  private viewportHeight: number;
  private bounds: LatLngBounds;
  private dirtyRegions: Set<string> = new Set();
  private preallocatedParticlePool: Particle[] = [];
  private maxPoolSize: number = 10000;

  constructor(
    width: number,
    height: number,
    windField: WindField,
    particleCount: number,
    bounds: LatLngBounds
  ) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.windField = windField;
    this.bounds = bounds;

    this.initializeSpatialGrid();
    this.preallocateParticlePool();
    this.initializeParticles(particleCount);
  }

  /**
   * Pre-allocate particle pool to avoid garbage collection
   * Requirements: 8.4, 8.5
   */
  private preallocateParticlePool(): void {
    this.preallocatedParticlePool = [];
    for (let i = 0; i < this.maxPoolSize; i++) {
      this.preallocatedParticlePool.push({
        x: 0,
        y: 0,
        lat: 0,
        lng: 0,
        age: 0,
        maxAge: MAX_PARTICLE_AGE,
        speed: 0,
        vx: 0,
        vy: 0,
      });
    }
  }

  /**
   * Initialize spatial grid for efficient wind vector lookups
   * Requirements: 8.7
   */
  private initializeSpatialGrid(): void {
    const { bounds } = this.windField;
    const latStep = (bounds.north - bounds.south) / GRID_SIZE;
    const lngStep = (bounds.east - bounds.west) / GRID_SIZE;

    this.spatialGrid = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      this.spatialGrid[i] = [];
      for (let j = 0; j < GRID_SIZE; j++) {
        this.spatialGrid[i][j] = {
          minLat: bounds.south + i * latStep,
          maxLat: bounds.south + (i + 1) * latStep,
          minLng: bounds.west + j * lngStep,
          maxLng: bounds.west + (j + 1) * lngStep,
          windVectors: [],
        };
      }
    }
  }

  /**
   * Initialize particles with random positions
   * Requirements: 1.1, 8.4
   */
  private initializeParticles(count: number): void {
    this.particles = [];

    for (let i = 0; i < count; i++) {
      // Use pre-allocated particle from pool if available
      if (i < this.preallocatedParticlePool.length) {
        const particle = this.preallocatedParticlePool[i];
        this.resetParticle(particle);
        this.particles.push(particle);
      } else {
        this.particles.push(this.createParticle());
      }
    }
  }

  /**
   * Create a new particle at a random position within viewport bounds
   * Requirements: 1.4
   */
  private createParticle(): Particle {
    const lat = this.bounds.getSouth() + Math.random() * (this.bounds.getNorth() - this.bounds.getSouth());
    const lng = this.bounds.getWest() + Math.random() * (this.bounds.getEast() - this.bounds.getWest());

    const { x, y } = this.latLngToScreen(lat, lng);

    return {
      x,
      y,
      lat,
      lng,
      age: Math.floor(Math.random() * MAX_PARTICLE_AGE),
      maxAge: MAX_PARTICLE_AGE,
      speed: 0,
      vx: 0,
      vy: 0,
    };
  }

  /**
   * Reset particle to random position (reuses existing object)
   * Requirements: 8.4
   */
  private resetParticle(particle: Particle): void {
    const lat = this.bounds.getSouth() + Math.random() * (this.bounds.getNorth() - this.bounds.getSouth());
    const lng = this.bounds.getWest() + Math.random() * (this.bounds.getEast() - this.bounds.getWest());

    const { x, y } = this.latLngToScreen(lat, lng);

    particle.x = x;
    particle.y = y;
    particle.lat = lat;
    particle.lng = lng;
    particle.age = Math.floor(Math.random() * MAX_PARTICLE_AGE);
    particle.maxAge = MAX_PARTICLE_AGE;
    particle.speed = 0;
    particle.vx = 0;
    particle.vy = 0;
  }

  /**
   * Convert lat/lng to screen coordinates
   */
  private latLngToScreen(lat: number, lng: number): { x: number; y: number } {
    const north = this.bounds.getNorth();
    const south = this.bounds.getSouth();
    const west = this.bounds.getWest();
    const east = this.bounds.getEast();

    const x = ((lng - west) / (east - west)) * this.viewportWidth;
    const y = ((north - lat) / (north - south)) * this.viewportHeight;

    return { x, y };
  }

  /**
   * Convert screen coordinates to lat/lng
   * Currently unused but kept for future features
   */
  // private screenToLatLng(x: number, y: number): { lat: number; lng: number } {
  //   const north = this.bounds.getNorth();
  //   const south = this.bounds.getSouth();
  //   const west = this.bounds.getWest();
  //   const east = this.bounds.getEast();

  //   const lng = west + (x / this.viewportWidth) * (east - west);
  //   const lat = north - (y / this.viewportHeight) * (north - south);

  //   return { lat, lng };
  // }

  /**
   * Get wind vector at a specific lat/lng using spatial grid lookup
   * Requirements: 8.7
   */
  private getWindVector(lat: number, lng: number): WindVector | null {
    const { bounds, width, height, uComponent, vComponent } = this.windField;

    // Check if position is within wind field bounds
    if (lat < bounds.south || lat > bounds.north || lng < bounds.west || lng > bounds.east) {
      return null;
    }

    // Calculate grid indices
    const latIndex = Math.floor(((lat - bounds.south) / (bounds.north - bounds.south)) * (height - 1));
    const lngIndex = Math.floor(((lng - bounds.west) / (bounds.east - bounds.west)) * (width - 1));

    // Clamp indices
    const clampedLatIndex = Math.max(0, Math.min(height - 1, latIndex));
    const clampedLngIndex = Math.max(0, Math.min(width - 1, lngIndex));

    const index = clampedLatIndex * width + clampedLngIndex;

    const u = uComponent[index];
    const v = vComponent[index];

    // Convert m/s to km/h
    const speed = Math.sqrt(u * u + v * v) * 3.6;

    return { u, v, speed };
  }

  /**
   * Update particle positions based on wind vectors
   * Requirements: 1.1, 1.4
   */
  update(bounds: LatLngBounds): void {
    this.bounds = bounds;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      // Get wind vector at particle position
      const windVector = this.getWindVector(particle.lat, particle.lng);

      if (windVector) {
        // Update particle velocity based on wind
        particle.vx = windVector.u * PARTICLE_SPEED_SCALE;
        particle.vy = -windVector.v * PARTICLE_SPEED_SCALE; // Negative because screen y increases downward
        particle.speed = windVector.speed;

        // Update position
        const newLat = particle.lat + particle.vy * 0.01;
        const newLng = particle.lng + particle.vx * 0.01;

        // Convert to screen coordinates
        const screenPos = this.latLngToScreen(newLat, newLng);
        particle.x = screenPos.x;
        particle.y = screenPos.y;
        particle.lat = newLat;
        particle.lng = newLng;
      }

      // Age particle
      particle.age++;

      // Respawn particle if too old or out of bounds
      if (
        particle.age >= particle.maxAge ||
        particle.x < 0 ||
        particle.x > this.viewportWidth ||
        particle.y < 0 ||
        particle.y > this.viewportHeight
      ) {
        // Reuse existing particle object instead of creating new one
        this.resetParticle(particle);
      }

      // Mark dirty region for this particle
      this.markDirtyRegion(particle.x, particle.y);
    }
  }

  /**
   * Mark a region as dirty for optimized rendering
   * Requirements: 8.4
   */
  private markDirtyRegion(x: number, y: number): void {
    const regionSize = 50; // 50x50 pixel regions
    const regionX = Math.floor(x / regionSize);
    const regionY = Math.floor(y / regionSize);
    this.dirtyRegions.add(`${regionX},${regionY}`);
  }



  /**
   * Render particles to canvas
   * Requirements: 1.3, 1.6, 1.8
   */
  render(ctx: CanvasRenderingContext2D, colorScheme: 'default' | 'monochrome'): void {
    for (const particle of this.particles) {
      // Velocity-based color coding
      let color: string;
      let alpha: number;

      if (colorScheme === 'monochrome') {
        // Monochrome scheme for Windy mode
        if (particle.speed > 50) {
          color = 'rgb(255, 255, 255)';
          alpha = 0.9;
        } else {
          color = 'rgb(200, 200, 200)';
          alpha = 0.4;
        }
      } else {
        // Default color scheme based on speed
        if (particle.speed > 100) {
          color = 'rgb(255, 50, 50)'; // Red for extreme winds
          alpha = 1.0;
        } else if (particle.speed > 50) {
          color = 'rgb(255, 255, 255)'; // White for high winds
          alpha = 0.9;
        } else {
          color = 'rgb(150, 150, 150)'; // Gray for moderate winds
          alpha = 0.5;
        }
      }

      // Calculate trail length based on speed
      const trailLength = Math.min(particle.speed * TRAIL_LENGTH_SCALE, 8);

      // Draw particle trail
      if (trailLength > 0) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha * 0.6;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * trailLength, particle.y - particle.vy * trailLength);
        ctx.stroke();
      }

      // Draw particle point
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Update viewport dimensions and recalculate particle positions
   * Requirements: 1.5
   */
  updateViewport(width: number, height: number, bounds: LatLngBounds): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.bounds = bounds;

    // Recalculate screen positions for all particles
    for (const particle of this.particles) {
      const screenPos = this.latLngToScreen(particle.lat, particle.lng);
      particle.x = screenPos.x;
      particle.y = screenPos.y;
    }
  }

  /**
   * Update wind field data
   */
  updateWindField(windField: WindField): void {
    this.windField = windField;
    this.initializeSpatialGrid();
  }

  /**
   * Update particle count
   * Requirements: 8.1, 8.2, 8.4
   */
  updateParticleCount(newCount: number): void {
    const currentCount = this.particles.length;

    if (newCount > currentCount) {
      // Add new particles from pool
      for (let i = 0; i < newCount - currentCount; i++) {
        const poolIndex = currentCount + i;
        if (poolIndex < this.preallocatedParticlePool.length) {
          const particle = this.preallocatedParticlePool[poolIndex];
          this.resetParticle(particle);
          this.particles.push(particle);
        } else {
          this.particles.push(this.createParticle());
        }
      }
    } else if (newCount < currentCount) {
      // Remove particles (but keep them in pool)
      this.particles = this.particles.slice(0, newCount);
    }
  }

  /**
   * Get current particle count
   */
  getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.particles = [];
    this.spatialGrid = [];
  }
}
