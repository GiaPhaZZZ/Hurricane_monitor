/**
 * URL query parameter utilities for sharing Windy application state
 * Requirements: 2.3 - Encode timeline position, layers, and Windy mode in URL
 */

import type { WindyState, LayerState, TimelineState } from '../contexts/WindyStateContext';
import type { LayerType } from '../components/WeatherLayerControl';

// ============================================================================
// CONSTANTS
// ============================================================================

const URL_PARAMS = {
  TIME: 't',
  LAYER: 'l',
  WINDY_MODE: 'w',
  OPACITY: 'o',
  SPEED: 's',
} as const;

// ============================================================================
// ENCODING UTILITIES
// ============================================================================

/**
 * Encode timeline position in URL
 * Requirements: 2.3 - Include timeline position in URL
 */
export function encodeTimelineToUrl(currentTime: number): URLSearchParams {
  const params = new URLSearchParams();
  
  if (currentTime > 0) {
    params.set(URL_PARAMS.TIME, currentTime.toString());
  }
  
  return params;
}

/**
 * Encode active layers in URL
 * Requirements: 2.3 - Include active layers in URL
 */
export function encodeLayersToUrl(layers: LayerState): URLSearchParams {
  const params = new URLSearchParams();
  
  // Encode active layer (only if not 'none')
  if (layers.activeLayer !== 'none') {
    params.set(URL_PARAMS.LAYER, layers.activeLayer);
  }
  
  // Encode Windy mode (only if enabled)
  if (layers.windyMode) {
    params.set(URL_PARAMS.WINDY_MODE, '1');
  }
  
  // Encode opacity (only if not default 0.6)
  if (layers.overlayOpacity !== 0.6) {
    params.set(URL_PARAMS.OPACITY, layers.overlayOpacity.toFixed(2));
  }
  
  return params;
}

/**
 * Encode playback speed in URL
 */
export function encodePlaybackSpeedToUrl(speed: number): URLSearchParams {
  const params = new URLSearchParams();
  
  // Only encode if not default speed (1x)
  if (speed !== 1) {
    params.set(URL_PARAMS.SPEED, speed.toString());
  }
  
  return params;
}

/**
 * Encode complete Windy state to URL query parameters
 * Requirements: 2.3 - Encode timeline position, layers, and Windy mode
 */
export function encodeStateToUrl(state: WindyState): string {
  const params = new URLSearchParams();
  
  // Encode timeline position
  if (state.timeline.currentTime > 0) {
    params.set(URL_PARAMS.TIME, state.timeline.currentTime.toString());
  }
  
  // Encode playback speed
  if (state.timeline.playbackSpeed !== 1) {
    params.set(URL_PARAMS.SPEED, state.timeline.playbackSpeed.toString());
  }
  
  // Encode active layer
  if (state.layers.activeLayer !== 'none') {
    params.set(URL_PARAMS.LAYER, state.layers.activeLayer);
  }
  
  // Encode Windy mode
  if (state.layers.windyMode) {
    params.set(URL_PARAMS.WINDY_MODE, '1');
  }
  
  // Encode opacity
  if (state.layers.overlayOpacity !== 0.6) {
    params.set(URL_PARAMS.OPACITY, state.layers.overlayOpacity.toFixed(2));
  }
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// DECODING UTILITIES
// ============================================================================

/**
 * Decode timeline position from URL
 * Returns null if no valid timeline position is found
 */
export function decodeTimelineFromUrl(searchParams: URLSearchParams): number | null {
  const timeParam = searchParams.get(URL_PARAMS.TIME);
  
  if (!timeParam) {
    return null;
  }
  
  const time = parseInt(timeParam, 10);
  
  if (isNaN(time) || time < 0) {
    return null;
  }
  
  return time;
}

/**
 * Decode active layer from URL
 * Returns null if no valid layer is found
 */
export function decodeLayerFromUrl(searchParams: URLSearchParams): LayerType | null {
  const layerParam = searchParams.get(URL_PARAMS.LAYER);
  
  if (!layerParam) {
    return null;
  }
  
  // Validate layer type
  const validLayers: LayerType[] = ['none', 'wind', 'temperature', 'radar', 'satellite'];
  
  if (validLayers.includes(layerParam as LayerType)) {
    return layerParam as LayerType;
  }
  
  return null;
}

/**
 * Decode Windy mode from URL
 * Returns null if no Windy mode parameter is found
 */
export function decodeWindyModeFromUrl(searchParams: URLSearchParams): boolean | null {
  const windyModeParam = searchParams.get(URL_PARAMS.WINDY_MODE);
  
  if (!windyModeParam) {
    return null;
  }
  
  return windyModeParam === '1';
}

/**
 * Decode overlay opacity from URL
 * Returns null if no valid opacity is found
 */
export function decodeOpacityFromUrl(searchParams: URLSearchParams): number | null {
  const opacityParam = searchParams.get(URL_PARAMS.OPACITY);
  
  if (!opacityParam) {
    return null;
  }
  
  const opacity = parseFloat(opacityParam);
  
  if (isNaN(opacity) || opacity < 0 || opacity > 1) {
    return null;
  }
  
  return opacity;
}

/**
 * Decode playback speed from URL
 * Returns null if no valid speed is found
 */
export function decodePlaybackSpeedFromUrl(searchParams: URLSearchParams): number | null {
  const speedParam = searchParams.get(URL_PARAMS.SPEED);
  
  if (!speedParam) {
    return null;
  }
  
  const speed = parseFloat(speedParam);
  
  if (isNaN(speed) || speed < 0.5 || speed > 4) {
    return null;
  }
  
  return speed;
}

/**
 * Deep partial type for nested state objects
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? Partial<T[P]> : T[P];
};

/**
 * Decode complete Windy state from URL query parameters
 * Requirements: 2.3 - Parse URL params on app load
 */
export function decodeStateFromUrl(search: string): DeepPartial<WindyState> {
  const searchParams = new URLSearchParams(search);
  const decodedState: DeepPartial<WindyState> = {};
  
  // Decode timeline state
  const currentTime = decodeTimelineFromUrl(searchParams);
  const playbackSpeed = decodePlaybackSpeedFromUrl(searchParams);
  
  const timelineState: Partial<TimelineState> = {};
  
  if (currentTime !== null) {
    timelineState.currentTime = currentTime;
  }
  
  if (playbackSpeed !== null) {
    timelineState.playbackSpeed = playbackSpeed;
  }
  
  if (Object.keys(timelineState).length > 0) {
    decodedState.timeline = timelineState;
  }
  
  // Decode layer state
  const activeLayer = decodeLayerFromUrl(searchParams);
  const windyMode = decodeWindyModeFromUrl(searchParams);
  const opacity = decodeOpacityFromUrl(searchParams);
  
  const layerState: Partial<LayerState> = {};
  
  if (activeLayer !== null) {
    layerState.activeLayer = activeLayer;
    layerState.showWindLayer = activeLayer === 'wind';
  }
  
  if (windyMode !== null) {
    layerState.windyMode = windyMode;
  }
  
  if (opacity !== null) {
    layerState.overlayOpacity = opacity;
  }
  
  if (Object.keys(layerState).length > 0) {
    decodedState.layers = layerState;
  }
  
  return decodedState;
}

// ============================================================================
// URL UPDATE UTILITIES
// ============================================================================

/**
 * Update browser URL with current state without triggering navigation
 * Requirements: 2.3 - Update URL as state changes
 */
export function updateUrlWithState(state: WindyState): void {
  const queryString = encodeStateToUrl(state);
  const newUrl = `${window.location.pathname}${queryString}`;
  
  // Use replaceState to update URL without adding to history
  window.history.replaceState(null, '', newUrl);
}

/**
 * Get shareable URL with current state
 * Requirements: 2.3 - Generate shareable links
 */
export function getShareableUrl(state: WindyState): string {
  const queryString = encodeStateToUrl(state);
  return `${window.location.origin}${window.location.pathname}${queryString}`;
}

/**
 * Copy shareable URL to clipboard
 */
export async function copyShareableUrl(state: WindyState): Promise<boolean> {
  try {
    const url = getShareableUrl(state);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.warn('Failed to copy URL to clipboard:', error);
    return false;
  }
}
