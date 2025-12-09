/**
 * ForecastCone Component
 * 
 * Renders forecast uncertainty cone with gradient fill and proper width calculation.
 * Displays the cone of uncertainty for storm forecast paths.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { Polygon } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { calculateBearing } from '../../lib/mapUtils';
import { isValidCoordinate, isValidTimestamp } from '../../lib/stormValidation';

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
 * Props for ForecastCone component
 */
export interface ForecastConeProps {
  /** Array of forecast points (should be chronologically ordered) */
  forecastPoints: StormPoint[];
  /** Current storm position (where cone starts) */
  currentPosition: StormPoint;
  /** Optional: Multiple forecast scenarios to encompass */
  alternativeScenarios?: StormPoint[][];
  /** Custom opacity override */
  opacity?: number;
  /** Custom z-index for layering */
  zIndex?: number;
  /** Whether to use Windy mode (white dashed borders) */
  isWindyMode?: boolean;
}

/**
 * Calculate a point offset from a given position by distance and bearing
 * Uses geodesic calculations for accuracy
 * 
 * @param lat - Latitude of origin point
 * @param lng - Longitude of origin point
 * @param bearing - Direction in degrees (0-360)
 * @param distanceKm - Distance to offset in kilometers
 * @returns New coordinates [lat, lng]
 */
function offsetPoint(
  lat: number,
  lng: number,
  bearing: number,
  distanceKm: number
): [number, number] {
  const R = 6371; // Earth's radius in km
  const bearingRad = (bearing * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const angularDistance = distanceKm / R;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const newLngRad = lngRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  return [
    (newLatRad * 180) / Math.PI,
    (newLngRad * 180) / Math.PI
  ];
}

/**
 * Calculate forecast cone polygon coordinates
 * 
 * Requirements:
 * - 4.1: Render forecast cone as polygon extending from current position
 * - 4.2: Calculate cone width increasing by 50 nautical miles per 24-hour period
 * - 4.4: Use gradient fill with opacity decreasing from current to forecast end
 * - 4.5: Handle multiple forecast scenarios by encompassing all paths
 * 
 * @param currentPosition - Starting position of the cone
 * @param forecastPoints - Array of forecast points
 * @param alternativeScenarios - Optional alternative forecast paths
 * @returns Array of polygon coordinates
 */
function calculateConePolygon(
  currentPosition: StormPoint,
  forecastPoints: StormPoint[],
  alternativeScenarios?: StormPoint[][]
): LatLngExpression[] {
  if (forecastPoints.length === 0) {
    return [];
  }

  // Calculate cone edges for each point
  const leftEdge: [number, number][] = [];
  const rightEdge: [number, number][] = [];

  // Start from current position with zero width
  leftEdge.push([currentPosition.lat, currentPosition.lng]);
  rightEdge.push([currentPosition.lat, currentPosition.lng]);

  // Process each forecast point
  for (let i = 0; i < forecastPoints.length; i++) {
    const point = forecastPoints[i];
    
    // Calculate hours from current time
    const hoursFromNow = (point.timestamp - currentPosition.timestamp) / (1000 * 60 * 60);
    
    // Calculate cone width: 50 nautical miles per 24 hours
    // 1 nautical mile = 1.852 km
    const widthNauticalMiles = 50 * (hoursFromNow / 24);
    const widthKm = widthNauticalMiles * 1.852;

    // If we have multiple scenarios, find the maximum spread
    let maxLeftOffset = widthKm;
    let maxRightOffset = widthKm;

    if (alternativeScenarios && alternativeScenarios.length > 0) {
      // Check all alternative scenarios at this time index
      alternativeScenarios.forEach(scenario => {
        if (scenario[i]) {
          const altPoint = scenario[i];
          // Calculate distance from main forecast point
          const R = 6371;
          const dLat = (altPoint.lat - point.lat) * Math.PI / 180;
          const dLng = (altPoint.lng - point.lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point.lat * Math.PI / 180) * Math.cos(altPoint.lat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          
          // Expand cone to encompass alternative scenarios
          maxLeftOffset = Math.max(maxLeftOffset, widthKm + distance);
          maxRightOffset = Math.max(maxRightOffset, widthKm + distance);
        }
      });
    }

    // Calculate bearing to next point (or use last bearing if at end)
    let bearing: number;
    if (i < forecastPoints.length - 1) {
      bearing = calculateBearing(
        point.lat,
        point.lng,
        forecastPoints[i + 1].lat,
        forecastPoints[i + 1].lng
      );
    } else if (i > 0) {
      bearing = calculateBearing(
        forecastPoints[i - 1].lat,
        forecastPoints[i - 1].lng,
        point.lat,
        point.lng
      );
    } else {
      bearing = calculateBearing(
        currentPosition.lat,
        currentPosition.lng,
        point.lat,
        point.lng
      );
    }

    // Calculate perpendicular offsets (left and right of track)
    const leftBearing = (bearing - 90 + 360) % 360;
    const rightBearing = (bearing + 90) % 360;

    const leftPoint = offsetPoint(point.lat, point.lng, leftBearing, maxLeftOffset);
    const rightPoint = offsetPoint(point.lat, point.lng, rightBearing, maxRightOffset);

    leftEdge.push(leftPoint);
    rightEdge.push(rightPoint);
  }

  // Create polygon by combining left edge (forward) and right edge (backward)
  return [
    ...leftEdge,
    ...rightEdge.reverse()
  ];
}

/**
 * ForecastCone Component
 * 
 * Renders a forecast uncertainty cone showing the potential path of a storm.
 * The cone width increases over time based on forecast uncertainty.
 * 
 * Requirements:
 * - 4.1: Render forecast cone as polygon extending from current storm position
 * - 4.2: Calculate cone width increasing by 50 nautical miles per 24-hour forecast period
 * - 4.3: Display cone with white border and semi-transparent fill at 25% opacity
 * - 4.4: Use gradient fill with opacity decreasing from current position to forecast end
 * - 4.5: When forecast includes multiple scenarios, display cone encompassing all scenarios
 */
export function ForecastCone({
  forecastPoints,
  currentPosition,
  alternativeScenarios,
  opacity = 0.25,
  isWindyMode = false,
}: ForecastConeProps) {
  // Don't render if we don't have forecast points
  if (forecastPoints.length === 0) {
    console.warn('[ForecastCone] No forecast points provided');
    return null;
  }

  // Validate current position
  if (!isValidCoordinate(currentPosition.lat, currentPosition.lng)) {
    console.error(
      '[ForecastCone] Invalid current position coordinates:',
      { lat: currentPosition.lat, lng: currentPosition.lng }
    );
    return null;
  }

  // Validate forecast points
  const validForecastPoints = forecastPoints.filter(point => {
    const coordValid = isValidCoordinate(point.lat, point.lng);
    const timeValid = isValidTimestamp(point.timestamp);
    
    if (!coordValid || !timeValid) {
      console.warn(
        '[ForecastCone] Invalid forecast point:',
        { lat: point.lat, lng: point.lng, timestamp: point.timestamp }
      );
    }
    
    return coordValid && timeValid;
  });

  if (validForecastPoints.length === 0) {
    console.error('[ForecastCone] No valid forecast points after validation');
    return null;
  }

  // Calculate cone polygon coordinates
  const conePolygon = calculateConePolygon(
    currentPosition,
    validForecastPoints,
    alternativeScenarios
  );

  if (conePolygon.length === 0) {
    console.warn('[ForecastCone] Failed to calculate cone polygon');
    return null;
  }

  // Styling based on Windy mode
  // Windy mode: white dashed borders with 20% white fill opacity
  // Gradient mode: original styling
  const fillOpacity = isWindyMode ? 0.2 : opacity;
  const borderOpacity = isWindyMode ? 0.8 : 0.8;
  const dashArray = isWindyMode ? '10 10' : '10 5';

  return (
    <>
      {/* Main forecast cone with gradient-like opacity */}
      <Polygon
        positions={conePolygon}
        pathOptions={{
          fillColor: '#ffffff',
          fillOpacity,
          color: '#ffffff',
          weight: 2,
          opacity: borderOpacity,
          dashArray,
          lineCap: 'round',
          lineJoin: 'round',
        }}
        pane="stormConePane"
        className="forecast-cone-main"
      />
      
      {/* Additional inner layer for gradient effect (higher opacity near current position) */}
      {!isWindyMode && validForecastPoints.length > 2 && (
        <Polygon
          positions={calculateConePolygon(
            currentPosition,
            validForecastPoints.slice(0, Math.ceil(validForecastPoints.length / 2)),
            alternativeScenarios?.map(scenario => 
              scenario.slice(0, Math.ceil(scenario.length / 2))
            )
          )}
          pathOptions={{
            fillColor: '#ffffff',
            fillOpacity: opacity * 0.5,
            color: 'transparent',
            weight: 0,
          }}
          pane="stormConePane"
          className="forecast-cone-inner"
        />
      )}
      
      {/* CSS for smooth transitions */}
      <style>
        {`
          .forecast-cone-main path,
          .forecast-cone-inner path {
            transition: 
              fill-opacity 300ms ease-in-out,
              stroke 300ms ease-in-out,
              stroke-opacity 300ms ease-in-out,
              stroke-dasharray 300ms ease-in-out;
          }
        `}
      </style>
    </>
  );
}

export default ForecastCone;
