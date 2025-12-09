/**
 * Wind Strength Calculation Utilities
 * 
 * Provides functions to calculate and determine wind strength circles
 * for storm visualization based on meteorological wind speed thresholds.
 */

/**
 * Standard meteorological wind speed thresholds in knots
 */
export const WIND_THRESHOLDS = {
  TROPICAL_STORM: 34, // knots (63 km/h)
  STORM_FORCE: 50, // knots (93 km/h)
  HURRICANE_FORCE: 64, // knots (119 km/h)
  MAJOR_HURRICANE: 100, // knots (185 km/h)
} as const;

/**
 * Default radius multipliers if actual wind radii data not available
 * These represent the typical extent of wind speeds as a fraction of max wind speed
 */
export const RADIUS_MULTIPLIERS = {
  kt34: 0.5, // 50% of max wind speed in km
  kt50: 0.35, // 35% of max wind speed in km
  kt64: 0.25, // 25% of max wind speed in km
  kt100: 0.15, // 15% of max wind speed in km
} as const;

/**
 * Custom wind radii data from API (optional)
 */
export interface WindRadii {
  kt34?: number; // Radius in km for 34-knot winds
  kt50?: number; // Radius in km for 50-knot winds
  kt64?: number; // Radius in km for 64-knot winds
  kt100?: number; // Radius in km for 100-knot winds
}

/**
 * Configuration for a single wind strength circle
 */
export interface CircleConfig {
  radius: number; // Radius in kilometers
  windSpeed: number; // Wind speed threshold in knots
  threshold: keyof typeof WIND_THRESHOLDS;
}

/**
 * Calculate which wind strength circles to display based on storm wind speed
 * 
 * @param windSpeed - Maximum sustained wind speed in knots
 * @param windRadii - Optional custom wind radii data from API
 * @returns Array of circle configurations to render
 * 
 * @example
 * // Tropical Storm (40 knots)
 * calculateWindCircles(40) // Returns 1 circle (34kt)
 * 
 * @example
 * // Category 2 Hurricane (90 knots)
 * calculateWindCircles(90) // Returns 3 circles (34kt, 50kt, 64kt)
 * 
 * @example
 * // Category 5 Hurricane (150 knots) with custom radii
 * calculateWindCircles(150, { kt34: 200, kt50: 150, kt64: 100, kt100: 50 })
 * // Returns 4 circles with custom radii
 */
export function calculateWindCircles(
  windSpeed: number,
  windRadii?: WindRadii
): CircleConfig[] {
  const circles: CircleConfig[] = [];

  // Define thresholds with their corresponding keys and multipliers
  const thresholds: Array<{
    speed: number;
    key: keyof typeof WIND_THRESHOLDS;
    radiusKey: keyof WindRadii;
    multiplier: number;
  }> = [
    {
      speed: WIND_THRESHOLDS.TROPICAL_STORM,
      key: 'TROPICAL_STORM',
      radiusKey: 'kt34',
      multiplier: RADIUS_MULTIPLIERS.kt34,
    },
    {
      speed: WIND_THRESHOLDS.STORM_FORCE,
      key: 'STORM_FORCE',
      radiusKey: 'kt50',
      multiplier: RADIUS_MULTIPLIERS.kt50,
    },
    {
      speed: WIND_THRESHOLDS.HURRICANE_FORCE,
      key: 'HURRICANE_FORCE',
      radiusKey: 'kt64',
      multiplier: RADIUS_MULTIPLIERS.kt64,
    },
    {
      speed: WIND_THRESHOLDS.MAJOR_HURRICANE,
      key: 'MAJOR_HURRICANE',
      radiusKey: 'kt100',
      multiplier: RADIUS_MULTIPLIERS.kt100,
    },
  ];

  // Only show circles for wind speeds that exceed the threshold
  thresholds.forEach((threshold) => {
    if (windSpeed >= threshold.speed) {
      // Use custom radius if provided, otherwise calculate from wind speed
      const radius =
        windRadii?.[threshold.radiusKey] ?? windSpeed * threshold.multiplier;

      circles.push({
        radius,
        windSpeed: threshold.speed,
        threshold: threshold.key,
      });
    }
  });

  return circles;
}

/**
 * Get the number of circles that should be displayed for a given wind speed
 * 
 * @param windSpeed - Maximum sustained wind speed in knots
 * @returns Number of circles to display (0-4)
 * 
 * @example
 * getCircleCount(30) // Returns 0 (below tropical storm threshold)
 * getCircleCount(40) // Returns 1 (tropical storm)
 * getCircleCount(90) // Returns 3 (category 2 hurricane)
 * getCircleCount(150) // Returns 4 (category 5 hurricane)
 */
export function getCircleCount(windSpeed: number): number {
  return calculateWindCircles(windSpeed).length;
}

/**
 * Check if wind strength circles should be displayed for a given wind speed
 * 
 * @param windSpeed - Maximum sustained wind speed in knots
 * @returns True if at least one circle should be displayed
 */
export function shouldDisplayCircles(windSpeed: number): boolean {
  return windSpeed >= WIND_THRESHOLDS.TROPICAL_STORM;
}
