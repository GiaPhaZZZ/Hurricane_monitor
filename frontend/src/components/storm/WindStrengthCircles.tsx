/**
 * WindStrengthCircles Component
 * 
 * Renders concentric dashed circles around storm markers to visualize wind strength zones.
 * Displays circles for different wind speed thresholds (34kt, 50kt, 64kt, 100kt).
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */

import { useEffect, useState } from 'react';
import { Circle } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import {
  calculateWindCircles,
  type CircleConfig,
  type WindRadii,
} from '../../lib/windStrengthCalculations';
import { getCategoryColor } from '../../utils/colorInterpolation';
import { isValidCoordinate } from '../../lib/stormValidation';

/**
 * Props for WindStrengthCircles component
 */
export interface WindStrengthCirclesProps {
  /** Center position of the circles (storm location) */
  center: { lat: number; lng: number };
  /** Maximum sustained wind speed in knots */
  windSpeed: number;
  /** Storm category for color matching */
  category: string;
  /** Optional custom wind radii data from API */
  windRadii?: WindRadii;
  /** Whether the storm is currently animating (hide circles during animation) */
  isAnimating?: boolean;
  /** Custom opacity override (default: 0.4) */
  opacity?: number;
  /** Whether to show the circles (default: true) */
  visible?: boolean;
  /** Whether to use Windy mode (white color at 30% opacity) */
  isWindyMode?: boolean;
}

/**
 * WindStrengthCircles Component
 * 
 * Renders concentric dashed circles around storm markers showing wind strength zones.
 * Circles are displayed based on meteorological wind speed thresholds.
 * 
 * Requirements:
 * - 11.1: Render concentric dashed circles around each Storm_Marker
 * - 11.2: Display minimum 2 and maximum 4 circles based on storm intensity
 * - 11.3: Calculate circle radii based on wind speed thresholds (34kt, 50kt, 64kt, 100kt)
 * - 11.4: Render each circle with dashed line pattern (8px dash, 6px gap)
 * - 11.5: Color each circle to match storm category with 40% opacity
 * - 11.6: Set circle line width to 2 pixels
 * - 11.7: Animate circle radius transitions over 500ms when intensity changes
 * - 11.8: Display circles only for current storm position, not historical points
 */
export function WindStrengthCircles({
  center,
  windSpeed,
  category,
  windRadii,
  isAnimating = false,
  opacity = 0.4,
  visible = true,
  isWindyMode = false,
}: WindStrengthCirclesProps) {
  // State for managing fade-in animation
  const [visibleCircles, setVisibleCircles] = useState<Set<number>>(new Set());
  const [circles, setCircles] = useState<CircleConfig[]>([]);

  // Validate center coordinates
  if (!isValidCoordinate(center.lat, center.lng)) {
    console.error(
      '[WindStrengthCircles] Invalid center coordinates:',
      center
    );
    return null;
  }

  // Validate wind speed
  if (typeof windSpeed !== 'number' || isNaN(windSpeed) || windSpeed < 0) {
    console.warn(
      '[WindStrengthCircles] Invalid wind speed:',
      windSpeed
    );
    return null;
  }

  // Calculate which circles to display based on wind speed
  useEffect(() => {
    const newCircles = calculateWindCircles(windSpeed, windRadii);
    setCircles(newCircles);
    
    // Reset visible circles when circles change
    setVisibleCircles(new Set());
    
    // Stagger fade-in animation (100ms delay between circles)
    if (!isAnimating && visible) {
      newCircles.forEach((_, index) => {
        setTimeout(() => {
          setVisibleCircles(prev => new Set([...prev, index]));
        }, index * 100);
      });
    }
  }, [windSpeed, windRadii, isAnimating, visible]);

  // Don't render if animating or not visible
  if (isAnimating || !visible) {
    return null;
  }

  // Don't render if no circles to display
  if (circles.length === 0) {
    return null;
  }

  // Get color based on storm category (or white for Windy mode)
  const color = isWindyMode ? '#ffffff' : getCategoryColor(category);
  
  // Use 30% opacity in Windy mode, otherwise use provided opacity
  const circleOpacity = isWindyMode ? 0.3 : opacity;

  // Convert center to LatLngExpression
  const centerLatLng: LatLngExpression = [center.lat, center.lng];

  return (
    <>
      {circles.map((circle, index) => {
        // Check if this circle should be visible (for staggered fade-in)
        const isVisible = visibleCircles.has(index);
        
        // Convert radius from km to meters for Leaflet Circle
        const radiusMeters = circle.radius * 1000;

        return (
          <Circle
            key={`wind-circle-${circle.windSpeed}-${index}`}
            center={centerLatLng}
            radius={radiusMeters}
            pathOptions={{
              color: color,
              weight: 2,
              opacity: isVisible ? circleOpacity : 0,
              fillOpacity: 0,
              dashArray: '8 6',
              lineCap: 'round',
              lineJoin: 'round',
            }}
            pane="stormCirclePane"
          />
        );
      })}
      
      {/* Inline styles for smooth transitions */}
      <style>
        {`
          /* Smooth radius transitions when storm intensity changes */
          .leaflet-pane.leaflet-stormCirclePane path {
            transition: 
              r 500ms ease-in-out,
              opacity 300ms ease-out,
              stroke 800ms ease-in-out;
          }
        `}
      </style>
    </>
  );
}

export default WindStrengthCircles;
