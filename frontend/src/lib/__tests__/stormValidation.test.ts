/**
 * Tests for Storm Validation Utilities
 * 
 * Verifies validation, interpolation, and error handling functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidCoordinate,
  isValidWindSpeed,
  isValidPressure,
  isValidTimestamp,
  validateStormPoint,
  validateStormPoints,
  validateStorm,
  interpolateStormPoint,
  fillStormPointGaps,
  sanitizeStormPoint,
  getUserFriendlyErrorMessage,
  hasForecastData,
  getForecastMessage,
  validateAndSanitizeStorm,
} from '../stormValidation';
import type { Storm, StormPoint } from '../stormData';

describe('Coordinate Validation', () => {
  it('should validate correct coordinates', () => {
    expect(isValidCoordinate(20.5, 105.8)).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
  });

  it('should reject invalid coordinates', () => {
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(-91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate(0, -181)).toBe(false);
    expect(isValidCoordinate(NaN, 0)).toBe(false);
    expect(isValidCoordinate(0, NaN)).toBe(false);
  });
});

describe('Wind Speed Validation', () => {
  it('should validate correct wind speeds', () => {
    expect(isValidWindSpeed(0)).toBe(true);
    expect(isValidWindSpeed(100)).toBe(true);
    expect(isValidWindSpeed(250)).toBe(true);
  });

  it('should reject invalid wind speeds', () => {
    expect(isValidWindSpeed(-10)).toBe(false);
    expect(isValidWindSpeed(500)).toBe(false);
    expect(isValidWindSpeed(NaN)).toBe(false);
  });
});

describe('Pressure Validation', () => {
  it('should validate correct pressure values', () => {
    expect(isValidPressure(1013)).toBe(true);
    expect(isValidPressure(900)).toBe(true);
    expect(isValidPressure(1000)).toBe(true);
  });

  it('should reject invalid pressure values', () => {
    expect(isValidPressure(800)).toBe(false);
    expect(isValidPressure(1100)).toBe(false);
    expect(isValidPressure(NaN)).toBe(false);
  });
});

describe('Timestamp Validation', () => {
  it('should validate correct timestamps', () => {
    const now = Date.now();
    expect(isValidTimestamp(now)).toBe(true);
    expect(isValidTimestamp(now - 86400000)).toBe(true); // Yesterday
    expect(isValidTimestamp(now + 86400000)).toBe(true); // Tomorrow
  });

  it('should reject invalid timestamps', () => {
    expect(isValidTimestamp(0)).toBe(false);
    expect(isValidTimestamp(-1000)).toBe(false);
    expect(isValidTimestamp(NaN)).toBe(false);
    expect(isValidTimestamp(Date.now() + 400 * 24 * 60 * 60 * 1000)).toBe(false); // Too far in future
  });
});

describe('Storm Point Validation', () => {
  const validPoint: StormPoint = {
    timestamp: Date.now(),
    lat: 20.5,
    lng: 105.8,
    windSpeed: 120,
    pressure: 980,
    category: 'Bão cấp 2',
  };

  it('should validate correct storm point', () => {
    const result = validateStormPoint(validPoint, 0);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid coordinates', () => {
    const invalidPoint = { ...validPoint, lat: 100 };
    const result = validateStormPoint(invalidPoint, 0);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about missing wind speed', () => {
    const pointWithoutWind = { ...validPoint, windSpeed: undefined as any };
    const result = validateStormPoint(pointWithoutWind, 0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('Storm Points Array Validation', () => {
  const validPoints: StormPoint[] = [
    {
      timestamp: Date.now(),
      lat: 20.5,
      lng: 105.8,
      windSpeed: 120,
      pressure: 980,
      category: 'Bão cấp 2',
    },
    {
      timestamp: Date.now() + 3600000,
      lat: 21.0,
      lng: 106.0,
      windSpeed: 130,
      pressure: 975,
      category: 'Bão cấp 3',
    },
  ];

  it('should validate array of valid points', () => {
    const result = validateStormPoints(validPoints, 'test points');
    expect(result.isValid).toBe(true);
  });

  it('should detect invalid points in array', () => {
    const mixedPoints = [
      ...validPoints,
      { ...validPoints[0], lat: 100 }, // Invalid
    ];
    const result = validateStormPoints(mixedPoints, 'test points');
    expect(result.isValid).toBe(false);
  });
});

describe('Storm Interpolation', () => {
  const point1: StormPoint = {
    timestamp: 1000,
    lat: 20.0,
    lng: 105.0,
    windSpeed: 100,
    pressure: 1000,
    category: 'Bão cấp 1',
  };

  const point2: StormPoint = {
    timestamp: 2000,
    lat: 22.0,
    lng: 107.0,
    windSpeed: 120,
    pressure: 980,
    category: 'Bão cấp 2',
  };

  it('should interpolate between two points', () => {
    const midPoint = interpolateStormPoint(point1, point2, 0.5);
    expect(midPoint.lat).toBe(21.0);
    expect(midPoint.lng).toBe(106.0);
    expect(midPoint.windSpeed).toBe(110);
    expect(midPoint.pressure).toBe(990);
  });

  it('should use first category when factor < 0.5', () => {
    const point = interpolateStormPoint(point1, point2, 0.3);
    expect(point.category).toBe('Bão cấp 1');
  });

  it('should use second category when factor >= 0.5', () => {
    const point = interpolateStormPoint(point1, point2, 0.7);
    expect(point.category).toBe('Bão cấp 2');
  });
});

describe('Fill Storm Point Gaps', () => {
  it('should fill gaps in point array', () => {
    const points: StormPoint[] = [
      {
        timestamp: 1000,
        lat: 20.0,
        lng: 105.0,
        windSpeed: 100,
        pressure: 1000,
        category: 'Bão cấp 1',
      },
      null as any, // Gap
      {
        timestamp: 3000,
        lat: 22.0,
        lng: 107.0,
        windSpeed: 120,
        pressure: 980,
        category: 'Bão cấp 2',
      },
    ];

    const filled = fillStormPointGaps(points);
    expect(filled.length).toBeGreaterThan(2);
  });

  it('should handle empty array', () => {
    const filled = fillStormPointGaps([]);
    expect(filled).toHaveLength(0);
  });
});

describe('Sanitize Storm Point', () => {
  it('should provide defaults for invalid data', () => {
    const invalidPoint: StormPoint = {
      timestamp: -1,
      lat: 100,
      lng: 200,
      windSpeed: -50,
      pressure: 500,
      category: '',
    };

    const sanitized = sanitizeStormPoint(invalidPoint, {
      timestamp: Date.now(),
      lat: 20.0,
      lng: 105.0,
      windSpeed: 100,
      pressure: 1000,
      category: 'Unknown',
    });

    expect(sanitized.lat).toBe(20.0);
    expect(sanitized.lng).toBe(105.0);
    expect(sanitized.windSpeed).toBe(100);
  });
});

describe('User-Friendly Error Messages', () => {
  it('should return null for valid data', () => {
    const result = { isValid: true, errors: [], warnings: [] };
    expect(getUserFriendlyErrorMessage(result)).toBeNull();
  });

  it('should return message for coordinate errors', () => {
    const result = {
      isValid: false,
      errors: ['Invalid coordinates at point 0'],
      warnings: [],
    };
    const message = getUserFriendlyErrorMessage(result);
    expect(message).toBeTruthy();
    expect(message).toContain('vị trí');
  });
});

describe('Forecast Data Validation', () => {
  const stormWithForecast: Storm = {
    id: 'test-1',
    nameVi: 'Test Storm',
    nameEn: 'Test',
    status: 'active',
    lastPointTime: Date.now(),
    currentPosition: {
      timestamp: Date.now(),
      lat: 20.0,
      lng: 105.0,
      windSpeed: 100,
      pressure: 1000,
      category: 'Bão cấp 1',
    },
    historical: [],
    forecast: [
      {
        timestamp: Date.now() + 3600000,
        lat: 21.0,
        lng: 106.0,
        windSpeed: 110,
        pressure: 995,
        category: 'Bão cấp 1',
      },
    ],
    maxWindKmh: 100,
  };

  const stormWithoutForecast: Storm = {
    ...stormWithForecast,
    forecast: [],
  };

  it('should detect forecast data presence', () => {
    expect(hasForecastData(stormWithForecast)).toBe(true);
    expect(hasForecastData(stormWithoutForecast)).toBe(false);
  });

  it('should return message when no forecast', () => {
    const message = getForecastMessage(stormWithoutForecast);
    expect(message).toBeTruthy();
    expect(message).toContain('dự báo');
  });

  it('should return null when forecast exists', () => {
    const message = getForecastMessage(stormWithForecast);
    expect(message).toBeNull();
  });
});

describe('Complete Storm Validation', () => {
  const validStorm: Storm = {
    id: 'test-1',
    nameVi: 'Test Storm',
    nameEn: 'Test',
    status: 'active',
    lastPointTime: Date.now(),
    currentPosition: {
      timestamp: Date.now(),
      lat: 20.0,
      lng: 105.0,
      windSpeed: 100,
      pressure: 1000,
      category: 'Bão cấp 1',
    },
    historical: [
      {
        timestamp: Date.now() - 3600000,
        lat: 19.5,
        lng: 104.5,
        windSpeed: 90,
        pressure: 1005,
        category: 'Áp thấp nhiệt đới',
      },
    ],
    forecast: [
      {
        timestamp: Date.now() + 3600000,
        lat: 21.0,
        lng: 106.0,
        windSpeed: 110,
        pressure: 995,
        category: 'Bão cấp 2',
      },
    ],
    maxWindKmh: 110,
  };

  it('should validate complete storm data', () => {
    const result = validateStorm(validStorm);
    expect(result.isValid).toBe(true);
  });

  it('should detect missing current position', () => {
    const invalidStorm = { ...validStorm, currentPosition: null as any };
    const result = validateStorm(invalidStorm);
    expect(result.isValid).toBe(false);
  });

  it('should sanitize and return valid storm', () => {
    const sanitized = validateAndSanitizeStorm(validStorm);
    expect(sanitized).toBeTruthy();
    expect(sanitized?.id).toBe(validStorm.id);
  });

  it('should return null for critically invalid storm', () => {
    const invalidStorm = { ...validStorm, currentPosition: null as any };
    const sanitized = validateAndSanitizeStorm(invalidStorm);
    expect(sanitized).toBeNull();
  });
});
