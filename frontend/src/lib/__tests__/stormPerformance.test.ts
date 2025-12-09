/**
 * Tests for Storm Performance Optimization Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  simplifyTrack,
  shouldSimplifyTrack,
  getTrackForZoomLevel,
  AnimationQueue,
  getTargetFPS,
  AnimationFrameManager,
  PERFORMANCE_CONFIG,
} from '../stormPerformance';
import type { StormPoint } from '../stormData';

describe('Storm Performance Optimization', () => {
  describe('simplifyTrack', () => {
    it('should return original points if less than 3 points', () => {
      const points: StormPoint[] = [
        { timestamp: 0, lat: 0, lng: 0, windSpeed: 100, pressure: 1000, category: 'TS' },
        { timestamp: 1, lat: 1, lng: 1, windSpeed: 110, pressure: 995, category: 'TS' },
      ];

      const result = simplifyTrack(points);
      expect(result).toEqual(points);
    });

    it('should simplify a straight line to endpoints', () => {
      const points: StormPoint[] = [
        { timestamp: 0, lat: 0, lng: 0, windSpeed: 100, pressure: 1000, category: 'TS' },
        { timestamp: 1, lat: 1, lng: 1, windSpeed: 105, pressure: 998, category: 'TS' },
        { timestamp: 2, lat: 2, lng: 2, windSpeed: 110, pressure: 995, category: 'TS' },
        { timestamp: 3, lat: 3, lng: 3, windSpeed: 115, pressure: 992, category: 'TS' },
      ];

      const result = simplifyTrack(points, 0.01);
      expect(result.length).toBeLessThan(points.length);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });

    it('should preserve significant points in curved path', () => {
      const points: StormPoint[] = [
        { timestamp: 0, lat: 0, lng: 0, windSpeed: 100, pressure: 1000, category: 'TS' },
        { timestamp: 1, lat: 1, lng: 0, windSpeed: 105, pressure: 998, category: 'TS' },
        { timestamp: 2, lat: 1, lng: 1, windSpeed: 110, pressure: 995, category: 'TS' },
        { timestamp: 3, lat: 0, lng: 1, windSpeed: 115, pressure: 992, category: 'TS' },
      ];

      const result = simplifyTrack(points, 0.01);
      // Should keep more points for curved path
      expect(result.length).toBeGreaterThan(2);
    });
  });

  describe('shouldSimplifyTrack', () => {
    it('should return false for tracks with <= 100 points', () => {
      const points = Array(100).fill(null).map((_, i) => ({
        timestamp: i,
        lat: i,
        lng: i,
        windSpeed: 100,
        pressure: 1000,
        category: 'TS',
      }));

      expect(shouldSimplifyTrack(points)).toBe(false);
    });

    it('should return true for tracks with > 100 points', () => {
      const points = Array(101).fill(null).map((_, i) => ({
        timestamp: i,
        lat: i,
        lng: i,
        windSpeed: 100,
        pressure: 1000,
        category: 'TS',
      }));

      expect(shouldSimplifyTrack(points)).toBe(true);
    });
  });

  describe('getTrackForZoomLevel', () => {
    const createPoints = (count: number): StormPoint[] =>
      Array(count).fill(null).map((_, i) => ({
        timestamp: i,
        lat: i,
        lng: i,
        windSpeed: 100,
        pressure: 1000,
        category: 'TS',
      }));

    it('should return simplified track at low zoom levels for large tracks', () => {
      const points = createPoints(150);
      const result = getTrackForZoomLevel(points, 5);

      expect(result.length).toBeLessThan(points.length);
    });

    it('should return full resolution at high zoom levels', () => {
      const points = createPoints(150);
      const result = getTrackForZoomLevel(points, 8);

      expect(result).toEqual(points);
    });

    it('should return original points for small tracks regardless of zoom', () => {
      const points = createPoints(50);
      const lowZoomResult = getTrackForZoomLevel(points, 5);
      const highZoomResult = getTrackForZoomLevel(points, 8);

      expect(lowZoomResult).toEqual(points);
      expect(highZoomResult).toEqual(points);
    });
  });

  describe('AnimationQueue', () => {
    let queue: AnimationQueue;

    beforeEach(() => {
      queue = new AnimationQueue(3); // Max 3 simultaneous
    });

    it('should start animations immediately when under limit', () => {
      let started = false;
      const result = queue.requestAnimation('storm1', () => {
        started = true;
      });

      expect(result).toBe(true);
      expect(started).toBe(true);
      expect(queue.getActiveCount()).toBe(1);
    });

    it('should queue animations when at limit', () => {
      // Fill up to limit
      queue.requestAnimation('storm1', () => {});
      queue.requestAnimation('storm2', () => {});
      queue.requestAnimation('storm3', () => {});

      // This should be queued
      let started = false;
      const result = queue.requestAnimation('storm4', () => {
        started = true;
      });

      expect(result).toBe(false);
      expect(started).toBe(false);
      expect(queue.getActiveCount()).toBe(3);
      expect(queue.getQueuedCount()).toBe(1);
    });

    it('should start queued animation when one completes', () => {
      // Fill up to limit
      queue.requestAnimation('storm1', () => {});
      queue.requestAnimation('storm2', () => {});
      queue.requestAnimation('storm3', () => {});

      // Queue one
      let queuedStarted = false;
      queue.requestAnimation('storm4', () => {
        queuedStarted = true;
      });

      // Complete one
      queue.completeAnimation('storm1');

      expect(queuedStarted).toBe(true);
      expect(queue.getActiveCount()).toBe(3);
      expect(queue.getQueuedCount()).toBe(0);
    });

    it('should cancel queued animations', () => {
      // Fill up to limit
      queue.requestAnimation('storm1', () => {});
      queue.requestAnimation('storm2', () => {});
      queue.requestAnimation('storm3', () => {});

      // Queue one
      queue.requestAnimation('storm4', () => {});

      expect(queue.getQueuedCount()).toBe(1);

      // Cancel it
      queue.cancelAnimation('storm4');

      expect(queue.getQueuedCount()).toBe(0);
    });

    it('should clear all animations', () => {
      queue.requestAnimation('storm1', () => {});
      queue.requestAnimation('storm2', () => {});
      queue.requestAnimation('storm3', () => {});
      queue.requestAnimation('storm4', () => {});

      queue.clear();

      expect(queue.getActiveCount()).toBe(0);
      expect(queue.getQueuedCount()).toBe(0);
    });
  });

  describe('getTargetFPS', () => {
    it('should return normal FPS for <= 3 active storms', () => {
      expect(getTargetFPS(1)).toBe(PERFORMANCE_CONFIG.NORMAL_FPS);
      expect(getTargetFPS(2)).toBe(PERFORMANCE_CONFIG.NORMAL_FPS);
      expect(getTargetFPS(3)).toBe(PERFORMANCE_CONFIG.NORMAL_FPS);
    });

    it('should return reduced FPS for > 3 active storms', () => {
      expect(getTargetFPS(4)).toBe(PERFORMANCE_CONFIG.REDUCED_FPS);
      expect(getTargetFPS(5)).toBe(PERFORMANCE_CONFIG.REDUCED_FPS);
      expect(getTargetFPS(10)).toBe(PERFORMANCE_CONFIG.REDUCED_FPS);
    });
  });

  describe('AnimationFrameManager', () => {
    let manager: AnimationFrameManager;

    beforeEach(() => {
      manager = new AnimationFrameManager();
    });

    it('should register and cancel animation frames', () => {
      const frameId = 123;
      manager.registerFrame('test', frameId);

      expect(manager.getActiveFrameCount()).toBe(1);

      manager.cancelFrame('test');

      expect(manager.getActiveFrameCount()).toBe(0);
    });

    it('should replace existing frame when registering with same id', () => {
      manager.registerFrame('test', 123);
      manager.registerFrame('test', 456);

      expect(manager.getActiveFrameCount()).toBe(1);
    });

    it('should track event listeners', () => {
      const element = document.createElement('div');
      const listener = () => {};

      manager.registerEventListener('test', element, 'click', listener);

      expect(manager.getEventListenerCount()).toBe(1);
    });

    it('should remove event listeners', () => {
      const element = document.createElement('div');
      const listener = () => {};

      manager.registerEventListener('test', element, 'click', listener);
      manager.removeEventListeners('test');

      expect(manager.getEventListenerCount()).toBe(0);
    });

    it('should cleanup all resources for a component', () => {
      const element = document.createElement('div');
      const listener = () => {};

      manager.registerFrame('test', 123);
      manager.registerEventListener('test', element, 'click', listener);

      manager.cleanup('test');

      expect(manager.getActiveFrameCount()).toBe(0);
      expect(manager.getEventListenerCount()).toBe(0);
    });

    it('should cleanup all resources', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      manager.registerFrame('test1', 123);
      manager.registerFrame('test2', 456);
      manager.registerEventListener('test1', element1, 'click', () => {});
      manager.registerEventListener('test2', element2, 'click', () => {});

      manager.cleanupAll();

      expect(manager.getActiveFrameCount()).toBe(0);
      expect(manager.getEventListenerCount()).toBe(0);
    });
  });
});
