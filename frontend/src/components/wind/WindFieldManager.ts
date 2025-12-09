/**
 * WindFieldManager Class
 * 
 * Manages wind data fetching, caching, and transformation.
 * Implements stale-while-revalidate pattern for optimal performance.
 * 
 * Requirements: 1.2, 1.5, 4.5
 */

import type { WindField } from './types';
import {
  fetchWindDataGrid,
  windToComponents,
  isApiKeyConfigured,
  type OpenWeatherMapWindResponse,
} from '../../lib/openWeatherMapClient';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const GRID_SIZE = { width: 50, height: 50 }; // Grid resolution for wind field

interface CachedWindData {
  data: WindField;
  timestamp: number;
  isStale: boolean;
}

export interface WindDataError {
  type: 'api_key_missing' | 'fetch_failed' | 'parse_failed' | 'offline';
  message: string;
  originalError?: Error;
}

export class WindFieldManager {
  private cache: Map<string, CachedWindData> = new Map();
  private currentWindField: WindField | null = null;
  private fetchInProgress: Map<string, Promise<WindField | null>> = new Map();
  private lastError: WindDataError | null = null;
  private isOffline: boolean = false;

  /**
   * Fetch wind data from OpenWeatherMap API
   * Requirements: 1.2
   */
  async fetchWindData(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<WindField | null> {
    const cacheKey = this.getCacheKey(bounds);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !cached.isStale) {
      return cached.data;
    }

    // Return stale data while revalidating
    if (cached && cached.isStale) {
      // Start background refresh
      this.refreshWindData(bounds, cacheKey);
      return cached.data;
    }

    // Check if fetch is already in progress
    const inProgress = this.fetchInProgress.get(cacheKey);
    if (inProgress) {
      return inProgress;
    }

    // Start new fetch
    const fetchPromise = this.performFetch(bounds, cacheKey);
    this.fetchInProgress.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.fetchInProgress.delete(cacheKey);
    }
  }

  /**
   * Perform actual API fetch
   * Requirements: 1.2
   */
  private async performFetch(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    cacheKey: string
  ): Promise<WindField | null> {
    try {
      // Check if API key is configured
      if (!isApiKeyConfigured()) {
        this.lastError = {
          type: 'api_key_missing',
          message: 'OpenWeatherMap API key is not configured. Using mock data instead.',
        };
        console.warn(this.lastError.message);
        
        // Fall back to mock data
        const windField = this.generateMockWindField(bounds);
        this.cacheWindField(windField, cacheKey);
        return windField;
      }

      // Check if offline
      if (!navigator.onLine) {
        this.isOffline = true;
        this.lastError = {
          type: 'offline',
          message: 'Device is offline. Using cached or mock data.',
        };
        console.warn(this.lastError.message);
        
        // Return cached data if available, otherwise mock data
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return cached.data;
        }
        const windField = this.generateMockWindField(bounds);
        return windField;
      }

      this.isOffline = false;

      // Fetch wind data from OpenWeatherMap API
      const windDataGrid = await fetchWindDataGrid(bounds, GRID_SIZE);
      
      // Transform API response to WindField format
      const windField = this.transformToWindField(windDataGrid, bounds);

      // Cache the result
      this.cacheWindField(windField, cacheKey);

      // Clear any previous errors
      this.lastError = null;

      return windField;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.lastError = {
        type: 'fetch_failed',
        message: `Failed to fetch wind data: ${errorMessage}`,
        originalError: error instanceof Error ? error : undefined,
      };
      
      console.error(this.lastError.message, error);

      // Fall back to cached data if available
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('Using cached wind data due to fetch failure');
        return cached.data;
      }

      // Fall back to mock data as last resort
      console.log('Using mock wind data due to fetch failure');
      const windField = this.generateMockWindField(bounds);
      return windField;
    }
  }

  /**
   * Cache wind field data with timestamp
   * Requirements: 4.5
   */
  private cacheWindField(windField: WindField, cacheKey: string): void {
    this.cache.set(cacheKey, {
      data: windField,
      timestamp: Date.now(),
      isStale: false,
    });

    // Set timer to mark as stale after cache duration
    setTimeout(() => {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        cached.isStale = true;
      }
    }, CACHE_DURATION);
  }

  /**
   * Refresh wind data in background
   * Requirements: 4.5
   */
  private async refreshWindData(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    cacheKey: string
  ): Promise<void> {
    try {
      const windField = await this.performFetch(bounds, cacheKey);
      if (windField) {
        this.currentWindField = windField;
      }
    } catch (error) {
      console.error('Failed to refresh wind data:', error);
    }
  }

  /**
   * Generate cache key from bounds
   */
  private getCacheKey(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): string {
    return `${bounds.north.toFixed(2)},${bounds.south.toFixed(2)},${bounds.east.toFixed(2)},${bounds.west.toFixed(2)}`;
  }

  /**
   * Transform OpenWeatherMap API response to WindField format
   * Requirements: 1.2
   */
  private transformToWindField(
    windDataGrid: OpenWeatherMapWindResponse[],
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ): WindField {
    const { width, height } = GRID_SIZE;
    const size = width * height;

    const uComponent = new Float32Array(size);
    const vComponent = new Float32Array(size);

    // Fill wind field with API data
    for (let i = 0; i < windDataGrid.length && i < size; i++) {
      const windData = windDataGrid[i];
      
      // Handle missing or invalid data
      if (!windData || !windData.wind) {
        uComponent[i] = 0;
        vComponent[i] = 0;
        continue;
      }

      // Convert wind speed and direction to u/v components
      const { u, v } = windToComponents(windData.wind.speed, windData.wind.deg);
      uComponent[i] = u;
      vComponent[i] = v;
    }

    return {
      width,
      height,
      uComponent,
      vComponent,
      bounds,
      timestamp: Date.now(),
    };
  }

  /**
   * Generate mock wind field for testing and fallback
   * Used when API is unavailable or not configured
   */
  private generateMockWindField(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): WindField {
    const { width, height } = GRID_SIZE;
    const size = width * height;

    const uComponent = new Float32Array(size);
    const vComponent = new Float32Array(size);

    // Generate realistic wind patterns
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const index = i * width + j;

        // Create circular wind pattern (simulating cyclone)
        const centerX = width / 2;
        const centerY = height / 2;
        const dx = j - centerX;
        const dy = i - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

        // Tangential wind (circular motion)
        const angle = Math.atan2(dy, dx);
        const windStrength = (1 - distance / maxDistance) * 20; // Max 20 m/s

        uComponent[index] = -Math.sin(angle) * windStrength;
        vComponent[index] = Math.cos(angle) * windStrength;

        // Add some randomness
        uComponent[index] += (Math.random() - 0.5) * 5;
        vComponent[index] += (Math.random() - 0.5) * 5;
      }
    }

    return {
      width,
      height,
      uComponent,
      vComponent,
      bounds,
      timestamp: Date.now(),
    };
  }

  /**
   * Set wind field data directly
   */
  setWindField(windField: WindField): void {
    this.currentWindField = windField;
  }

  /**
   * Get current wind field
   */
  getCurrentWindField(): WindField | null {
    return this.currentWindField;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.fetchInProgress.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get last error
   */
  getLastError(): WindDataError | null {
    return this.lastError;
  }

  /**
   * Check if offline
   */
  getIsOffline(): boolean {
    return this.isOffline;
  }

  /**
   * Check if using real API data
   */
  isUsingRealData(): boolean {
    return isApiKeyConfigured() && !this.isOffline && this.lastError?.type !== 'fetch_failed';
  }
}
