/**
 * AnimatedStormPath Component
 * 
 * Manages progressive drawing animation of storm tracks with smooth marker movement.
 * Features animation state management, timestamp labels, and easing functions.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GradientStormTrack } from './GradientStormTrack';
import { HurricaneMarker } from './HurricaneMarker';
import { StormTooltip } from './StormTooltip';
import type { StormPoint } from '../../lib/stormData';
import {
  easeInOutCubic,
  interpolatePosition,
  type AnimationConfig,
  DEFAULT_ANIMATION_CONFIG,
} from '../../lib/stormAnimations';
import {
  globalAnimationFrameManager,
  globalAnimationQueue,
  getTargetFPS,
} from '../../lib/stormPerformance';
import { Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

/**
 * Animation state type
 */
type AnimationStatus = 'playing' | 'paused' | 'completed';

/**
 * Props for AnimatedStormPath component
 */
export interface AnimatedStormPathProps {
  /** Storm name for display */
  stormName: string;
  /** Storm ID for animation queue management */
  stormId: string;
  /** Array of storm points to animate */
  points: StormPoint[];
  /** Whether this is a historical track */
  isHistorical: boolean;
  /** Animation configuration (optional) */
  config?: Partial<AnimationConfig>;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Auto-start animation on mount */
  autoPlay?: boolean;
  /** Total number of active storms (for FPS adjustment) */
  activeStormCount?: number;
}

/**
 * AnimatedStormPath Component
 * 
 * Renders a storm track with progressive drawing animation.
 * Manages animation state, marker interpolation, and timestamp labels.
 * 
 * Requirements:
 * - 3.1: Draw Storm_Track progressively from start to end
 * - 3.2: Complete drawing animation within 3 seconds
 * - 3.3: Move Storm_Marker along track at constant speed
 * - 3.4: Display timestamp labels at key points during animation
 * - 3.5: Show all Storm_Markers along completed track when animation completes
 * - 6.1: Move Storm_Marker smoothly between points using linear interpolation
 * - 6.2: Maintain animation speed of 1 second per 6-hour time step
 * - 6.3: Update Storm_Marker position at 60 frames per second
 * - 6.4: Maintain current Storm_Marker position when paused
 * - 6.5: Display progress indicator showing current timestamp during animation
 */
export function AnimatedStormPath({
  stormName,
  stormId,
  points,
  isHistorical,
  config = {},
  onComplete,
  autoPlay = true,
  activeStormCount = 1,
}: AnimatedStormPathProps) {
  // Merge config with defaults and adjust FPS based on active storm count
  const targetFPS = getTargetFPS(activeStormCount);
  const animConfig: AnimationConfig = { 
    ...DEFAULT_ANIMATION_CONFIG, 
    ...config,
    fps: targetFPS,
  };

  // Animation state
  const [status, setStatus] = useState<AnimationStatus>(autoPlay ? 'playing' : 'paused');
  const [progress, setProgress] = useState<number>(0);
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0);
  const [isQueued, setIsQueued] = useState<boolean>(false);

  // Refs for animation control
  const startTimeRef = useRef<number | null>(null);
  const pausedProgressRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Don't render if we don't have enough points
  if (points.length < 2) {
    console.warn(
      `[AnimatedStormPath] Insufficient points for animation (${stormName}):`,
      points.length
    );
    return null;
  }

  // Validate points have valid coordinates
  const invalidPoints = points.filter(
    point => !point || typeof point.lat !== 'number' || typeof point.lng !== 'number'
  );

  if (invalidPoints.length > 0) {
    console.error(
      `[AnimatedStormPath] Invalid points detected in ${stormName}:`,
      invalidPoints.length,
      'out of',
      points.length
    );
  }

  /**
   * Calculate current marker position based on animation progress
   */
  const getCurrentMarkerPosition = useCallback(() => {
    try {
      if (progress >= 1) {
        // Animation complete - show last point
        return points[points.length - 1];
      }

      // Calculate which segment we're in
      const totalSegments = points.length - 1;
      const currentSegmentFloat = progress * totalSegments;
      const segmentIndex = Math.floor(currentSegmentFloat);
      const segmentProg = currentSegmentFloat - segmentIndex;

      // Clamp to valid range
      const safeIndex = Math.min(segmentIndex, points.length - 2);
      const startPoint = points[safeIndex];
      const endPoint = points[safeIndex + 1];

      // Validate points before interpolation
      if (!startPoint || !endPoint) {
        console.error('[AnimatedStormPath] Invalid points for interpolation');
        return points[0]; // Fallback to first point
      }

      // Interpolate position
      const position = interpolatePosition(startPoint, endPoint, segmentProg);
      const lat = Array.isArray(position) ? position[0] : position;
      const lng = Array.isArray(position) ? position[1] : position;

      // Validate interpolated values
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        console.error('[AnimatedStormPath] Invalid interpolated position:', { lat, lng });
        return startPoint; // Fallback to start point
      }

      // Create interpolated point with blended properties
      return {
        ...startPoint,
        lat,
        lng,
        windSpeed: startPoint.windSpeed + (endPoint.windSpeed - startPoint.windSpeed) * segmentProg,
        pressure: startPoint.pressure + (endPoint.pressure - startPoint.pressure) * segmentProg,
      };
    } catch (error) {
      console.error('[AnimatedStormPath] Error calculating marker position:', error);
      return points[0]; // Fallback to first point
    }
  }, [progress, points]);

  /**
   * Animation loop using requestAnimationFrame with FPS throttling
   */
  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
      lastFrameTimeRef.current = timestamp;
    }

    // Throttle to target FPS
    const frameInterval = 1000 / animConfig.fps;
    const timeSinceLastFrame = timestamp - lastFrameTimeRef.current;

    if (timeSinceLastFrame < frameInterval) {
      // Not enough time has passed, skip this frame
      const frameId = requestAnimationFrame(animate);
      globalAnimationFrameManager.registerFrame(stormId, frameId);
      return;
    }

    lastFrameTimeRef.current = timestamp;

    const elapsed = timestamp - startTimeRef.current;
    const rawProgress = elapsed / animConfig.duration;

    // Apply easing function
    let easedProgress: number;
    if (animConfig.easing === 'ease-in-out') {
      easedProgress = easeInOutCubic(Math.min(rawProgress, 1));
    } else if (animConfig.easing === 'ease-out') {
      easedProgress = Math.min(rawProgress, 1);
    } else {
      easedProgress = Math.min(rawProgress, 1);
    }

    setProgress(easedProgress);

    // Calculate current segment for timestamp display
    const totalSegments = points.length - 1;
    const currentSegmentFloat = easedProgress * totalSegments;
    const segmentIndex = Math.floor(currentSegmentFloat);

    setCurrentPointIndex(Math.min(segmentIndex, points.length - 1));

    // Continue animation if not complete
    if (rawProgress < 1) {
      const frameId = requestAnimationFrame(animate);
      globalAnimationFrameManager.registerFrame(stormId, frameId);
    } else {
      setStatus('completed');
      setProgress(1);
      globalAnimationQueue.completeAnimation(stormId);
      if (onComplete) {
        onComplete();
      }
    }
  }, [animConfig.duration, animConfig.easing, animConfig.fps, points.length, onComplete, stormId]);

  /**
   * Start or resume animation
   */
  const play = useCallback(() => {
    if (status === 'completed') {
      // Reset animation
      setProgress(0);
      setCurrentPointIndex(0);
      startTimeRef.current = null;
      pausedProgressRef.current = 0;
      lastFrameTimeRef.current = 0;
    }

    // Request animation slot from queue
    const started = globalAnimationQueue.requestAnimation(stormId, () => {
      setStatus('playing');
      setIsQueued(false);
    });

    if (!started) {
      setIsQueued(true);
    }
  }, [status, stormId]);

  /**
   * Pause animation
   */
  const pause = useCallback(() => {
    globalAnimationFrameManager.cancelFrame(stormId);
    globalAnimationQueue.completeAnimation(stormId);
    pausedProgressRef.current = progress;
    setStatus('paused');
    setIsQueued(false);
  }, [progress, stormId]);

  /**
   * Reset animation to beginning
   */
  const reset = useCallback(() => {
    globalAnimationFrameManager.cancelFrame(stormId);
    globalAnimationQueue.cancelAnimation(stormId);
    setProgress(0);
    setCurrentPointIndex(0);
    startTimeRef.current = null;
    pausedProgressRef.current = 0;
    lastFrameTimeRef.current = 0;
    setStatus('paused');
    setIsQueued(false);
  }, [stormId]);

  // Expose control methods (can be used with ref in future)
  // These are intentionally defined but not used in the component itself
  // They are available for external control if needed
  void play;
  void pause;
  void reset;

  /**
   * Effect to manage animation lifecycle
   */
  useEffect(() => {
    if (status === 'playing') {
      // Adjust start time if resuming from pause
      if (pausedProgressRef.current > 0 && startTimeRef.current === null) {
        const elapsedTime = pausedProgressRef.current * animConfig.duration;
        startTimeRef.current = performance.now() - elapsedTime;
      }

      const frameId = requestAnimationFrame(animate);
      globalAnimationFrameManager.registerFrame(stormId, frameId);
    }

    // Cleanup on unmount or status change
    return () => {
      globalAnimationFrameManager.cleanup(stormId);
    };
  }, [status, animate, animConfig.duration, stormId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      globalAnimationFrameManager.cleanup(stormId);
      globalAnimationQueue.cancelAnimation(stormId);
    };
  }, [stormId]);

  /**
   * Get current marker position
   */
  const currentMarker = getCurrentMarkerPosition();

  /**
   * Determine which points should show timestamp labels
   */
  const shouldShowTimestamp = (index: number): boolean => {
    if (!animConfig.showTimestamps) return false;
    
    // Show timestamp at key points based on interval
    return index % animConfig.timestampInterval === 0 || index === points.length - 1;
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get next point for rotation calculation
   */
  const getNextPoint = (): StormPoint | undefined => {
    if (progress >= 1) {
      return undefined;
    }

    const nextIndex = Math.min(currentPointIndex + 1, points.length - 1);
    return points[nextIndex];
  };

  /**
   * Get previous point for intensity change detection
   */
  const getPreviousPoint = (): StormPoint | undefined => {
    if (currentPointIndex === 0) {
      return undefined;
    }

    return points[currentPointIndex - 1];
  };

  return (
    <>
      {/* Queued animation indicator */}
      {isQueued && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          Animation queued for {stormName}...
        </div>
      )}

      {/* Progressive storm track */}
      <GradientStormTrack
        points={points}
        isHistorical={isHistorical}
        isAnimating={status === 'playing'}
        animationProgress={progress}
      />

      {/* Animated marker during animation */}
      {status !== 'completed' && (
        <HurricaneMarker
          position={currentMarker}
          nextPosition={getNextPoint()}
          previousPosition={getPreviousPoint()}
          isPulsing={true}
          useIntensitySize={true}
          showIntensityGlow={false}
        >
          <StormTooltip
            stormName={stormName}
            stormData={currentMarker}
            permanent={false}
          />
        </HurricaneMarker>
      )}

      {/* Show all markers when animation is complete */}
      {status === 'completed' && points.map((point, index) => (
        <HurricaneMarker
          key={`marker-${index}`}
          position={point}
          nextPosition={points[index + 1]}
          previousPosition={points[index - 1]}
          isPulsing={index === points.length - 1}
          useIntensitySize={true}
          showIntensityGlow={false}
        >
          <StormTooltip
            stormName={stormName}
            stormData={point}
            permanent={false}
          />
        </HurricaneMarker>
      ))}

      {/* Timestamp labels at key points during animation */}
      {animConfig.showTimestamps && status === 'playing' && (
        <>
          {points.slice(0, currentPointIndex + 1).map((point, index) => {
            if (!shouldShowTimestamp(index)) return null;

            const icon = divIcon({
              html: `
                <div class="storm-timestamp-label">
                  ${formatTimestamp(point.timestamp)}
                </div>
              `,
              className: 'storm-timestamp-marker',
              iconSize: [80, 20],
              iconAnchor: [40, -5],
            });

            return (
              <Marker
                key={`timestamp-${index}`}
                position={[point.lat, point.lng]}
                icon={icon}
              />
            );
          })}
        </>
      )}

      {/* Timestamp labels for completed animation */}
      {animConfig.showTimestamps && status === 'completed' && (
        <>
          {points.map((point, index) => {
            if (!shouldShowTimestamp(index)) return null;

            const icon = divIcon({
              html: `
                <div class="storm-timestamp-label">
                  ${formatTimestamp(point.timestamp)}
                </div>
              `,
              className: 'storm-timestamp-marker',
              iconSize: [80, 20],
              iconAnchor: [40, -5],
            });

            return (
              <Marker
                key={`timestamp-${index}`}
                position={[point.lat, point.lng]}
                icon={icon}
              />
            );
          })}
        </>
      )}

      {/* Styling for timestamp labels */}
      <style>{`
        .storm-timestamp-marker {
          background: transparent !important;
          border: none !important;
        }

        .storm-timestamp-label {
          background: rgba(30, 30, 30, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          text-align: center;
          pointer-events: none;
        }

        /* Animation for timestamp labels appearing */
        @keyframes timestamp-fade-in {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .storm-timestamp-label {
          animation: timestamp-fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

// Export animation control methods for external use
export type AnimatedStormPathHandle = {
  play: () => void;
  pause: () => void;
  reset: () => void;
  status: AnimationStatus;
  progress: number;
};

export default AnimatedStormPath;
