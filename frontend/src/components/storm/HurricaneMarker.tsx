/**
 * HurricaneMarker Component
 * 
 * Displays hurricane icon markers that rotate based on movement direction.
 * Features pulsing animation and size scaling based on wind speed.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4
 */

import React from 'react';
import { Marker } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateMarkerSize } from '../../lib/stormAnimations';
import { getCategoryColor } from '../../utils/colorInterpolation';
import {
  calculateIntensityMarkerSize,
  isMajorHurricane,
  generateGlowAnimationCSS,
  generateColorTransitionCSS,
  generateSizeTransitionCSS,
} from '../../lib/stormIntensityChanges';
import { isValidCoordinate } from '../../lib/stormValidation';

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
 * Props for HurricaneMarker component
 */
export interface HurricaneMarkerProps {
  /** Current position of the storm marker */
  position: StormPoint;
  /** Next position for calculating rotation angle (optional) */
  nextPosition?: StormPoint;
  /** Previous position for detecting intensity changes (optional) */
  previousPosition?: StormPoint;
  /** Whether to apply pulsing animation */
  isPulsing?: boolean;
  /** Custom size override (if not provided, calculated from wind speed) */
  size?: number;
  /** Additional CSS class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Children elements (e.g., Popup, Tooltip) */
  children?: React.ReactNode;
  /** Whether to show glow animation on intensification */
  showIntensityGlow?: boolean;
  /** Use intensity-aware size calculation (larger for major hurricanes) */
  useIntensitySize?: boolean;
}

/**
 * Calculate bearing (direction) between two points
 * 
 * @param from - Starting point
 * @param to - Ending point
 * @returns Bearing in degrees (0-360)
 */
function calculateBearing(from: StormPoint, to: StormPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLon = toRad(to.lng - from.lng);
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x);
  bearing = toDeg(bearing);
  
  return (bearing + 360) % 360;
}

/**
 * Hurricane spiral SVG icon component
 * 
 * Creates a hurricane spiral symbol with customizable size, color, and rotation.
 * Supports intensity glow animation and smooth transitions.
 * 
 * Requirements: 5.1, 5.4, 10.1, 10.2, 10.3 - SVG hurricane symbol with intensity visualization
 */
interface HurricaneSpiralIconProps {
  size: number;
  color: string;
  rotation: number;
  isPulsing: boolean;
  showGlow: boolean;
  isMajor: boolean;
}

function HurricaneSpiralIcon({ size, color, rotation, isPulsing, showGlow, isMajor }: HurricaneSpiralIconProps) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className={`
        ${isPulsing ? 'hurricane-marker-pulse' : ''}
        ${showGlow ? 'intensity-glow-animation' : ''}
        intensity-size-transition
      `}
    >
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
        }}
        className="intensity-color-transition"
      >
        {/* Hurricane spiral path */}
        <path
          d="M20,20 Q15,10 20,5 Q25,10 20,20 Q30,15 35,20 Q30,25 20,20 Q25,30 20,35 Q15,30 20,20 Q10,25 5,20 Q10,15 20,20"
          fill={color}
          stroke="white"
          strokeWidth={isMajor ? "2.5" : "2"}
          strokeLinejoin="round"
        />
        {/* Center eye */}
        <circle
          cx="20"
          cy="20"
          r={isMajor ? "5" : "4"}
          fill="white"
          stroke={color}
          strokeWidth={isMajor ? "1.5" : "1"}
        />
      </svg>
    </div>
  );
}

/**
 * HurricaneMarker Component
 * 
 * Renders a hurricane marker with rotating icon based on movement direction.
 * Supports pulsing animation and dynamic sizing based on wind speed.
 * 
 * Requirements:
 * - 2.1: Display Storm_Marker as circular icon with hurricane symbol
 * - 2.2: Render size proportional to wind speed (20-40px)
 * - 2.3: Apply pulsing animation with 2-second cycle
 * - 2.4: Color according to storm category
 * - 2.5: Display white border with 2px width
 * - 5.1: Display Storm_Icon with spiral hurricane symbol
 * - 5.2: Rotate icon to match storm's movement direction
 * - 5.3: Calculate rotation angle based on bearing between consecutive points
 * - 5.4: Render with SVG format for crisp display at all zoom levels
 */
export function HurricaneMarker({
  position,
  nextPosition,
  previousPosition,
  isPulsing = false,
  size,
  className = '',
  onClick,
  children,
  showIntensityGlow = false,
  useIntensitySize = true,
}: HurricaneMarkerProps) {
  // Validate position coordinates
  if (!position || !isValidCoordinate(position.lat, position.lng)) {
    console.error(
      '[HurricaneMarker] Invalid position coordinates:',
      position ? { lat: position.lat, lng: position.lng } : 'null'
    );
    return null;
  }

  // Validate wind speed
  if (typeof position.windSpeed !== 'number' || isNaN(position.windSpeed)) {
    console.warn(
      '[HurricaneMarker] Invalid wind speed, using default:',
      position.windSpeed
    );
    position = { ...position, windSpeed: 0 };
  }

  // Calculate marker size based on wind speed if not provided
  // Use intensity-aware calculation if enabled (larger for major hurricanes)
  const markerSize = size ?? (
    useIntensitySize
      ? calculateIntensityMarkerSize(position.windSpeed, position.category)
      : calculateMarkerSize(position.windSpeed)
  );
  
  // Get color based on storm category
  const color = getCategoryColor(position.category);
  
  // Calculate rotation angle based on bearing to next position
  // Validate next position before calculating bearing
  let rotation = 0;
  if (nextPosition && isValidCoordinate(nextPosition.lat, nextPosition.lng)) {
    try {
      rotation = calculateBearing(position, nextPosition);
    } catch (error) {
      console.warn('[HurricaneMarker] Error calculating bearing:', error);
      rotation = 0;
    }
  }
  
  // Detect if this is a major hurricane
  const isMajor = isMajorHurricane(position.category);
  
  // Determine if we should show glow animation
  // Show glow if explicitly requested OR if storm just intensified
  let shouldShowGlow = showIntensityGlow;
  if (previousPosition && !showIntensityGlow) {
    // Auto-detect intensification
    const prevCategory = previousPosition.category;
    const currCategory = position.category;
    const windSpeedIncrease = position.windSpeed - previousPosition.windSpeed;
    
    // Show glow if category increased or wind speed increased significantly
    shouldShowGlow = (
      getCategoryColor(currCategory) !== getCategoryColor(prevCategory) &&
      windSpeedIncrease > 0
    ) || windSpeedIncrease > 20;
  }
  
  // Create Leaflet DivIcon with hurricane spiral
  const icon = divIcon({
    html: renderToStaticMarkup(
      <HurricaneSpiralIcon
        size={markerSize}
        color={color}
        rotation={rotation}
        isPulsing={isPulsing}
        showGlow={shouldShowGlow}
        isMajor={isMajor}
      />
    ) + `
      <style>
        @keyframes hurricane-pulse {
          0%, 100% {
            transform: scale(1) rotate(${rotation}deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.3) rotate(${rotation}deg);
            opacity: 0.7;
          }
        }
        
        .hurricane-marker-pulse {
          animation: hurricane-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .hurricane-marker-icon {
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .hurricane-marker-icon:hover {
          transform: scale(1.1);
        }
        
        /* Intensity change animations */
        ${generateGlowAnimationCSS(color, 1500)}
        ${generateColorTransitionCSS(800)}
        ${generateSizeTransitionCSS(600)}
      </style>
    `,
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
    className: `hurricane-marker-icon ${className}`,
  });
  
  // Convert position to LatLngExpression
  const latLng: LatLngExpression = [position.lat, position.lng];
  
  return (
    <Marker
      position={latLng}
      icon={icon}
      eventHandlers={onClick ? { click: onClick } : undefined}
      pane="stormMarkerPane"
    >
      {children}
    </Marker>
  );
}

export default HurricaneMarker;
