/**
 * Storm Data Validation and Error Handling Utilities
 * 
 * Provides validation, interpolation, and error handling for storm data.
 * Ensures data integrity before rendering and provides user-friendly error messages.
 * 
 * Requirements: Error handling (design section)
 */

import type { Storm, StormPoint } from './stormData';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation error types
 */
export const ValidationErrorType = {
  MISSING_FORECAST: 'MISSING_FORECAST',
  INCOMPLETE_POINTS: 'INCOMPLETE_POINTS',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_WIND_SPEED: 'INVALID_WIND_SPEED',
  INVALID_PRESSURE: 'INVALID_PRESSURE',
  INVALID_TIMESTAMP: 'INVALID_TIMESTAMP',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
} as const;

/**
 * Coordinate validation ranges
 */
const COORDINATE_RANGES = {
  LAT_MIN: -90,
  LAT_MAX: 90,
  LNG_MIN: -180,
  LNG_MAX: 180,
};

/**
 * Reasonable ranges for storm data
 */
const STORM_DATA_RANGES = {
  WIND_SPEED_MIN: 0,
  WIND_SPEED_MAX: 400, // km/h - extreme upper bound
  PRESSURE_MIN: 850, // hPa - extreme low pressure
  PRESSURE_MAX: 1050, // hPa - high pressure
};

/**
 * Validate coordinate ranges
 * 
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns True if coordinates are valid
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= COORDINATE_RANGES.LAT_MIN &&
    lat <= COORDINATE_RANGES.LAT_MAX &&
    lng >= COORDINATE_RANGES.LNG_MIN &&
    lng <= COORDINATE_RANGES.LNG_MAX
  );
}

/**
 * Validate wind speed value
 * 
 * @param windSpeed - Wind speed in km/h
 * @returns True if wind speed is valid
 */
export function isValidWindSpeed(windSpeed: number): boolean {
  return (
    typeof windSpeed === 'number' &&
    !isNaN(windSpeed) &&
    windSpeed >= STORM_DATA_RANGES.WIND_SPEED_MIN &&
    windSpeed <= STORM_DATA_RANGES.WIND_SPEED_MAX
  );
}

/**
 * Validate pressure value
 * 
 * @param pressure - Pressure in hPa
 * @returns True if pressure is valid
 */
export function isValidPressure(pressure: number): boolean {
  return (
    typeof pressure === 'number' &&
    !isNaN(pressure) &&
    pressure >= STORM_DATA_RANGES.PRESSURE_MIN &&
    pressure <= STORM_DATA_RANGES.PRESSURE_MAX
  );
}

/**
 * Validate timestamp
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @returns True if timestamp is valid
 */
export function isValidTimestamp(timestamp: number): boolean {
  return (
    typeof timestamp === 'number' &&
    !isNaN(timestamp) &&
    timestamp > 0 &&
    timestamp < Date.now() + 365 * 24 * 60 * 60 * 1000 // Within 1 year from now
  );
}

/**
 * Validate a single storm point
 * 
 * @param point - Storm point to validate
 * @param index - Index of the point (for error messages)
 * @returns Validation result
 */
export function validateStormPoint(
  point: StormPoint,
  index: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if point exists
  if (!point) {
    errors.push(`Point at index ${index} is null or undefined`);
    return { isValid: false, errors, warnings };
  }

  // Validate coordinates
  if (!isValidCoordinate(point.lat, point.lng)) {
    errors.push(
      `Invalid coordinates at point ${index}: lat=${point.lat}, lng=${point.lng}`
    );
  }

  // Validate wind speed
  if (!isValidWindSpeed(point.windSpeed)) {
    if (point.windSpeed === undefined || point.windSpeed === null) {
      warnings.push(`Missing wind speed at point ${index}`);
    } else {
      errors.push(
        `Invalid wind speed at point ${index}: ${point.windSpeed} km/h`
      );
    }
  }

  // Validate pressure
  if (!isValidPressure(point.pressure)) {
    if (point.pressure === undefined || point.pressure === null) {
      warnings.push(`Missing pressure at point ${index}`);
    } else {
      errors.push(
        `Invalid pressure at point ${index}: ${point.pressure} hPa`
      );
    }
  }

  // Validate timestamp
  if (!isValidTimestamp(point.timestamp)) {
    errors.push(`Invalid timestamp at point ${index}: ${point.timestamp}`);
  }

  // Validate category
  if (!point.category || typeof point.category !== 'string') {
    warnings.push(`Missing or invalid category at point ${index}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate an array of storm points
 * 
 * @param points - Array of storm points
 * @param pointType - Type of points (for error messages)
 * @returns Validation result
 */
export function validateStormPoints(
  points: StormPoint[],
  pointType: string = 'points'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(points)) {
    errors.push(`${pointType} is not an array`);
    return { isValid: false, errors, warnings };
  }

  if (points.length === 0) {
    warnings.push(`No ${pointType} available`);
    return { isValid: true, errors, warnings };
  }

  // Validate each point
  points.forEach((point, index) => {
    const result = validateStormPoint(point, index);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate complete storm data
 * 
 * @param storm - Storm object to validate
 * @returns Validation result
 */
export function validateStorm(storm: Storm): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!storm) {
    errors.push('Storm object is null or undefined');
    return { isValid: false, errors, warnings };
  }

  // Validate storm ID
  if (!storm.id || typeof storm.id !== 'string') {
    errors.push('Storm ID is missing or invalid');
  }

  // Validate storm name
  if (!storm.nameVi || typeof storm.nameVi !== 'string') {
    warnings.push('Storm Vietnamese name is missing');
  }

  // Validate current position
  if (!storm.currentPosition) {
    errors.push('Current position is missing');
  } else {
    const currentResult = validateStormPoint(storm.currentPosition, 0);
    errors.push(...currentResult.errors.map(e => `Current position: ${e}`));
    warnings.push(...currentResult.warnings.map(w => `Current position: ${w}`));
  }

  // Validate historical points
  const historicalResult = validateStormPoints(
    storm.historical || [],
    'historical points'
  );
  errors.push(...historicalResult.errors);
  warnings.push(...historicalResult.warnings);

  // Validate forecast points
  const forecastResult = validateStormPoints(
    storm.forecast || [],
    'forecast points'
  );
  errors.push(...forecastResult.errors);
  warnings.push(...forecastResult.warnings);

  // Check if we have enough points to render
  const totalPoints =
    (storm.historical?.length || 0) +
    (storm.currentPosition ? 1 : 0) +
    (storm.forecast?.length || 0);

  if (totalPoints < 2) {
    warnings.push(
      `Insufficient points for rendering (${totalPoints} points, minimum 2 required)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Interpolate missing storm point data
 * 
 * @param prevPoint - Previous valid point
 * @param nextPoint - Next valid point
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated storm point
 */
export function interpolateStormPoint(
  prevPoint: StormPoint,
  nextPoint: StormPoint,
  factor: number = 0.5
): StormPoint {
  return {
    timestamp: prevPoint.timestamp + (nextPoint.timestamp - prevPoint.timestamp) * factor,
    lat: prevPoint.lat + (nextPoint.lat - prevPoint.lat) * factor,
    lng: prevPoint.lng + (nextPoint.lng - prevPoint.lng) * factor,
    windSpeed: prevPoint.windSpeed + (nextPoint.windSpeed - prevPoint.windSpeed) * factor,
    pressure: prevPoint.pressure + (nextPoint.pressure - prevPoint.pressure) * factor,
    category: factor < 0.5 ? prevPoint.category : nextPoint.category,
  };
}

/**
 * Fill gaps in storm point array by interpolating missing data
 * 
 * @param points - Array of storm points (may contain invalid points)
 * @returns Array with interpolated points filling gaps
 */
export function fillStormPointGaps(points: StormPoint[]): StormPoint[] {
  if (!points || points.length === 0) {
    return [];
  }

  const result: StormPoint[] = [];
  let lastValidPoint: StormPoint | null = null;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const isValid = point && isValidCoordinate(point.lat, point.lng);

    if (isValid) {
      // If we have a gap, interpolate
      if (lastValidPoint && result.length > 0) {
        const gapSize = i - points.indexOf(lastValidPoint) - 1;
        if (gapSize > 0) {
          // Add interpolated points
          for (let j = 1; j <= gapSize; j++) {
            const factor = j / (gapSize + 1);
            result.push(interpolateStormPoint(lastValidPoint, point, factor));
          }
        }
      }

      result.push(point);
      lastValidPoint = point;
    }
  }

  return result;
}

/**
 * Sanitize storm point by providing default values for missing data
 * 
 * @param point - Storm point to sanitize
 * @param defaults - Default values to use
 * @returns Sanitized storm point
 */
export function sanitizeStormPoint(
  point: StormPoint,
  defaults: Partial<StormPoint> = {}
): StormPoint {
  return {
    timestamp: isValidTimestamp(point.timestamp) ? point.timestamp : defaults.timestamp || Date.now(),
    lat: isValidCoordinate(point.lat, point.lng) ? point.lat : defaults.lat || 0,
    lng: isValidCoordinate(point.lat, point.lng) ? point.lng : defaults.lng || 0,
    windSpeed: isValidWindSpeed(point.windSpeed) ? point.windSpeed : defaults.windSpeed || 0,
    pressure: isValidPressure(point.pressure) ? point.pressure : defaults.pressure || 1013,
    category: point.category || defaults.category || 'Unknown',
  };
}

/**
 * Log validation errors and warnings to console
 * 
 * @param result - Validation result
 * @param context - Context string for logging
 */
export function logValidationResult(
  result: ValidationResult,
  context: string = 'Storm data'
): void {
  if (result.errors.length > 0) {
    console.error(`[Storm Validation] ${context} - Errors:`, result.errors);
  }

  if (result.warnings.length > 0) {
    console.warn(`[Storm Validation] ${context} - Warnings:`, result.warnings);
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log(`[Storm Validation] ${context} - All checks passed`);
  }
}

/**
 * Get user-friendly error message for validation errors
 * 
 * @param result - Validation result
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(result: ValidationResult): string | null {
  if (result.isValid) {
    return null;
  }

  if (result.errors.some(e => e.includes('coordinates'))) {
    return 'Dữ liệu vị trí bão không hợp lệ. Không thể hiển thị trên bản đồ.';
  }

  if (result.errors.some(e => e.includes('timestamp'))) {
    return 'Dữ liệu thời gian không hợp lệ. Không thể hiển thị lịch sử bão.';
  }

  if (result.errors.some(e => e.includes('Current position'))) {
    return 'Không có dữ liệu vị trí hiện tại của bão.';
  }

  if (result.errors.some(e => e.includes('Insufficient points'))) {
    return 'Không đủ dữ liệu để hiển thị đường đi của bão.';
  }

  return 'Dữ liệu bão không hợp lệ. Vui lòng thử lại sau.';
}

/**
 * Check if storm has forecast data
 * 
 * @param storm - Storm object
 * @returns True if storm has valid forecast data
 */
export function hasForecastData(storm: Storm): boolean {
  return (
    storm.forecast &&
    Array.isArray(storm.forecast) &&
    storm.forecast.length > 0 &&
    storm.forecast.some(point => isValidCoordinate(point.lat, point.lng))
  );
}

/**
 * Get forecast availability message
 * 
 * @param storm - Storm object
 * @returns User-friendly message about forecast availability
 */
export function getForecastMessage(storm: Storm): string | null {
  if (!hasForecastData(storm)) {
    return 'Không có dữ liệu dự báo cho cơn bão này.';
  }

  return null;
}

/**
 * Validate and sanitize storm data for rendering
 * 
 * @param storm - Storm object to validate and sanitize
 * @returns Sanitized storm object or null if data is invalid
 */
export function validateAndSanitizeStorm(storm: Storm): Storm | null {
  // Validate storm
  const validationResult = validateStorm(storm);
  
  // Log validation results
  logValidationResult(validationResult, `Storm ${storm.nameVi || storm.id}`);

  // If there are critical errors, return null
  if (!validationResult.isValid) {
    console.error(
      `[Storm Validation] Cannot render storm ${storm.nameVi || storm.id}:`,
      getUserFriendlyErrorMessage(validationResult)
    );
    return null;
  }

  // Sanitize and fill gaps in storm data
  const sanitizedStorm: Storm = {
    ...storm,
    historical: fillStormPointGaps(storm.historical || []),
    forecast: fillStormPointGaps(storm.forecast || []),
  };

  return sanitizedStorm;
}

export default {
  validateStorm,
  validateStormPoint,
  validateStormPoints,
  validateAndSanitizeStorm,
  isValidCoordinate,
  isValidWindSpeed,
  isValidPressure,
  isValidTimestamp,
  interpolateStormPoint,
  fillStormPointGaps,
  sanitizeStormPoint,
  logValidationResult,
  getUserFriendlyErrorMessage,
  hasForecastData,
  getForecastMessage,
};
