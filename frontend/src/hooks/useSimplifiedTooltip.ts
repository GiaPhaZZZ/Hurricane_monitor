/**
 * useSimplifiedTooltip Hook
 * 
 * Manages simplified tooltip state with automatic closest-point detection.
 * Handles hover interactions and ensures only one tooltip shows at a time.
 * 
 * Requirement 5.6: Show only closest point's tooltip when multiple nearby
 */

import { useState, useCallback, useRef } from 'react';
import type { StormPoint } from '../components/storm/HurricaneMarker';

/**
 * Tooltip state interface
 */
export interface TooltipState {
  stormData: StormPoint | null;
  position: { x: number; y: number };
  isVisible: boolean;
}

/**
 * Calculate distance between two points in pixels
 */
function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Hook for managing simplified tooltip state
 * 
 * Features:
 * - Automatic closest-point detection
 * - Hover delay handling
 * - Single tooltip guarantee
 * 
 * @returns Tooltip state and control functions
 */
export function useSimplifiedTooltip() {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    stormData: null,
    position: { x: 0, y: 0 },
    isVisible: false,
  });

  const hoveredPointsRef = useRef<Map<string, { point: StormPoint; position: { x: number; y: number } }>>(
    new Map()
  );

  /**
   * Show tooltip for a storm point
   * Requirement 5.6: Show only closest point's tooltip when multiple nearby
   */
  const showTooltip = useCallback((
    stormData: StormPoint,
    position: { x: number; y: number },
    pointId: string
  ) => {
    // Add to hovered points
    hoveredPointsRef.current.set(pointId, { point: stormData, position });

    // Find closest point to cursor
    let closestPoint: StormPoint | null = null;
    let closestDistance = Infinity;
    let closestPosition = position;

    hoveredPointsRef.current.forEach(({ point, position: pointPos }) => {
      const distance = calculateDistance(position, pointPos);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
        closestPosition = pointPos;
      }
    });

    // Show tooltip for closest point only
    if (closestPoint) {
      setTooltipState({
        stormData: closestPoint,
        position: closestPosition,
        isVisible: true,
      });
    }
  }, []);

  /**
   * Hide tooltip for a storm point
   */
  const hideTooltip = useCallback((pointId: string) => {
    // Remove from hovered points
    hoveredPointsRef.current.delete(pointId);

    // If no more hovered points, hide tooltip
    if (hoveredPointsRef.current.size === 0) {
      setTooltipState((prev) => ({
        ...prev,
        isVisible: false,
      }));
    } else {
      // Otherwise, show tooltip for remaining closest point
      let closestPoint: StormPoint | null = null;
      let closestDistance = Infinity;
      let closestPosition = { x: 0, y: 0 };

      hoveredPointsRef.current.forEach(({ point, position }) => {
        const distance = calculateDistance(tooltipState.position, position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = point;
          closestPosition = position;
        }
      });

      if (closestPoint) {
        setTooltipState({
          stormData: closestPoint,
          position: closestPosition,
          isVisible: true,
        });
      }
    }
  }, [tooltipState.position]);

  /**
   * Update cursor position (for tracking mouse movement)
   */
  const updatePosition = useCallback((position: { x: number; y: number }) => {
    setTooltipState((prev) => ({
      ...prev,
      position,
    }));
  }, []);

  /**
   * Clear all tooltips
   */
  const clearTooltips = useCallback(() => {
    hoveredPointsRef.current.clear();
    setTooltipState({
      stormData: null,
      position: { x: 0, y: 0 },
      isVisible: false,
    });
  }, []);

  return {
    tooltipState,
    showTooltip,
    hideTooltip,
    updatePosition,
    clearTooltips,
  };
}

export default useSimplifiedTooltip;
