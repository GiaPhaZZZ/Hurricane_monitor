/**
 * GradientStormTrack Component
 * 
 * Renders storm tracks with smooth color gradients based on intensity changes.
 * Supports different styling for historical vs forecast segments with glow effects.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2, 8.4, 8.5
 */

import { Polyline, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { interpolateColor, getCategoryColor } from '../../utils/colorInterpolation';
import { getTrackForZoomLevel } from '../../lib/stormPerformance';
import { useState, useEffect } from 'react';
import { isValidCoordinate } from '../../lib/stormValidation';

/**
 * Storm point interface
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
 * Props for GradientStormTrack component
 */
export interface GradientStormTrackProps {
  /** Array of storm points to render */
  points: StormPoint[];
  /** Whether this is a historical track (solid line) or forecast (dashed line) */
  isHistorical: boolean;
  /** Whether the track is currently animating */
  isAnimating?: boolean;
  /** Animation progress (0-1) for progressive drawing */
  animationProgress?: number;
  /** Custom z-index for layering */
  zIndex?: number;
  /** Whether to use Windy mode (white dashed lines) instead of gradient colors */
  isWindyMode?: boolean;
  /** Custom color for this storm track */
  customColor?: string;
}

/**
 * GradientStormTrack Component
 * 
 * Renders a storm track with smooth gradient colors transitioning based on
 * storm category at each point. Applies different styling for historical
 * vs forecast segments.
 * 
 * Requirements:
 * - 1.1: Render Storm_Track as polyline with gradient colors based on storm category
 * - 1.2: Use color interpolation between adjacent points for smooth transitions
 * - 1.3: Apply glow effect to Storm_Track line with 2-pixel shadow
 * - 1.4: Render with 4px line width and smooth line joins
 * - 1.5: Display historical segments at 80% opacity, forecast at 60% opacity
 * - 8.1: Render historical Storm_Track segments as solid lines
 * - 8.2: Render forecast Storm_Track segments as dashed lines
 * - 8.4: Label transition point with "Current Position" text
 * - 8.5: Apply 100% opacity to historical, 70% opacity to forecast segments
 */
export function GradientStormTrack({
  points,
  isHistorical,
  isAnimating = false,
  animationProgress = 1,
  isWindyMode = false,
  customColor,
}: GradientStormTrackProps) {
  const map = useMap();
  const [zoomLevel, setZoomLevel] = useState(map.getZoom());

  // Track zoom level changes for adaptive rendering
  useEffect(() => {
    const handleZoom = () => {
      setZoomLevel(map.getZoom());
    };

    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  // Don't render if we don't have enough points
  if (points.length < 2) {
    console.warn('[GradientStormTrack] Insufficient points for rendering:', points.length);
    return null;
  }

  // Validate all points have valid coordinates
  const validPoints = points.filter(point => {
    const isValid = isValidCoordinate(point.lat, point.lng);
    if (!isValid) {
      console.warn(
        '[GradientStormTrack] Invalid coordinates detected:',
        { lat: point.lat, lng: point.lng, timestamp: point.timestamp }
      );
    }
    return isValid;
  });

  if (validPoints.length < 2) {
    console.error(
      '[GradientStormTrack] Not enough valid points after validation:',
      validPoints.length,
      'out of',
      points.length
    );
    return null;
  }

  // Get appropriate points based on zoom level (simplified at low zoom, full at high zoom)
  const optimizedPoints = getTrackForZoomLevel(validPoints, zoomLevel);

  // Calculate how many points to show based on animation progress
  const visiblePointCount = isAnimating
    ? Math.max(2, Math.ceil(optimizedPoints.length * animationProgress))
    : optimizedPoints.length;
  
  const visiblePoints = optimizedPoints.slice(0, visiblePointCount);

  // Generate segments with interpolated colors
  const segments: Array<{
    positions: LatLngExpression[];
    color: string;
  }> = [];

  for (let i = 0; i < visiblePoints.length - 1; i++) {
    const currentPoint = visiblePoints[i];
    const nextPoint = visiblePoints[i + 1];

    // Get colors for current and next points
    // Sử dụng customColor nếu có, nếu không thì dùng màu theo category
    const currentColor = customColor || getCategoryColor(currentPoint.category);
    const nextColor = customColor || getCategoryColor(nextPoint.category);

    // Interpolate color at midpoint for smoother transitions
    const midColor = customColor || interpolateColor(currentColor, nextColor, 0.5);

    segments.push({
      positions: [
        [currentPoint.lat, currentPoint.lng],
        [nextPoint.lat, nextPoint.lng],
      ],
      color: midColor,
    });
  }

  // Styling based on Windy mode and historical vs forecast
  // Windy mode: white dashed lines (10px dash, 10px gap), 3px width, 80% opacity
  // Gradient mode: colored lines with glow effect
  const windyModeStyle = {
    color: '#ffffff',
    weight: 3,
    opacity: 0.8,
    dashArray: '10 10',
  };

  const gradientModeStyle = {
    opacity: isHistorical ? 0.8 : 0.6,
    dashArray: isHistorical ? undefined : '10 5',
    weight: 4,
  };

  // Use Windy mode styles if enabled
  if (isWindyMode) {
    return (
      <>
        {/* Single polyline for entire track in Windy mode */}
        <Polyline
          positions={visiblePoints.map(p => [p.lat, p.lng])}
          pathOptions={{
            ...windyModeStyle,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          pane="stormTrackPane"
          className="windy-mode-track"
        />
        
        {/* Render historical points as small white circles (2px radius) */}
        {isHistorical && visiblePoints.map((point, index) => {
          // Show circles at regular intervals to avoid clutter
          if (index % 3 !== 0 && index !== 0 && index !== visiblePoints.length - 1) {
            return null;
          }
          
          return (
            <Polyline
              key={`point-${index}`}
              positions={[[point.lat, point.lng]]}
              pathOptions={{
                color: '#ffffff',
                weight: 4, // 2px radius = 4px diameter
                opacity: 0.9,
                lineCap: 'round',
              }}
              pane="stormTrackPane"
              className="windy-mode-point"
            />
          );
        })}
        
        {/* CSS for smooth transitions */}
        <style>
          {`
            .windy-mode-track path,
            .windy-mode-point path {
              transition: 
                stroke 300ms ease-in-out,
                stroke-width 300ms ease-in-out,
                stroke-opacity 300ms ease-in-out,
                stroke-dasharray 300ms ease-in-out;
            }
          `}
        </style>
      </>
    );
  }

  // Gradient mode rendering (original behavior)
  return (
    <>
      {/* Glow effect layer - rendered first with lower opacity */}
      {segments.map((segment, index) => (
        <Polyline
          key={`glow-${index}`}
          positions={segment.positions}
          pathOptions={{
            color: '#ffffff',
            weight: gradientModeStyle.weight + 4,
            opacity: gradientModeStyle.opacity * 0.3,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: gradientModeStyle.dashArray,
          }}
          pane="stormTrackPane"
          className="gradient-mode-glow"
        />
      ))}

      {/* Main gradient track - rendered on top with full color */}
      {segments.map((segment, index) => (
        <Polyline
          key={`track-${index}`}
          positions={segment.positions}
          pathOptions={{
            color: segment.color,
            weight: gradientModeStyle.weight,
            opacity: gradientModeStyle.opacity,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: gradientModeStyle.dashArray,
          }}
          pane="stormTrackPane"
          className="gradient-mode-track"
        />
      ))}
      
      {/* CSS for smooth transitions */}
      <style>
        {`
          .gradient-mode-track path,
          .gradient-mode-glow path {
            transition: 
              stroke 300ms ease-in-out,
              stroke-width 300ms ease-in-out,
              stroke-opacity 300ms ease-in-out,
              stroke-dasharray 300ms ease-in-out;
          }
        `}
      </style>
    </>
  );
}

export default GradientStormTrack;
