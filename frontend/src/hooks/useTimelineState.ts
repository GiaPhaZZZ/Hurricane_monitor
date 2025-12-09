import { useState, useEffect, useMemo } from 'react';
import type { Storm } from '../lib/stormData';

export interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

export function useTimelineState(storms: Storm[]) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Initialize current time to the earliest storm data point
  // Requirements: 2.3, 2.5 - Handle storms with incomplete time data
  useEffect(() => {
    if (storms.length === 0) return;

    let minTime = Infinity;
    let maxTime = -Infinity;
    
    storms.forEach(storm => {
      // Handle storms with incomplete data gracefully
      const allPoints = [
        ...storm.historical,
        storm.currentPosition,
        ...storm.forecast
      ].filter(point => point && point.timestamp); // Filter out invalid points
      
      allPoints.forEach(point => {
        if (point.timestamp) {
          minTime = Math.min(minTime, point.timestamp);
          maxTime = Math.max(maxTime, point.timestamp);
        }
      });
    });

    // Only set initial time if we have valid data and current time is not set
    if (minTime !== Infinity && currentTime === 0) {
      setCurrentTime(minTime);
    }
    
    // If current time is outside the valid range, reset it
    if (currentTime > 0 && (currentTime < minTime || currentTime > maxTime)) {
      setCurrentTime(minTime);
    }
  }, [storms, currentTime]);

  // Filter storms based on current timeline position
  // Requirements: 2.3, 2.4, 2.5 - Update storm positions with interpolation and edge case handling
  const filteredStorms = useMemo(() => {
    if (currentTime === 0) return storms;

    return storms.map(storm => {
      // Validate storm data before processing
      if (!storm.currentPosition || !storm.currentPosition.timestamp) {
        console.warn(`Storm ${storm.id} has invalid current position data`);
        return null;
      }

      // Combine all points and sort by timestamp, filtering out invalid points
      const allPoints = [
        ...storm.historical,
        storm.currentPosition,
        ...storm.forecast
      ]
        .filter(point => point && point.timestamp && point.lat !== undefined && point.lng !== undefined)
        .sort((a, b) => a.timestamp - b.timestamp);

      // Handle edge case: storm has no valid data
      if (allPoints.length === 0) {
        console.warn(`Storm ${storm.id} has no valid data points`);
        return null;
      }

      // Handle edge case: storm has only one data point
      if (allPoints.length === 1) {
        const singlePoint = allPoints[0];
        // Only show if current time is close to this point (within 6 hours)
        const timeDiff = Math.abs(currentTime - singlePoint.timestamp);
        const sixHours = 6 * 60 * 60 * 1000;
        
        if (timeDiff > sixHours) {
          return null;
        }
        
        return {
          ...storm,
          currentPosition: singlePoint,
          historical: [],
          forecast: [],
        };
      }

      // Find the storm's time range
      const stormStartTime = allPoints[0].timestamp;
      const stormEndTime = allPoints[allPoints.length - 1].timestamp;

      // If current time is before storm starts or after storm ends, hide the storm
      // Add a small buffer (1 hour) to handle edge cases
      const oneHour = 60 * 60 * 1000;
      if (currentTime < stormStartTime - oneHour || currentTime > stormEndTime + oneHour) {
        return null;
      }

      // Find the last point at or before current time
      let currentPointIndex = allPoints.findIndex(p => p.timestamp > currentTime);
      if (currentPointIndex === -1) {
        // Current time is after all points, use last point
        currentPointIndex = allPoints.length;
      }
      currentPointIndex = Math.max(0, currentPointIndex - 1);

      const currentPoint = allPoints[currentPointIndex];
      
      if (!currentPoint) {
        return null;
      }

      // Determine if we're in historical or forecast period
      const isHistorical = currentTime <= storm.currentPosition.timestamp;
      const isForecast = currentTime > storm.currentPosition.timestamp;

      // Split points into historical (before current time) and forecast (after current time)
      const historical = allPoints.filter(p => p.timestamp < currentTime);
      const forecast = allPoints.filter(p => p.timestamp > currentTime);

      // Interpolate position if between two points for smooth transitions
      // Requirements: 2.3 - Ensure smooth transitions during playback
      let interpolatedPoint = currentPoint;
      if (currentPointIndex < allPoints.length - 1) {
        const nextPoint = allPoints[currentPointIndex + 1];
        const timeDiff = nextPoint.timestamp - currentPoint.timestamp;
        const timeOffset = currentTime - currentPoint.timestamp;
        
        if (timeDiff > 0 && timeOffset > 0) {
          // Use smooth interpolation ratio
          const ratio = Math.min(1, Math.max(0, timeOffset / timeDiff));
          
          // Smooth interpolation using linear interpolation
          interpolatedPoint = {
            timestamp: currentTime,
            lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * ratio,
            lng: currentPoint.lng + (nextPoint.lng - currentPoint.lng) * ratio,
            windSpeed: Math.round(currentPoint.windSpeed + (nextPoint.windSpeed - currentPoint.windSpeed) * ratio),
            pressure: Math.round(currentPoint.pressure + (nextPoint.pressure - currentPoint.pressure) * ratio),
            category: ratio < 0.5 ? currentPoint.category : nextPoint.category, // Switch category at midpoint
          };
        }
      }

      // Return storm with updated positions
      const updatedStorm: Storm = {
        ...storm,
        currentPosition: interpolatedPoint,
        historical: historical.length > 0 ? historical : [],
        forecast,
        // Add metadata for rendering
        _timelineMetadata: {
          isHistorical,
          isForecast,
          interpolated: interpolatedPoint.timestamp === currentTime && currentPointIndex < allPoints.length - 1,
          stormStartTime,
          stormEndTime,
        },
      };
      
      return updatedStorm;
    }).filter((storm): storm is Storm => storm !== null);
  }, [storms, currentTime]);

  return {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    filteredStorms,
  };
}
