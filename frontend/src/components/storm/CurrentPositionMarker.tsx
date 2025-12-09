/**
 * CurrentPositionMarker Component
 * 
 * Displays a distinct marker at the transition point where historical data ends
 * and forecast begins. Features enhanced styling, pulsing animation, and timestamp label.
 * 
 * Requirements: 8.3, 8.4
 */

import React from 'react';
import { Marker } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { getCategoryColor } from '../../utils/colorInterpolation';

/**
 * Storm point interface for marker positioning
 */
export interface StormPoint {
  timestamp: number;
  lat: number;
  lng: number;
  windSpeed: number;
  pressure: number;
  category: string;
}

/**
 * Props for CurrentPositionMarker component
 */
export interface CurrentPositionMarkerProps {
  /** Current position of the storm (transition point) */
  position: StormPoint;
  /** Storm name for display */
  stormName?: string;
  /** Whether to show the "Current Position" label */
  showLabel?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Children elements (e.g., Popup, Tooltip) */
  children?: React.ReactNode;
  /** Whether to use Windy mode (red circular icon with white border) */
  isWindyMode?: boolean;
}

/**
 * Current Position Icon Component
 * 
 * Creates a larger, more prominent marker with pulsing animation
 * to clearly indicate the transition between historical and forecast data.
 */
interface CurrentPositionIconProps {
  color: string;
  size: number;
  isWindyMode: boolean;
}

function CurrentPositionIcon({ color, size, isWindyMode }: CurrentPositionIconProps) {
  // Windy mode: red circular icon with white border
  if (isWindyMode) {
    return (
      <div
        className="current-position-marker"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          style={{
            filter: 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4))',
          }}
        >
          {/* Outer pulsing ring */}
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#ff0000"
            strokeWidth="2"
            opacity="0.4"
            className="pulse-ring"
          />
          
          {/* Red circular icon with white border */}
          <circle
            cx="24"
            cy="24"
            r="14"
            fill="#ff0000"
            stroke="white"
            strokeWidth="4"
          />
        </svg>
      </div>
    );
  }

  // Gradient mode: original design with category color
  return (
    <div
      className="current-position-marker"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        style={{
          filter: 'drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4))',
        }}
      >
        {/* Outer pulsing ring */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.4"
          className="pulse-ring"
        />
        
        {/* Middle ring */}
        <circle
          cx="24"
          cy="24"
          r="16"
          fill={color}
          opacity="0.3"
        />
        
        {/* Inner circle with white border */}
        <circle
          cx="24"
          cy="24"
          r="12"
          fill={color}
          stroke="white"
          strokeWidth="3"
        />
        
        {/* Center dot */}
        <circle
          cx="24"
          cy="24"
          r="6"
          fill="white"
        />
        
        {/* Crosshair lines */}
        <line
          x1="24"
          y1="8"
          x2="24"
          y2="16"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="32"
          x2="24"
          y2="40"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="8"
          y1="24"
          x2="16"
          y2="24"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="32"
          y1="24"
          x2="40"
          y2="24"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * CurrentPositionMarker Component
 * 
 * Renders a distinct marker at the transition point between historical and forecast data.
 * Features larger size, enhanced styling, and pulsing animation to stand out.
 * 
 * Requirements:
 * - 8.3: Display visual transition marker at point where historical data ends and forecast begins
 * - 8.4: Label transition point with "Current Position" text
 */
export function CurrentPositionMarker({
  position,
  stormName,
  showLabel = true,
  className = '',
  onClick,
  children,
  isWindyMode = false,
}: CurrentPositionMarkerProps) {
  // Use larger size for current position marker (32px)
  const markerSize = 32;
  
  // Get color based on storm category (or red for Windy mode)
  const color = isWindyMode ? '#ff0000' : getCategoryColor(position.category);
  
  // Create label HTML if showLabel is true
  const labelHtml = showLabel ? `
    <div class="current-position-label">
      <div class="current-position-label-title">Current Position</div>
      <div class="current-position-label-time">${formatTimestamp(position.timestamp)}</div>
      ${stormName ? `<div class="current-position-label-storm">${stormName}</div>` : ''}
    </div>
  ` : '';
  
  // Create Leaflet DivIcon with current position marker
  const icon = divIcon({
    html: renderToStaticMarkup(
      <CurrentPositionIcon
        color={color}
        size={markerSize}
        isWindyMode={isWindyMode}
      />
    ) + labelHtml + `
      <style>
        /* Pulsing animation for the marker */
        @keyframes current-position-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
        
        /* Pulsing ring animation */
        @keyframes pulse-ring {
          0% {
            r: 20;
            opacity: 0.4;
          }
          100% {
            r: 24;
            opacity: 0;
          }
        }
        
        .current-position-marker {
          animation: current-position-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Smooth transitions for mode switching */
        .current-position-marker svg circle,
        .current-position-marker svg line {
          transition: 
            fill 300ms ease-in-out,
            stroke 300ms ease-in-out,
            opacity 300ms ease-in-out;
        }
        
        /* Label styling */
        .current-position-label {
          position: absolute;
          top: ${markerSize + 8}px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 30, 30, 0.95);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
          white-space: nowrap;
          pointer-events: none;
          z-index: 1000;
          min-width: 140px;
          text-align: center;
        }
        
        .current-position-label-title {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
          color: ${color};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .current-position-label-time {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .current-position-label-storm {
          font-size: 10px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 2px;
        }
        
        /* Arrow pointer */
        .current-position-label::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid rgba(30, 30, 30, 0.95);
        }
        
        /* Fade in animation for label */
        @keyframes label-fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .current-position-label {
          animation: label-fade-in 0.4s ease-out;
        }
        
        /* Hover effect */
        .current-position-marker-icon:hover .current-position-marker {
          transform: scale(1.15);
        }
      </style>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    className: `current-position-marker-icon ${className}`,
  });
  
  // Convert position to LatLngExpression
  const latLng: LatLngExpression = [position.lat, position.lng];
  
  return (
    <Marker
      position={latLng}
      icon={icon}
      eventHandlers={onClick ? { click: onClick } : undefined}
      zIndexOffset={1000} // Ensure it appears above other markers
      pane="stormMarkerPane"
    >
      {children}
    </Marker>
  );
}

export default CurrentPositionMarker;
