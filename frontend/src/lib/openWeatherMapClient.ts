/**
 * OpenWeatherMap API Client
 * 
 * Handles authentication and API requests to OpenWeatherMap for wind data.
 * Requirements: 1.2, 1.5
 */

import { weatherApi } from '../api/weatherApi';

// const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
// const API_URL = import.meta.env.VITE_OPENWEATHER_API_URL || 'https://api.openweathermap.org/data/2.5'; // No longer used directly

export interface OpenWeatherMapWindResponse {
  coord: {
    lon: number;
    lat: number;
  };
  wind: {
    speed: number; // m/s
    deg: number; // degrees
    gust?: number; // m/s
  };
}

export interface OpenWeatherMapError {
  cod: string | number;
  message: string;
}

/**
 * Check if API key is configured
 * Note: With backend proxy, the frontend might not need the key directly, 
 * but we keep this check if we want to ensure backend has it or for legacy reasons.
 * For now, we'll assume if backend works, we are good.
 */
export function isApiKeyConfigured(): boolean {
  // We can relax this check if we are strictly using backend, 
  // but for now let's keep it or return true to bypass frontend check
  return true;
}

/**
 * Fetch wind data for a specific location
 * Requirements: 1.2
 */
export async function fetchWindDataForLocation(
  lat: number,
  lon: number
): Promise<OpenWeatherMapWindResponse> {
  try {
    // Call our backend instead of OpenWeatherMap directly
    const data = await weatherApi.getByCoordinates(lat, lon);

    // Map backend response to the expected format for existing components
    return {
      coord: {
        lon: data.lon || lon,
        lat: data.lat || lat,
      },
      wind: {
        speed: data.wind,
        deg: data.windDeg,
      }
    };
  } catch (error) {
    console.error('Failed to fetch wind data from backend:', error);
    throw new Error('Failed to fetch wind data from backend service');
  }
}

/**
 * Fetch wind data for a grid of locations within bounds
 * This creates a wind field by sampling multiple points
 * Requirements: 1.2
 */
export async function fetchWindDataGrid(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  gridSize: { width: number; height: number }
): Promise<OpenWeatherMapWindResponse[]> {
  const { north, south, east, west } = bounds;
  const { width, height } = gridSize;

  const latStep = (north - south) / (height - 1);
  const lonStep = (east - west) / (width - 1);

  const promises: Promise<OpenWeatherMapWindResponse>[] = [];

  // Sample grid points
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const lat = south + i * latStep;
      const lon = west + j * lonStep;
      promises.push(fetchWindDataForLocation(lat, lon));
    }
  }

  // Fetch all points in parallel with rate limiting
  // OpenWeatherMap free tier allows 60 calls/minute
  const results: OpenWeatherMapWindResponse[] = [];
  const batchSize = 10; // Process 10 requests at a time

  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    // Add small delay between batches to respect rate limits
    if (i + batchSize < promises.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Convert wind speed and direction to u/v components
 * u: east-west component (positive = eastward)
 * v: north-south component (positive = northward)
 */
export function windToComponents(speed: number, degrees: number): { u: number; v: number } {
  // Convert meteorological degrees (direction wind is coming FROM)
  // to mathematical radians (direction wind is going TO)
  const radians = ((degrees + 180) % 360) * (Math.PI / 180);

  const u = speed * Math.sin(radians);
  const v = speed * Math.cos(radians);

  return { u, v };
}

/**
 * Test API connection
 */
export async function testApiConnection(): Promise<boolean> {
  if (!isApiKeyConfigured()) {
    console.warn('OpenWeatherMap API key is not configured');
    return false;
  }

  try {
    // Test with a known location (New York City)
    await fetchWindDataForLocation(40.7128, -74.0060);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}
