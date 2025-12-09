import { useState, useEffect } from "react";
import { Popup, useMap } from "react-leaflet";
import { getCategoryColor, type Storm, type StormPoint } from "../lib/stormData";
import { GradientStormTrack } from "./storm/GradientStormTrack";
import { HurricaneMarker } from "./storm/HurricaneMarker";
import { ForecastCone } from "./storm/ForecastCone";
import { StormTooltip } from "./storm/StormTooltip";
import { CurrentPositionMarker } from "./storm/CurrentPositionMarker";
import { WindStrengthCircles } from "./storm/WindStrengthCircles";
import { StormInfluenceZone } from "./storm/StormInfluenceZone";

import { getTrackForZoomLevel } from "../lib/stormPerformance";
import {
  validateAndSanitizeStorm,
  getUserFriendlyErrorMessage,
  hasForecastData,
  getForecastMessage,
  validateStorm,
} from "../lib/stormValidation";

interface StormAnimationProps {
  storm: Storm;
  isActive: boolean;
  stormIndex?: number; // For offsetting overlapping tracks
  totalStorms?: number; // Total number of storms being rendered
  isWindyMode?: boolean; // Whether to use Windy mode visualization
  currentTime?: number; // Current timeline position for temporal navigation
  customColor?: string; // Custom color for this storm
}



/* ---------- MAIN COMPONENT ---------- */
function SingleStormAnimation({
  storm,
  isActive,
  isWindyMode = false,
  currentTime,
  customColor,

}: StormAnimationProps) {
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

  // Validate storm data
  const validationResult = validateStorm(storm);

  // If validation fails, show error message
  if (!validationResult.isValid) {
    const errorMessage = getUserFriendlyErrorMessage(validationResult);

    // Log error for debugging
    console.error(
      `[StormAnimation] Validation failed for storm ${storm.nameVi || storm.id}:`,
      validationResult.errors
    );

    // Show error marker at current position if available
    if (storm.currentPosition) {
      return (
        <HurricaneMarker
          position={storm.currentPosition}
          isPulsing={false}
          useIntensitySize={false}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg text-red-600">Data Error</h3>
              <p className="text-sm text-gray-700 mt-2">{errorMessage}</p>
              <p className="text-xs text-gray-500 mt-2">
                Storm: {storm.nameVi || storm.id}
              </p>
            </div>
          </Popup>
        </HurricaneMarker>
      );
    }

    // If no current position, return null
    return null;
  }

  // Sanitize storm data (fill gaps, interpolate missing points)
  const sanitizedStorm = validateAndSanitizeStorm(storm);

  if (!sanitizedStorm) {
    console.error(
      `[StormAnimation] Failed to sanitize storm data for ${storm.nameVi || storm.id}`
    );
    return null;
  }

  // Use sanitized storm data
  const workingStorm = sanitizedStorm;

  // Combine all points: historical + current + forecast
  const allPoints: StormPoint[] = [
    ...workingStorm.historical,
    workingStorm.currentPosition,
    ...workingStorm.forecast
  ];

  // Handle edge case: not enough points to render
  if (allPoints.length < 2) {
    const forecastMsg = getForecastMessage(workingStorm);

    return (
      <HurricaneMarker
        position={workingStorm.currentPosition}
        isPulsing={isActive}
        useIntensitySize={true}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-bold text-lg">{workingStorm.nameVi}</h3>
            <p>
              <strong>Position:</strong> {workingStorm.currentPosition.lat.toFixed(2)}°N, {workingStorm.currentPosition.lng.toFixed(2)}°E
            </p>
            {forecastMsg && (
              <p className="text-sm text-yellow-600 mt-2">{forecastMsg}</p>
            )}
          </div>
        </Popup>
      </HurricaneMarker>
    );
  }

  // Separate historical and forecast points
  const historicalPoints = [...workingStorm.historical, workingStorm.currentPosition];
  const forecastPoints = workingStorm.forecast;

  // Check if forecast data is available
  const hasForecast = hasForecastData(workingStorm);
  const forecastMessage = getForecastMessage(workingStorm);

  // Get optimized points based on zoom level
  const optimizedHistoricalPoints = getTrackForZoomLevel(historicalPoints, zoomLevel);
  const optimizedForecastPoints = forecastPoints.length > 0
    ? getTrackForZoomLevel([storm.currentPosition, ...forecastPoints], zoomLevel)
    : [];

  return (
    <>
      {/* Historical Storm Track with Gradient Colors */}
      {optimizedHistoricalPoints.length >= 2 && (
        <GradientStormTrack
          points={optimizedHistoricalPoints}
          isHistorical={true}
          isWindyMode={isWindyMode}
          customColor={customColor}
        />
      )}

      {/* Forecast Storm Track with Gradient Colors (dashed) */}
      {hasForecast && optimizedForecastPoints.length >= 1 && (
        <GradientStormTrack
          points={optimizedForecastPoints}
          isHistorical={false}
          isWindyMode={isWindyMode}
          customColor={customColor}
        />
      )}

      {/* Forecast Cone of Uncertainty */}
      {hasForecast && forecastPoints.length >= 1 && (
        <ForecastCone
          currentPosition={workingStorm.currentPosition}
          forecastPoints={forecastPoints}
          isWindyMode={isWindyMode}
        />
      )}

      {/* Wind Strength Circles - only at current position */}
      {workingStorm.currentPosition.windSpeed && (
        <WindStrengthCircles
          center={{
            lat: workingStorm.currentPosition.lat,
            lng: workingStorm.currentPosition.lng,
          }}
          windSpeed={workingStorm.currentPosition.windSpeed}
          category={workingStorm.currentPosition.category}
          isAnimating={false}
          visible={!isActive}
          isWindyMode={isWindyMode}
        />
      )}

      {/* Current Position Marker - transition point between historical and forecast */}
      <CurrentPositionMarker
        position={workingStorm.currentPosition}
        stormName={workingStorm.nameVi}
        showLabel={false}
        isWindyMode={isWindyMode}
      >
        <Popup>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontWeight: 700 }}>{workingStorm.nameVi}</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>Current Position</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
              {new Date(workingStorm.currentPosition.timestamp).toLocaleString("en-US")}
            </div>
            <div><strong>Location:</strong> {workingStorm.currentPosition.lat.toFixed(2)}°N, {workingStorm.currentPosition.lng.toFixed(2)}°E</div>
            <div><strong>Wind Speed:</strong> {workingStorm.currentPosition.windSpeed?.toFixed(2) ?? "—"} km/h</div>
            <div><strong>Pressure:</strong> {workingStorm.currentPosition.pressure?.toFixed(2) ?? "—"} hPa</div>
            <div><strong>Category:</strong> {workingStorm.currentPosition.category}</div>
            {forecastMessage && (
              <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 8, fontStyle: "italic" }}>
                {forecastMessage}
              </div>
            )}
          </div>
        </Popup>
      </CurrentPositionMarker>

      {/* Vùng ảnh hưởng bao quanh toàn bộ đường đi lịch sử */}
      {!isActive && optimizedHistoricalPoints.length >= 2 && (
        <StormInfluenceZone
          points={optimizedHistoricalPoints}
          color={customColor || getCategoryColor(workingStorm.currentPosition.category)}
          opacity={0.15}
        />
      )}

      {/* Hurricane Markers along Historical Track */}
      {!isActive && optimizedHistoricalPoints.map((point, index) => {
        // Skip every other point to avoid clutter, but always show first and last
        if (index > 0 && index < optimizedHistoricalPoints.length - 1 && index % 2 !== 0) {
          return null;
        }

        return (
          <HurricaneMarker
            key={`historical-marker-${index}`}
            position={point}
            nextPosition={optimizedHistoricalPoints[index + 1]}
            previousPosition={optimizedHistoricalPoints[index - 1]}
            isPulsing={false}
            useIntensitySize={true}
            showIntensityGlow={false}
          >
            <StormTooltip
              stormName={workingStorm.nameVi}
              stormData={point}
              permanent={false}
              currentTime={currentTime}
              isHistorical={true}
              isForecast={false}
            />
          </HurricaneMarker>
        );
      })}

      {/* Vùng ảnh hưởng bao quanh toàn bộ đường đi dự báo */}
      {hasForecast && !isActive && optimizedForecastPoints.length >= 2 && (
        <StormInfluenceZone
          points={optimizedForecastPoints}
          color={customColor || getCategoryColor(workingStorm.currentPosition.category)}
          opacity={0.12}
        />
      )}

      {/* Hurricane Markers along Forecast Track */}
      {hasForecast && !isActive && optimizedForecastPoints.slice(1).map((point, index) => {
        // Show fewer markers on forecast track
        if (index % 3 !== 0 && index !== optimizedForecastPoints.length - 2) {
          return null;
        }

        return (
          <HurricaneMarker
            key={`forecast-marker-${index}`}
            position={point}
            nextPosition={optimizedForecastPoints[index + 2]}
            previousPosition={index === 0 ? workingStorm.currentPosition : optimizedForecastPoints[index]}
            isPulsing={false}
            useIntensitySize={true}
            showIntensityGlow={false}
          >
            <StormTooltip
              stormName={workingStorm.nameVi}
              stormData={point}
              permanent={false}
              currentTime={currentTime}
              isHistorical={false}
              isForecast={true}
            />
          </HurricaneMarker>
        );
      })}

      {/* Final Forecast Point with Enhanced Marker */}
      {hasForecast && optimizedForecastPoints.length > 1 && !isActive && (
        <HurricaneMarker
          position={optimizedForecastPoints[optimizedForecastPoints.length - 1]}
          previousPosition={optimizedForecastPoints[optimizedForecastPoints.length - 2] || workingStorm.currentPosition}
          isPulsing={true}
          useIntensitySize={true}
          showIntensityGlow={false}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg">Final Forecast Point</h3>
              <p className="text-xs text-gray-500 mb-2">
                Expected position after {forecastPoints.length * 6}h
              </p>
              <p><strong>Time:</strong> {new Date(optimizedForecastPoints[optimizedForecastPoints.length - 1].timestamp).toLocaleString("en-US")}</p>
              <p><strong>Location:</strong> {optimizedForecastPoints[optimizedForecastPoints.length - 1].lat.toFixed(2)}°N, {optimizedForecastPoints[optimizedForecastPoints.length - 1].lng.toFixed(2)}°E</p>
              <p><strong>Wind Speed:</strong> {optimizedForecastPoints[optimizedForecastPoints.length - 1].windSpeed} km/h</p>
              <p><strong>Pressure:</strong> {optimizedForecastPoints[optimizedForecastPoints.length - 1].pressure} hPa</p>
            </div>
          </Popup>
        </HurricaneMarker>
      )}
    </>
  );
}

interface StormsWrapperProps {
  storms: Storm[];
  selectedStorm?: Storm;
}

export default function StormAnimation({ storms, selectedStorm }: StormsWrapperProps) {
  return (
    <>
      {storms.map((storm) => (
        <SingleStormAnimation
          key={storm.id}
          storm={storm}
          isActive={selectedStorm?.id === storm.id}
        />
      ))}
    </>
  );
}
