/**
 * Storm Intensity Change Detection and Visualization
 * 
 * Provides utilities for detecting and visualizing storm intensity changes,
 * including intensification detection, color transitions, and glow animations.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import type { StormPoint } from './stormData';
import { getCategoryColor, interpolateColor } from '../utils/colorInterpolation';

/**
 * Category hierarchy for intensity comparison
 */
const CATEGORY_HIERARCHY: Record<string, number> = {
  'TD': 0,  // Tropical Depression
  'TS': 1,  // Tropical Storm
  'C1': 2,  // Category 1
  'C2': 3,  // Category 2
  'C3': 4,  // Category 3 (Major Hurricane)
  'C4': 5,  // Category 4 (Major Hurricane)
  'C5': 6,  // Category 5 (Major Hurricane)
};

/**
 * Normalize category string to standard format
 */
function normalizeCategory(category: string): string {
  const normalized = category.toUpperCase().replace(/\s+/g, '');
  
  if (normalized.includes('DEPRESSION')) return 'TD';
  if (normalized.includes('TROPICAL') || normalized.includes('STORM')) return 'TS';
  
  const match = normalized.match(/CATEGORY(\d)|C(\d)/);
  if (match) {
    const num = match[1] || match[2];
    return `C${num}`;
  }
  
  return normalized;
}

/**
 * Get category intensity level (0-6)
 */
function getCategoryLevel(category: string): number {
  const normalized = normalizeCategory(category);
  return CATEGORY_HIERARCHY[normalized] ?? 1;
}

/**
 * Check if a category is a major hurricane (Category 3+)
 * 
 * Requirements: 10.4 - Larger markers for major hurricanes
 */
export function isMajorHurricane(category: string): boolean {
  const level = getCategoryLevel(category);
  return level >= 4; // C3 and above
}

/**
 * Intensity change type
 */
export type IntensityChange = 'intensifying' | 'weakening' | 'stable';

/**
 * Detect intensity change between two storm points
 * 
 * Requirements: 10.1, 10.3 - Detect intensity changes for dynamic updates and glow animation
 */
export function detectIntensityChange(
  previousPoint: StormPoint,
  currentPoint: StormPoint
): IntensityChange {
  const prevLevel = getCategoryLevel(previousPoint.category);
  const currLevel = getCategoryLevel(currentPoint.category);
  
  // Also consider wind speed for more granular detection
  const windSpeedChange = currentPoint.windSpeed - previousPoint.windSpeed;
  
  // Category change takes precedence
  if (currLevel > prevLevel) {
    return 'intensifying';
  } else if (currLevel < prevLevel) {
    return 'weakening';
  }
  
  // If same category, check wind speed (threshold: 10 km/h)
  if (windSpeedChange > 10) {
    return 'intensifying';
  } else if (windSpeedChange < -10) {
    return 'weakening';
  }
  
  return 'stable';
}

/**
 * Calculate marker size with major hurricane boost
 * 
 * Requirements: 10.1, 10.4 - Dynamic marker size based on wind speed, larger for major hurricanes
 */
export function calculateIntensityMarkerSize(
  windSpeed: number,
  category: string
): number {
  const minSize = 20;
  const maxSize = 40;
  const minWind = 30;
  const maxWind = 200;
  
  // Base size calculation
  const normalized = (windSpeed - minWind) / (maxWind - minWind);
  const clamped = Math.max(0, Math.min(1, normalized));
  let size = minSize + (maxSize - minSize) * clamped;
  
  // Boost size for major hurricanes (Category 3+)
  if (isMajorHurricane(category)) {
    size = Math.max(size, 32); // Ensure minimum 32px for major hurricanes
    size *= 1.1; // 10% size boost
  }
  
  return Math.min(size, maxSize); // Cap at max size
}

/**
 * Get interpolated color between two points based on progress
 * 
 * Requirements: 10.2, 10.5 - Smooth color transitions with proper color scale
 */
export function getTransitionColor(
  fromPoint: StormPoint,
  toPoint: StormPoint,
  progress: number
): string {
  const fromColor = getCategoryColor(fromPoint.category);
  const toColor = getCategoryColor(toPoint.category);
  
  // If same category, return the category color
  if (fromPoint.category === toPoint.category) {
    return fromColor;
  }
  
  // Interpolate between colors
  return interpolateColor(fromColor, toColor, progress);
}

/**
 * Intensity change animation configuration
 */
export interface IntensityAnimationConfig {
  /** Whether to show glow animation on intensification */
  showGlowOnIntensify: boolean;
  /** Glow animation duration in milliseconds */
  glowDuration: number;
  /** Color transition duration in milliseconds */
  colorTransitionDuration: number;
  /** Size transition duration in milliseconds */
  sizeTransitionDuration: number;
}

/**
 * Default intensity animation configuration
 */
export const DEFAULT_INTENSITY_ANIMATION_CONFIG: IntensityAnimationConfig = {
  showGlowOnIntensify: true,
  glowDuration: 1500, // 1.5 seconds
  colorTransitionDuration: 800, // 0.8 seconds
  sizeTransitionDuration: 600, // 0.6 seconds
};

/**
 * Generate CSS for glow animation
 * 
 * Requirements: 10.3 - Brief glow animation when storm intensifies
 */
export function generateGlowAnimationCSS(
  color: string,
  duration: number = 1500
): string {
  return `
    @keyframes intensity-glow {
      0% {
        filter: drop-shadow(0 0 0px ${color});
      }
      50% {
        filter: drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color});
      }
      100% {
        filter: drop-shadow(0 0 0px ${color});
      }
    }
    
    .intensity-glow-animation {
      animation: intensity-glow ${duration}ms ease-out;
    }
  `;
}

/**
 * Generate CSS for smooth color transition
 * 
 * Requirements: 10.2 - Smooth color transitions when category changes
 */
export function generateColorTransitionCSS(duration: number = 800): string {
  return `
    .intensity-color-transition {
      transition: background-color ${duration}ms ease-in-out,
                  fill ${duration}ms ease-in-out,
                  color ${duration}ms ease-in-out;
    }
  `;
}

/**
 * Generate CSS for smooth size transition
 * 
 * Requirements: 10.1 - Dynamic marker size updates
 */
export function generateSizeTransitionCSS(duration: number = 600): string {
  return `
    .intensity-size-transition {
      transition: width ${duration}ms ease-in-out,
                  height ${duration}ms ease-in-out,
                  transform ${duration}ms ease-in-out;
    }
  `;
}

/**
 * Intensity change event data
 */
export interface IntensityChangeEvent {
  previousPoint: StormPoint;
  currentPoint: StormPoint;
  changeType: IntensityChange;
  windSpeedDelta: number;
  categoryChanged: boolean;
  shouldShowGlow: boolean;
}

/**
 * Analyze intensity change between two points
 * 
 * Returns detailed information about the intensity change for visualization
 */
export function analyzeIntensityChange(
  previousPoint: StormPoint,
  currentPoint: StormPoint,
  config: IntensityAnimationConfig = DEFAULT_INTENSITY_ANIMATION_CONFIG
): IntensityChangeEvent {
  const changeType = detectIntensityChange(previousPoint, currentPoint);
  const windSpeedDelta = currentPoint.windSpeed - previousPoint.windSpeed;
  const categoryChanged = normalizeCategory(previousPoint.category) !== normalizeCategory(currentPoint.category);
  
  // Show glow only when intensifying and config allows
  const shouldShowGlow = config.showGlowOnIntensify && changeType === 'intensifying';
  
  return {
    previousPoint,
    currentPoint,
    changeType,
    windSpeedDelta,
    categoryChanged,
    shouldShowGlow,
  };
}

/**
 * Get all intensity change points in a storm track
 * 
 * Returns array of indices where significant intensity changes occur
 */
export function getIntensityChangePoints(points: StormPoint[]): number[] {
  const changePoints: number[] = [];
  
  for (let i = 1; i < points.length; i++) {
    const change = detectIntensityChange(points[i - 1], points[i]);
    if (change !== 'stable') {
      changePoints.push(i);
    }
  }
  
  return changePoints;
}

/**
 * Calculate intensity score for sorting/comparison
 * 
 * Higher score = more intense storm
 */
export function calculateIntensityScore(point: StormPoint): number {
  const categoryLevel = getCategoryLevel(point.category);
  const windScore = point.windSpeed / 200; // Normalize to 0-1
  const pressureScore = (1013 - point.pressure) / 100; // Lower pressure = higher score
  
  // Weighted combination
  return categoryLevel * 10 + windScore * 5 + pressureScore * 3;
}
