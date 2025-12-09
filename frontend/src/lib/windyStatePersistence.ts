/**
 * localStorage persistence utilities for Windy application state
 * Requirements: 3.4, 6.3 - Persist layer preferences and Windy mode
 */

import type { WindyState, LayerState, TimelineState } from '../contexts/WindyStateContext';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  LAYER_PREFERENCES: 'windy_layer_preferences',
  WINDY_MODE: 'windy_mode',
  PLAYBACK_SPEED: 'windy_playback_speed',
  OVERLAY_OPACITY: 'windy_overlay_opacity',
  LOOP_ENABLED: 'windy_loop_enabled',
} as const;

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Safely get item from localStorage with error handling
 */
function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to read from localStorage (key: ${key}):`, error);
    return null;
  }
}

/**
 * Safely set item in localStorage with error handling
 */
function setStorageItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to write to localStorage (key: ${key}):`, error);
  }
}

/**
 * Safely remove item from localStorage with error handling
 */
function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove from localStorage (key: ${key}):`, error);
  }
}

// ============================================================================
// LAYER PREFERENCES PERSISTENCE
// ============================================================================

/**
 * Save layer preferences to localStorage
 * Requirements: 6.3 - Store layer preferences
 */
export function saveLayerPreferences(layers: LayerState): void {
  const preferences = {
    activeLayer: layers.activeLayer,
    showWindLayer: layers.showWindLayer,
    windyMode: layers.windyMode,
    overlayOpacity: layers.overlayOpacity,
  };
  
  setStorageItem(STORAGE_KEYS.LAYER_PREFERENCES, JSON.stringify(preferences));
}

/**
 * Load layer preferences from localStorage
 * Returns null if no preferences are saved or if parsing fails
 */
export function loadLayerPreferences(): Partial<LayerState> | null {
  const stored = getStorageItem(STORAGE_KEYS.LAYER_PREFERENCES);
  
  if (!stored) {
    return null;
  }
  
  try {
    const preferences = JSON.parse(stored);
    
    // Validate the loaded data
    if (typeof preferences !== 'object' || preferences === null) {
      return null;
    }
    
    return preferences;
  } catch (error) {
    console.warn('Failed to parse layer preferences from localStorage:', error);
    return null;
  }
}

// ============================================================================
// WINDY MODE PERSISTENCE
// ============================================================================

/**
 * Save Windy mode setting to localStorage
 * Requirements: 3.4 - Persist Windy mode preference
 */
export function saveWindyMode(enabled: boolean): void {
  setStorageItem(STORAGE_KEYS.WINDY_MODE, JSON.stringify(enabled));
}

/**
 * Load Windy mode setting from localStorage
 * Returns null if no setting is saved
 */
export function loadWindyMode(): boolean | null {
  const stored = getStorageItem(STORAGE_KEYS.WINDY_MODE);
  
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to parse Windy mode from localStorage:', error);
    return null;
  }
}

// ============================================================================
// TIMELINE PREFERENCES PERSISTENCE
// ============================================================================

/**
 * Save timeline playback speed preference to localStorage
 * Requirements: 3.4, 6.3 - Save timeline playback speed preference
 */
export function savePlaybackSpeed(speed: number): void {
  setStorageItem(STORAGE_KEYS.PLAYBACK_SPEED, JSON.stringify(speed));
}

/**
 * Load timeline playback speed preference from localStorage
 * Returns null if no preference is saved
 */
export function loadPlaybackSpeed(): number | null {
  const stored = getStorageItem(STORAGE_KEYS.PLAYBACK_SPEED);
  
  if (!stored) {
    return null;
  }
  
  try {
    const speed = JSON.parse(stored);
    
    // Validate speed is a valid number
    if (typeof speed !== 'number' || isNaN(speed)) {
      return null;
    }
    
    // Ensure speed is within valid range (0.5x to 4x)
    if (speed < 0.5 || speed > 4) {
      return null;
    }
    
    return speed;
  } catch (error) {
    console.warn('Failed to parse playback speed from localStorage:', error);
    return null;
  }
}

/**
 * Save overlay opacity preference to localStorage
 */
export function saveOverlayOpacity(opacity: number): void {
  setStorageItem(STORAGE_KEYS.OVERLAY_OPACITY, JSON.stringify(opacity));
}

/**
 * Load overlay opacity preference from localStorage
 * Returns null if no preference is saved
 */
export function loadOverlayOpacity(): number | null {
  const stored = getStorageItem(STORAGE_KEYS.OVERLAY_OPACITY);
  
  if (!stored) {
    return null;
  }
  
  try {
    const opacity = JSON.parse(stored);
    
    // Validate opacity is a valid number
    if (typeof opacity !== 'number' || isNaN(opacity)) {
      return null;
    }
    
    // Ensure opacity is within valid range (0 to 1)
    if (opacity < 0 || opacity > 1) {
      return null;
    }
    
    return opacity;
  } catch (error) {
    console.warn('Failed to parse overlay opacity from localStorage:', error);
    return null;
  }
}

/**
 * Save loop enabled preference to localStorage
 */
export function saveLoopEnabled(enabled: boolean): void {
  setStorageItem(STORAGE_KEYS.LOOP_ENABLED, JSON.stringify(enabled));
}

/**
 * Load loop enabled preference from localStorage
 * Returns null if no preference is saved
 */
export function loadLoopEnabled(): boolean | null {
  const stored = getStorageItem(STORAGE_KEYS.LOOP_ENABLED);
  
  if (!stored) {
    return null;
  }
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to parse loop enabled from localStorage:', error);
    return null;
  }
}

// ============================================================================
// COMBINED STATE PERSISTENCE
// ============================================================================

/**
 * Save all persistable state to localStorage
 * Requirements: 3.4, 6.3 - Restore state on app initialization
 */
export function saveState(state: WindyState): void {
  saveLayerPreferences(state.layers);
  saveWindyMode(state.layers.windyMode);
  savePlaybackSpeed(state.timeline.playbackSpeed);
  saveOverlayOpacity(state.layers.overlayOpacity);
  saveLoopEnabled(state.timeline.loopEnabled);
}

/**
 * Deep partial type for nested state objects
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? Partial<T[P]> : T[P];
};

/**
 * Load all persistable state from localStorage
 * Returns partial state object with only the values that were successfully loaded
 * Requirements: 3.4, 6.3 - Restore state on app initialization
 */
export function loadState(): DeepPartial<WindyState> {
  const layerPreferences = loadLayerPreferences();
  const windyMode = loadWindyMode();
  const playbackSpeed = loadPlaybackSpeed();
  const overlayOpacity = loadOverlayOpacity();
  const loopEnabled = loadLoopEnabled();
  
  const restoredState: DeepPartial<WindyState> = {};
  
  // Restore layer state
  const layerState: Partial<LayerState> = {};
  
  if (layerPreferences) {
    Object.assign(layerState, layerPreferences);
  }
  
  if (windyMode !== null) {
    layerState.windyMode = windyMode;
  }
  
  if (overlayOpacity !== null) {
    layerState.overlayOpacity = overlayOpacity;
  }
  
  if (Object.keys(layerState).length > 0) {
    restoredState.layers = layerState;
  }
  
  // Restore timeline state
  const timelineState: Partial<TimelineState> = {};
  
  if (playbackSpeed !== null) {
    timelineState.playbackSpeed = playbackSpeed;
  }
  
  if (loopEnabled !== null) {
    timelineState.loopEnabled = loopEnabled;
  }
  
  if (Object.keys(timelineState).length > 0) {
    restoredState.timeline = timelineState;
  }
  
  return restoredState;
}

/**
 * Clear all persisted state from localStorage
 */
export function clearPersistedState(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeStorageItem(key);
  });
}
