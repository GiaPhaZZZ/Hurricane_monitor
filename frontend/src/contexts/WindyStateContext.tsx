import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { LayerType } from '../components/WeatherLayerControl';
import { loadState, saveState } from '../lib/windyStatePersistence';
import { decodeStateFromUrl, updateUrlWithState } from '../lib/windyUrlState';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Timeline state for temporal navigation
 * Requirements: 2.3, 2.4, 2.5
 */
export interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5x, 1x, 2x, 4x
  loopEnabled: boolean;
  startTime: number;
  endTime: number;
}

/**
 * Layer state for weather overlays and visualizations
 * Requirements: 3.4, 6.3
 */
export interface LayerState {
  activeLayer: LayerType;
  showWindLayer: boolean;
  overlayOpacity: number;
  windyMode: boolean;
}

/**
 * Combined application state
 */
export interface WindyState {
  timeline: TimelineState;
  layers: LayerState;
}

/**
 * Initial state values
 */
const initialState: WindyState = {
  timeline: {
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    loopEnabled: false,
    startTime: 0,
    endTime: 0,
  },
  layers: {
    activeLayer: 'none', // Mặc định không hiển thị layer nào (hiển thị bản đồ satellite/terrain)
    showWindLayer: false,
    overlayOpacity: 0.6,
    windyMode: false,
  },
};

// ============================================================================
// ACTION TYPES
// ============================================================================

type WindyAction =
  // Timeline actions
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_IS_PLAYING'; payload: boolean }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'SET_LOOP_ENABLED'; payload: boolean }
  | { type: 'SET_TIME_RANGE'; payload: { startTime: number; endTime: number } }
  | { type: 'RESET_TIMELINE' }
  // Layer actions
  | { type: 'SET_ACTIVE_LAYER'; payload: LayerType }
  | { type: 'SET_SHOW_WIND_LAYER'; payload: boolean }
  | { type: 'SET_OVERLAY_OPACITY'; payload: number }
  | { type: 'SET_WINDY_MODE'; payload: boolean }
  | { type: 'TOGGLE_WINDY_MODE' }
  // Batch actions
  | { type: 'RESTORE_STATE'; payload: DeepPartial<WindyState> };

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Reducer for managing Windy application state
 * Handles timeline, layers, and Windy mode state updates
 */
function windyReducer(state: WindyState, action: WindyAction): WindyState {
  switch (action.type) {
    // Timeline actions
    case 'SET_CURRENT_TIME':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTime: action.payload,
        },
      };

    case 'SET_IS_PLAYING':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isPlaying: action.payload,
        },
      };

    case 'SET_PLAYBACK_SPEED':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          playbackSpeed: action.payload,
        },
      };

    case 'SET_LOOP_ENABLED':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          loopEnabled: action.payload,
        },
      };

    case 'SET_TIME_RANGE':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          startTime: action.payload.startTime,
          endTime: action.payload.endTime,
        },
      };

    case 'RESET_TIMELINE':
      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTime: state.timeline.startTime,
          isPlaying: false,
        },
      };

    // Layer actions
    case 'SET_ACTIVE_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          activeLayer: action.payload,
          // Turn off wind layer when switching to other layers
          showWindLayer: action.payload === 'wind' ? true : false,
        },
      };

    case 'SET_SHOW_WIND_LAYER':
      return {
        ...state,
        layers: {
          ...state.layers,
          showWindLayer: action.payload,
          // If enabling wind layer, set active layer to 'none'
          activeLayer: action.payload ? 'none' : state.layers.activeLayer,
        },
      };

    case 'SET_OVERLAY_OPACITY':
      return {
        ...state,
        layers: {
          ...state.layers,
          overlayOpacity: Math.max(0, Math.min(1, action.payload)),
        },
      };

    case 'SET_WINDY_MODE':
      return {
        ...state,
        layers: {
          ...state.layers,
          windyMode: action.payload,
        },
      };

    case 'TOGGLE_WINDY_MODE':
      return {
        ...state,
        layers: {
          ...state.layers,
          windyMode: !state.layers.windyMode,
        },
      };

    // Batch actions
    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.payload,
        timeline: {
          ...state.timeline,
          ...action.payload.timeline,
        },
        layers: {
          ...state.layers,
          ...action.payload.layers,
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// ACTION CREATORS
// ============================================================================

/**
 * Action creators for timeline state updates
 */
export const timelineActions = {
  setCurrentTime: (time: number): WindyAction => ({
    type: 'SET_CURRENT_TIME',
    payload: time,
  }),
  setIsPlaying: (isPlaying: boolean): WindyAction => ({
    type: 'SET_IS_PLAYING',
    payload: isPlaying,
  }),
  setPlaybackSpeed: (speed: number): WindyAction => ({
    type: 'SET_PLAYBACK_SPEED',
    payload: speed,
  }),
  setLoopEnabled: (enabled: boolean): WindyAction => ({
    type: 'SET_LOOP_ENABLED',
    payload: enabled,
  }),
  setTimeRange: (startTime: number, endTime: number): WindyAction => ({
    type: 'SET_TIME_RANGE',
    payload: { startTime, endTime },
  }),
  resetTimeline: (): WindyAction => ({
    type: 'RESET_TIMELINE',
  }),
};

/**
 * Action creators for layer state updates
 */
export const layerActions = {
  setActiveLayer: (layer: LayerType): WindyAction => ({
    type: 'SET_ACTIVE_LAYER',
    payload: layer,
  }),
  setShowWindLayer: (show: boolean): WindyAction => ({
    type: 'SET_SHOW_WIND_LAYER',
    payload: show,
  }),
  setOverlayOpacity: (opacity: number): WindyAction => ({
    type: 'SET_OVERLAY_OPACITY',
    payload: opacity,
  }),
  setWindyMode: (enabled: boolean): WindyAction => ({
    type: 'SET_WINDY_MODE',
    payload: enabled,
  }),
  toggleWindyMode: (): WindyAction => ({
    type: 'TOGGLE_WINDY_MODE',
  }),
};

/**
 * Action creator for restoring state from storage
 */
export const restoreState = (state: DeepPartial<WindyState>): WindyAction => ({
  type: 'RESTORE_STATE',
  payload: state,
});

// ============================================================================
// CONTEXT
// ============================================================================

interface WindyStateContextValue {
  state: WindyState;
  dispatch: React.Dispatch<WindyAction>;
  // Convenience methods
  timeline: typeof timelineActions;
  layers: typeof layerActions;
}

const WindyStateContext = createContext<WindyStateContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Deep partial type for nested state objects
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? Partial<T[P]> : T[P];
};

interface WindyStateProviderProps {
  children: ReactNode;
  initialState?: DeepPartial<WindyState>;
}

/**
 * Provider component for Windy application state
 * Manages timeline, layers, and Windy mode state with persistence
 * Requirements: 3.4, 6.3, 2.3
 */
export function WindyStateProvider({ children, initialState: customInitialState }: WindyStateProviderProps) {
  // Load state from URL (highest priority)
  const urlState = decodeStateFromUrl(window.location.search);
  
  // Load persisted state from localStorage (medium priority)
  const persistedState = loadState();
  
  // Merge all state sources with proper priority:
  // URL params > custom initial state > default state
  // KHÔNG load activeLayer và showWindLayer từ localStorage để luôn bắt đầu với bản đồ mặc định
  const mergedInitialState = {
    ...initialState,
    ...customInitialState,
    ...urlState,
    timeline: {
      ...initialState.timeline,
      ...persistedState.timeline,
      ...customInitialState?.timeline,
      ...urlState.timeline,
    },
    layers: {
      ...initialState.layers,
      // Chỉ load opacity và windyMode từ localStorage, KHÔNG load activeLayer và showWindLayer
      overlayOpacity: persistedState.layers?.overlayOpacity ?? initialState.layers.overlayOpacity,
      windyMode: persistedState.layers?.windyMode ?? initialState.layers.windyMode,
      // Luôn bắt đầu với activeLayer = 'none' và showWindLayer = false
      activeLayer: urlState.layers?.activeLayer ?? customInitialState?.layers?.activeLayer ?? 'none',
      showWindLayer: urlState.layers?.showWindLayer ?? customInitialState?.layers?.showWindLayer ?? false,
    },
  };

  const [state, dispatch] = useReducer(windyReducer, mergedInitialState);

  // Persist state changes to localStorage
  // Requirements: 3.4, 6.3 - Save preferences on state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Update URL with current state for sharing
  // Requirements: 2.3 - Update URL as state changes
  useEffect(() => {
    updateUrlWithState(state);
  }, [state]);

  const contextValue: WindyStateContextValue = {
    state,
    dispatch,
    timeline: timelineActions,
    layers: layerActions,
  };

  return (
    <WindyStateContext.Provider value={contextValue}>
      {children}
    </WindyStateContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access Windy application state and actions
 * @throws Error if used outside of WindyStateProvider
 */
export function useWindyState() {
  const context = useContext(WindyStateContext);
  
  if (context === undefined) {
    throw new Error('useWindyState must be used within a WindyStateProvider');
  }
  
  return context;
}

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

/**
 * Hook to access only timeline state
 */
export function useTimelineState() {
  const { state } = useWindyState();
  return state.timeline;
}

/**
 * Hook to access only layer state
 */
export function useLayerState() {
  const { state } = useWindyState();
  return state.layers;
}
