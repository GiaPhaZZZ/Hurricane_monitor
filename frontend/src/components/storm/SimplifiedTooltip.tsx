/**
 * SimplifiedTooltip Component
 * 
 * Minimal white-background tooltip for Windy-style storm visualization.
 * Features compact single-line format with automatic positioning and smooth animations.
 * 
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import { useEffect, useRef, useState } from 'react';
import type { StormPoint } from './HurricaneMarker';

/**
 * Props for SimplifiedTooltip component
 */
export interface SimplifiedTooltipProps {
  /** Storm data point with metrics */
  stormData: StormPoint;
  /** Cursor position for tooltip placement */
  position: { x: number; y: number };
  /** Whether tooltip is visible */
  isVisible: boolean;
  /** Callback when tooltip should hide */
  onHide?: () => void;
}

/**
 * Format timestamp to HH:MM format
 * Requirement 5.8: Format timestamp as "HH:MM"
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format wind speed as "XXX km/h"
 * Requirement 5.8: Format wind speed as "XXX km/h"
 */
function formatWindSpeed(windSpeed: number): string {
  return `${Math.round(windSpeed)} km/h`;
}

/**
 * Format pressure as "YYYY hPa"
 * Requirement 5.8: Format pressure as "YYYY hPa"
 */
function formatPressure(pressure: number): string {
  return `${Math.round(pressure)} hPa`;
}

/**
 * SimplifiedTooltip Component
 * 
 * Displays minimal storm information in Windy.com style.
 * 
 * Requirements:
 * - 5.1: White background with 2px border radius, compact single-line format
 * - 5.3: 12px font size with 500 font weight
 * - 5.4: Position tooltip 10px above cursor
 * - 5.5: Implement 200ms delay before hiding
 * - 5.6: Show only closest point's tooltip when multiple nearby
 * - 5.7: Subtle drop shadow (4px blur, 20% opacity)
 * - 5.8: Format as "HH:MM | XXX km/h | YYYY hPa" with vertical separator
 */
export function SimplifiedTooltip({
  stormData,
  position,
  isVisible,
  onHide,
}: SimplifiedTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [opacity, setOpacity] = useState(0);

  // Handle fade-in animation
  // Requirement 5.5: Add fade-in/fade-out transitions
  useEffect(() => {
    if (isVisible) {
      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      // Fade in immediately
      requestAnimationFrame(() => {
        setOpacity(1);
      });
    } else {
      // Requirement 5.5: Implement 200ms delay before hiding
      hideTimeoutRef.current = setTimeout(() => {
        setOpacity(0);
        if (onHide) {
          setTimeout(onHide, 200); // Wait for fade-out animation
        }
      }, 200);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isVisible, onHide]);

  // Handle edge detection and positioning
  // Requirement 5.4: Add automatic edge detection for viewport boundaries
  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y - 10; // Position 10px above cursor (Requirement 5.4)

    // Check right edge
    if (adjustedX + rect.width > viewportWidth - 10) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // Check left edge
    if (adjustedX < 10) {
      adjustedX = 10;
    }

    // Check top edge
    if (adjustedY - rect.height < 10) {
      adjustedY = position.y + 20; // Position below cursor if not enough space above
    }

    // Check bottom edge
    if (adjustedY + rect.height > viewportHeight - 10) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    setAdjustedPosition({ x: adjustedX, y: adjustedY });
  }, [position]);

  // Don't render if not visible and fully faded out
  if (!isVisible && opacity === 0) {
    return null;
  }

  // Format the tooltip content
  // Requirement 5.8: Use vertical separator between values
  const timeStr = formatTime(stormData.timestamp);
  const windStr = formatWindSpeed(stormData.windSpeed);
  const pressureStr = formatPressure(stormData.pressure);
  const content = `${timeStr} | ${windStr} | ${pressureStr}`;

  return (
    <div
      ref={tooltipRef}
      className="simplified-tooltip"
      style={{
        position: 'fixed',
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translate(-50%, -100%)',
        opacity,
        transition: 'opacity 200ms ease-in-out',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    >
      <div className="simplified-tooltip-content">
        {content}
      </div>

      <style>{`
        /* Simplified tooltip styling - Windy.com inspired */
        /* Requirement 5.1: White background with 2px border radius */
        .simplified-tooltip-content {
          background: #ffffff;
          border-radius: 3px;
          padding: 6px 10px;
          white-space: nowrap;
          /* Requirement 5.3: 12px font size with 500 font weight */
          font-size: 12px;
          font-weight: 500;
          color: #2c3e50;
          letter-spacing: 0.3px;
          /* Requirement 5.7: Subtle drop shadow (4px blur, 20% opacity) */
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
          line-height: 1.5;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        /* Ensure tooltip stays above other elements */
        .simplified-tooltip {
          user-select: none;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </div>
  );
}

export default SimplifiedTooltip;
