/**
 * Hook for synchronizing Windy state with component state
 * Requirements: 2.3, 4.8 - Ensure timeline and storm positions stay in sync
 */

import { useEffect, useCallback } from 'react';
import { useWindyState } from '../contexts/WindyStateContext';
import type { LayerType } from '../components/WeatherLayerControl';

// ============================================================================
// TIMELINE SYNCHRONIZATION
// ============================================================================

/**
 * Hook to synchronize timeline state with global state
 * Provides bidirectional sync between local component state and global context
 * Requirements: 2.3 - Ensure timeline and storm positions stay in sync
 */
export function useTimelineSync() {
  const { state, dispatch, timeline } = useWindyState();

  const setCurrentTime = useCallback(
    (time: number) => {
      dispatch(timeline.setCurrentTime(time));
    },
    [dispatch, timeline]
  );

  const setIsPlaying = useCallback(
    (isPlaying: boolean) => {
      dispatch(timeline.setIsPlaying(isPlaying));
    },
    [dispatch, timeline]
  );

  const setPlaybackSpeed = useCallback(
    (speed: number) => {
      dispatch(timeline.setPlaybackSpeed(speed));
    },
    [dispatch, timeline]
  );

  const setLoopEnabled = useCallback(
    (enabled: boolean) => {
      dispatch(timeline.setLoopEnabled(enabled));
    },
    [dispatch, timeline]
  );

  const setTimeRange = useCallback(
    (startTime: number, endTime: number) => {
      dispatch(timeline.setTimeRange(startTime, endTime));
    },
    [dispatch, timeline]
  );

  const resetTimeline = useCallback(() => {
    dispatch(timeline.resetTimeline());
  }, [dispatch, timeline]);

  return {
    // State
    currentTime: state.timeline.currentTime,
    isPlaying: state.timeline.isPlaying,
    playbackSpeed: state.timeline.playbackSpeed,
    loopEnabled: state.timeline.loopEnabled,
    startTime: state.timeline.startTime,
    endTime: state.timeline.endTime,
    // Actions
    setCurrentTime,
    setIsPlaying,
    setPlaybackSpeed,
    setLoopEnabled,
    setTimeRange,
    resetTimeline,
  };
}

// ============================================================================
// LAYER SYNCHRONIZATION
// ============================================================================

/**
 * Hook to synchronize layer state with global state
 * Provides bidirectional sync for weather overlays and Windy mode
 * Requirements: 4.8 - Coordinate layer toggles with overlay rendering
 */
export function useLayerSync() {
  const { state, dispatch, layers } = useWindyState();

  const setActiveLayer = useCallback(
    (layer: LayerType) => {
      dispatch(layers.setActiveLayer(layer));
    },
    [dispatch, layers]
  );

  const setShowWindLayer = useCallback(
    (show: boolean) => {
      dispatch(layers.setShowWindLayer(show));
    },
    [dispatch, layers]
  );

  const setOverlayOpacity = useCallback(
    (opacity: number) => {
      dispatch(layers.setOverlayOpacity(opacity));
    },
    [dispatch, layers]
  );

  const setWindyMode = useCallback(
    (enabled: boolean) => {
      dispatch(layers.setWindyMode(enabled));
    },
    [dispatch, layers]
  );

  const toggleWindyMode = useCallback(() => {
    dispatch(layers.toggleWindyMode());
  }, [dispatch, layers]);

  return {
    // State
    activeLayer: state.layers.activeLayer,
    showWindLayer: state.layers.showWindLayer,
    overlayOpacity: state.layers.overlayOpacity,
    windyMode: state.layers.windyMode,
    // Actions
    setActiveLayer,
    setShowWindLayer,
    setOverlayOpacity,
    setWindyMode,
    toggleWindyMode,
  };
}

// ============================================================================
// COMBINED SYNCHRONIZATION
// ============================================================================

/**
 * Hook to synchronize all Windy state
 * Provides complete access to timeline and layer state
 * Requirements: 2.3, 4.8 - Handle concurrent state updates gracefully
 */
export function useWindyStateSync() {
  const timelineSync = useTimelineSync();
  const layerSync = useLayerSync();

  return {
    timeline: timelineSync,
    layers: layerSync,
  };
}

// ============================================================================
// STORM POSITION SYNCHRONIZATION
// ============================================================================

/**
 * Hook to ensure storm positions update with timeline changes
 * Requirements: 2.3 - Ensure timeline and storm positions stay in sync
 */
export function useStormPositionSync(onTimeChange?: (time: number) => void) {
  const { state } = useWindyState();

  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(state.timeline.currentTime);
    }
  }, [state.timeline.currentTime, onTimeChange]);

  return {
    currentTime: state.timeline.currentTime,
    isPlaying: state.timeline.isPlaying,
  };
}

// ============================================================================
// LAYER TOGGLE SYNCHRONIZATION
// ============================================================================

/**
 * Hook to coordinate layer toggles with overlay rendering
 * Ensures only one overlay is active at a time
 * Requirements: 4.8 - Coordinate layer toggles with overlay rendering
 */
export function useLayerToggleSync(onLayerChange?: (layer: LayerType) => void) {
  const { state } = useWindyState();

  useEffect(() => {
    if (onLayerChange) {
      onLayerChange(state.layers.activeLayer);
    }
  }, [state.layers.activeLayer, onLayerChange]);

  return {
    activeLayer: state.layers.activeLayer,
    showWindLayer: state.layers.showWindLayer,
  };
}
