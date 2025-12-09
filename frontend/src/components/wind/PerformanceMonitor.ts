/**
 * PerformanceMonitor Class
 * 
 * Tracks FPS and provides adaptive particle count scaling for optimal performance.
 * Implements automatic performance adjustments based on frame rate.
 * 
 * Requirements: 8.1, 8.2, 8.3
 */

import type { PerformanceMetrics } from './types';

const TARGET_FPS = 60;
const MIN_FPS = 30;
const MAX_FPS_FOR_INCREASE = 50;
const FPS_SAMPLE_SIZE = 60; // Number of frames to average
const ADJUSTMENT_COOLDOWN = 5000; // 5 seconds between adjustments
const MIN_PARTICLE_COUNT = 500;
const MAX_PARTICLE_COUNT_DESKTOP = 5000;
const MAX_PARTICLE_COUNT_MOBILE = 1000;
const MAX_PARTICLE_COUNT_TABLET = 2000;

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private lastAdjustmentTime: number = 0;
  private currentParticleCount: number = 3000;
  private consecutiveLowFPS: number = 0;
  private consecutiveHighFPS: number = 0;
  private deviceType: 'mobile' | 'tablet' | 'desktop';
  private maxParticleCount: number;

  constructor() {
    this.deviceType = this.detectDeviceType();
    this.maxParticleCount = this.getMaxParticleCountForDevice();
  }

  /**
   * Detect device type based on user agent and screen size
   * Requirements: 8.1, 8.3
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
    
    // Also check screen size
    const screenWidth = window.innerWidth;
    
    if (isMobile && screenWidth < 768) {
      return 'mobile';
    } else if (isTablet || (screenWidth >= 768 && screenWidth < 1024)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Get maximum particle count based on device type
   * Requirements: 8.1, 8.3
   */
  private getMaxParticleCountForDevice(): number {
    switch (this.deviceType) {
      case 'mobile':
        return MAX_PARTICLE_COUNT_MOBILE;
      case 'tablet':
        return MAX_PARTICLE_COUNT_TABLET;
      case 'desktop':
        return MAX_PARTICLE_COUNT_DESKTOP;
    }
  }

  /**
   * Record a frame time for FPS calculation
   * Requirements: 8.1
   */
  recordFrame(deltaTime: number): void {
    this.frameTimes.push(deltaTime);

    // Keep only recent frames
    if (this.frameTimes.length > FPS_SAMPLE_SIZE) {
      this.frameTimes.shift();
    }
  }

  /**
   * Calculate current FPS based on recent frame times
   * Requirements: 8.1
   */
  getCurrentFPS(): number {
    if (this.frameTimes.length === 0) {
      return TARGET_FPS;
    }

    const averageFrameTime = this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
    return Math.round(1000 / averageFrameTime);
  }

  /**
   * Get average frame time in milliseconds
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) {
      return 1000 / TARGET_FPS;
    }

    return this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length;
  }

  /**
   * Check if particle count should be reduced
   * Requirements: 8.2
   */
  shouldReduceParticles(): boolean {
    const currentFPS = this.getCurrentFPS();
    const now = Date.now();

    // Check if FPS is below threshold
    if (currentFPS < MIN_FPS) {
      this.consecutiveLowFPS++;
      this.consecutiveHighFPS = 0;

      // Require consistent low FPS before reducing
      if (this.consecutiveLowFPS >= 3) {
        // Check cooldown period
        if (now - this.lastAdjustmentTime > ADJUSTMENT_COOLDOWN) {
          this.lastAdjustmentTime = now;
          this.consecutiveLowFPS = 0;
          return true;
        }
      }
    } else {
      this.consecutiveLowFPS = 0;
    }

    return false;
  }

  /**
   * Check if particle count should be increased
   * Requirements: 8.3
   */
  shouldIncreaseParticles(): boolean {
    const currentFPS = this.getCurrentFPS();
    const now = Date.now();

    // Check if FPS is consistently high
    if (currentFPS > MAX_FPS_FOR_INCREASE) {
      this.consecutiveHighFPS++;
      this.consecutiveLowFPS = 0;

      // Require 5 seconds of high FPS before increasing
      if (this.consecutiveHighFPS >= 300) { // ~5 seconds at 60fps
        // Check cooldown period
        if (now - this.lastAdjustmentTime > ADJUSTMENT_COOLDOWN) {
          this.lastAdjustmentTime = now;
          this.consecutiveHighFPS = 0;
          return true;
        }
      }
    } else {
      this.consecutiveHighFPS = 0;
    }

    return false;
  }

  /**
   * Get adaptive particle count based on current performance
   * Requirements: 8.1, 8.2, 8.3
   */
  getAdaptiveParticleCount(requestedCount: number): number {
    // Clamp to device-specific bounds
    const clampedCount = Math.max(
      MIN_PARTICLE_COUNT, 
      Math.min(requestedCount, this.maxParticleCount)
    );

    this.currentParticleCount = clampedCount;
    return clampedCount;
  }

  /**
   * Get maximum particle count for current device
   */
  getMaxParticleCount(): number {
    return this.maxParticleCount;
  }

  /**
   * Get current device type
   */
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    return this.deviceType;
  }

  /**
   * Calculate reduced particle count (25% reduction)
   * Requirements: 8.2
   */
  getReducedParticleCount(currentCount: number): number {
    const reduced = Math.floor(currentCount * 0.75);
    return Math.max(MIN_PARTICLE_COUNT, reduced);
  }

  /**
   * Calculate increased particle count (10% increase)
   * Requirements: 8.3
   */
  getIncreasedParticleCount(currentCount: number, maxCount: number): number {
    const increased = Math.floor(currentCount * 1.1);
    return Math.min(increased, maxCount);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.getCurrentFPS(),
      frameTime: this.getAverageFrameTime(),
      particleCount: this.currentParticleCount,
      lastAdjustmentTime: this.lastAdjustmentTime,
    };
  }

  /**
   * Reset performance tracking
   */
  reset(): void {
    this.frameTimes = [];
    this.consecutiveLowFPS = 0;
    this.consecutiveHighFPS = 0;
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceAcceptable(): boolean {
    return this.getCurrentFPS() >= MIN_FPS;
  }

  /**
   * Get performance status
   */
  getPerformanceStatus(): 'excellent' | 'good' | 'poor' {
    const fps = this.getCurrentFPS();

    if (fps >= TARGET_FPS) {
      return 'excellent';
    } else if (fps >= MIN_FPS) {
      return 'good';
    } else {
      return 'poor';
    }
  }
}
