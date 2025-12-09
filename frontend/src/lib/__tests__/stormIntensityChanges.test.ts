/**
 * Tests for Storm Intensity Change Detection
 * 
 * Verifies intensity change detection, marker sizing, and color transitions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateIntensityMarkerSize,
  isMajorHurricane,
  detectIntensityChange,
  getTransitionColor,
  analyzeIntensityChange,
  getIntensityChangePoints,
  calculateIntensityScore,
} from '../stormIntensityChanges';
import type { StormPoint } from '../stormData';

describe('Storm Intensity Changes', () => {
  describe('calculateIntensityMarkerSize', () => {
    it('should return minimum size for low wind speeds', () => {
      const size = calculateIntensityMarkerSize(30, 'TD');
      expect(size).toBe(20);
    });

    it('should return maximum size for high wind speeds', () => {
      const size = calculateIntensityMarkerSize(200, 'C5');
      expect(size).toBeLessThanOrEqual(40);
    });

    it('should boost size for major hurricanes', () => {
      const c2Size = calculateIntensityMarkerSize(150, 'C2');
      const c3Size = calculateIntensityMarkerSize(150, 'C3');
      expect(c3Size).toBeGreaterThan(c2Size);
    });

    it('should ensure minimum 32px for major hurricanes', () => {
      const size = calculateIntensityMarkerSize(100, 'C3');
      expect(size).toBeGreaterThanOrEqual(32);
    });
  });

  describe('isMajorHurricane', () => {
    it('should return true for Category 3', () => {
      expect(isMajorHurricane('C3')).toBe(true);
    });

    it('should return true for Category 4', () => {
      expect(isMajorHurricane('C4')).toBe(true);
    });

    it('should return true for Category 5', () => {
      expect(isMajorHurricane('C5')).toBe(true);
    });

    it('should return false for Category 2', () => {
      expect(isMajorHurricane('C2')).toBe(false);
    });

    it('should return false for Tropical Storm', () => {
      expect(isMajorHurricane('TS')).toBe(false);
    });
  });

  describe('detectIntensityChange', () => {
    it('should detect intensification from category change', () => {
      const prev: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      const curr: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 155,
        pressure: 970,
        category: 'C2',
      };
      expect(detectIntensityChange(prev, curr)).toBe('intensifying');
    });

    it('should detect weakening from category change', () => {
      const prev: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 155,
        pressure: 970,
        category: 'C2',
      };
      const curr: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      expect(detectIntensityChange(prev, curr)).toBe('weakening');
    });

    it('should detect intensification from wind speed increase', () => {
      const prev: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      const curr: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 135,
        pressure: 980,
        category: 'C1',
      };
      expect(detectIntensityChange(prev, curr)).toBe('intensifying');
    });

    it('should detect stable intensity', () => {
      const prev: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      const curr: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 122,
        pressure: 984,
        category: 'C1',
      };
      expect(detectIntensityChange(prev, curr)).toBe('stable');
    });
  });

  describe('getTransitionColor', () => {
    it('should return same color for same category', () => {
      const from: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      const to: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 125,
        pressure: 983,
        category: 'C1',
      };
      const color = getTransitionColor(from, to, 0.5);
      expect(color).toBe('#FFC107'); // C1 yellow
    });

    it('should interpolate between different categories', () => {
      const from: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      const to: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 155,
        pressure: 970,
        category: 'C2',
      };
      const color = getTransitionColor(from, to, 0.5);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).not.toBe('#FFC107'); // Not pure C1
      expect(color).not.toBe('#FF9800'); // Not pure C2
    });
  });

  describe('analyzeIntensityChange', () => {
    it('should provide detailed analysis of intensification', () => {
      const prev: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      const curr: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 155,
        pressure: 970,
        category: 'C2',
      };
      const analysis = analyzeIntensityChange(prev, curr);
      
      expect(analysis.changeType).toBe('intensifying');
      expect(analysis.windSpeedDelta).toBe(35);
      expect(analysis.categoryChanged).toBe(true);
      expect(analysis.shouldShowGlow).toBe(true);
    });

    it('should not show glow for weakening', () => {
      const prev: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 155,
        pressure: 970,
        category: 'C2',
      };
      const curr: StormPoint = {
        timestamp: Date.now(),
        lat: 15.5,
        lng: 110.5,
        windSpeed: 120,
        pressure: 985,
        category: 'C1',
      };
      const analysis = analyzeIntensityChange(prev, curr);
      
      expect(analysis.changeType).toBe('weakening');
      expect(analysis.shouldShowGlow).toBe(false);
    });
  });

  describe('getIntensityChangePoints', () => {
    it('should identify all intensity change points', () => {
      const points: StormPoint[] = [
        { timestamp: Date.now(), lat: 15, lng: 110, windSpeed: 65, pressure: 1000, category: 'TS' },
        { timestamp: Date.now(), lat: 15.5, lng: 110.5, windSpeed: 120, pressure: 985, category: 'C1' },
        { timestamp: Date.now(), lat: 16, lng: 111, windSpeed: 125, pressure: 983, category: 'C1' },
        { timestamp: Date.now(), lat: 16.5, lng: 111.5, windSpeed: 155, pressure: 970, category: 'C2' },
      ];
      
      const changePoints = getIntensityChangePoints(points);
      expect(changePoints).toContain(1); // TS -> C1
      expect(changePoints).toContain(3); // C1 -> C2
      expect(changePoints).not.toContain(2); // C1 -> C1 (stable)
    });
  });

  describe('calculateIntensityScore', () => {
    it('should give higher score to more intense storms', () => {
      const ts: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 65,
        pressure: 1000,
        category: 'TS',
      };
      const c5: StormPoint = {
        timestamp: Date.now(),
        lat: 15,
        lng: 110,
        windSpeed: 250,
        pressure: 915,
        category: 'C5',
      };
      
      expect(calculateIntensityScore(c5)).toBeGreaterThan(calculateIntensityScore(ts));
    });
  });
});
