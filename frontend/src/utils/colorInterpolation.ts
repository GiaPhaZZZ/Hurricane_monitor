/**
 * Color interpolation utilities for storm track gradient visualization
 * Supports smooth color transitions based on storm intensity
 */

/**
 * RGB color representation
 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Color stop for gradient generation
 */
export interface ColorStop {
  position: number; // 0-1 along the track
  color: string; // Hex color
  category: string;
}

/**
 * Storm point interface for gradient generation
 */
export interface StormPoint {
  timestamp: number;
  lat: number;
  lng: number;
  windSpeed: number;
  pressure: number;
  category: string;
  bearing?: number;
  intensity?: number;
  uncertaintyRadius?: number;
}

/**
 * Converts a hex color string to RGB components
 * @param hex - Hex color string (e.g., "#FF5733" or "FF5733")
 * @returns RGB object with r, g, b values (0-255)
 */
export function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex string to RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Converts RGB components to a hex color string
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string with # prefix
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Interpolates between two colors based on a factor
 * @param color1 - Starting color (hex string)
 * @param color2 - Ending color (hex string)
 * @param factor - Interpolation factor (0-1, where 0 = color1, 1 = color2)
 * @returns Interpolated color as hex string
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
  // Clamp factor to 0-1 range
  const t = Math.max(0, Math.min(1, factor));
  
  // Convert hex colors to RGB
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  // Interpolate each component
  const r = c1.r + (c2.r - c1.r) * t;
  const g = c1.g + (c2.g - c1.g) * t;
  const b = c1.b + (c2.b - c1.b) * t;
  
  return rgbToHex(r, g, b);
}

/**
 * Maps storm category to color using Saffir-Simpson scale
 * @param category - Storm category string
 * @returns Hex color string
 */
export function getCategoryColor(category: string): string {
  const categoryMap: Record<string, string> = {
    'TD': '#4CAF50',  // Tropical Depression - Green
    'TS': '#2196F3',  // Tropical Storm - Blue
    'C1': '#FFC107',  // Category 1 - Yellow
    'C2': '#FF9800',  // Category 2 - Orange
    'C3': '#F44336',  // Category 3 - Red
    'C4': '#D32F2F',  // Category 4 - Dark Red
    'C5': '#9C27B0',  // Category 5 - Purple
  };
  
  // Normalize category string
  const normalized = category.toUpperCase().replace(/\s+/g, '');
  
  // Try exact match first
  if (categoryMap[normalized]) {
    return categoryMap[normalized];
  }
  
  // Try to extract category number
  if (normalized.includes('CATEGORY')) {
    const match = normalized.match(/CATEGORY(\d)/);
    if (match) {
      return categoryMap[`C${match[1]}`] || '#2196F3';
    }
  }
  
  // Check for tropical depression/storm
  if (normalized.includes('DEPRESSION')) {
    return categoryMap['TD'];
  }
  if (normalized.includes('TROPICAL') || normalized.includes('STORM')) {
    return categoryMap['TS'];
  }
  
  // Default to tropical storm blue
  return categoryMap['TS'];
}

/**
 * Generates an array of color stops for gradient rendering along a storm track
 * @param points - Array of storm points with category information
 * @returns Array of color stops with position (0-1) and color
 */
export function generateGradientStops(points: StormPoint[]): ColorStop[] {
  if (points.length === 0) {
    return [];
  }
  
  if (points.length === 1) {
    return [{
      position: 0,
      color: getCategoryColor(points[0].category),
      category: points[0].category
    }];
  }
  
  return points.map((point, index) => ({
    position: index / (points.length - 1),
    color: getCategoryColor(point.category),
    category: point.category
  }));
}
