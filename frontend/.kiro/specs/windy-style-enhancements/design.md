# Design Document

## Overview

This design document outlines the architecture and implementation approach for transforming the existing storm tracker into a Windy.com-style interface. The enhancements focus on adding animated wind particle visualization, temporal navigation via timeline slider, simplified visual styling, and improved UI controls while maintaining compatibility with existing storm visualization features.

## Architecture

### High-Level Component Structure

```
WeatherMap (Enhanced)
├── WindParticleCanvas (NEW)
│   ├── ParticleEngine
│   ├── WindFieldManager
│   └── PerformanceMonitor
├── TimelineSlider (NEW)
│   ├── TimelineBar
│   ├── PlaybackControls
│   └── TimeMarkers
├── RightSidebar (NEW)
│   ├── LayerToggleButtons
│   └── SettingsPanel
├── WeatherOverlay (Enhanced)
│   ├── TemperatureLayer
│   └── WindSpeedLayer
├── StormVisualization (Enhanced)
│   ├── WindyModeToggle (NEW)
│   ├── SimplifiedTooltip (NEW)
│   └── Existing storm components
└── ResponsiveContainer (NEW)
```

### Data Flow

1. **Wind Data Pipeline**: API → WindFieldManager → ParticleEngine → Canvas
2. **Timeline Control**: User Input → TimelineSlider → Map State → Storm Components
3. **Layer Management**: RightSidebar → Layer State → WeatherOverlay/WindParticle
4. **Performance Monitoring**: PerformanceMonitor → Adaptive Particle Count


## Components and Interfaces

### 1. WindParticleCanvas Component

**Purpose**: Renders animated wind particles on a canvas overlay

**Props**:
```typescript
interface WindParticleCanvasProps {
  windData: WindField;
  particleCount?: number;
  isVisible: boolean;
  opacity?: number;
  colorScheme?: 'default' | 'monochrome';
}
```

**Key Features**:
- Canvas-based rendering for performance
- Adaptive particle count based on device capabilities
- Velocity-based particle coloring
- Smooth fade-in/fade-out transitions

**Implementation Details**:
- Use OffscreenCanvas for background processing where supported
- Implement spatial grid (50x50 cells) for efficient wind vector lookups
- Pre-allocate particle arrays to minimize garbage collection
- Use requestAnimationFrame for smooth 60 FPS animation

### 2. TimelineSlider Component

**Purpose**: Provides temporal navigation and playback controls

**Props**:
```typescript
interface TimelineSliderProps {
  startTime: number;
  endTime: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  stormData: Storm[];
  isPlaying?: boolean;
  playbackSpeed?: number;
}
```

**Key Features**:
- Draggable time handle
- Play/pause/speed controls
- Time marker labels at 3-hour intervals
- Hover tooltip showing exact time
- Keyboard navigation support

**Implementation Details**:
- Use React state for current time position
- Implement useAnimationFrame hook for smooth playback
- Debounce time change events to avoid excessive re-renders
- Store playback state in URL query params for sharing


### 3. RightSidebar Component

**Purpose**: Vertical layer control panel on the right side

**Props**:
```typescript
interface RightSidebarProps {
  activeLayers: Set<LayerType>;
  onLayerToggle: (layer: LayerType) => void;
  isMobile: boolean;
}
```

**Key Features**:
- Circular icon buttons (40px diameter)
- Hover tooltips with layer names
- Active state highlighting
- Responsive collapse on mobile

**Implementation Details**:
- Use CSS Grid for button layout
- Implement tooltip positioning with Radix UI
- Store layer preferences in localStorage
- Animate button state changes with Framer Motion

### 4. WindyModeToggle Component

**Purpose**: Switches between gradient and white-dashed track styles

**Props**:
```typescript
interface WindyModeToggleProps {
  isWindyMode: boolean;
  onToggle: (enabled: boolean) => void;
}
```

**Key Features**:
- Toggle switch in settings panel
- Smooth transition between modes
- Persists preference to localStorage

**Implementation Details**:
- Pass mode state down to all storm visualization components
- Use CSS transitions for style changes
- Conditionally render track components based on mode

### 5. SimplifiedTooltip Component

**Purpose**: Minimal white-background tooltips for storm data

**Props**:
```typescript
interface SimplifiedTooltipProps {
  timestamp: number;
  windSpeed: number;
  pressure: number;
  position: { x: number; y: number };
}
```

**Key Features**:
- Compact single-line format
- Auto-positioning with edge detection
- Fade-in/fade-out animations
- Drop shadow for depth

**Implementation Details**:
- Use Radix UI Tooltip primitive
- Format: "HH:MM | XXX km/h | YYYY hPa"
- Position 10px above cursor
- 200ms delay before hiding


## Data Models

### WindField Interface

```typescript
interface WindField {
  width: number;
  height: number;
  uComponent: Float32Array; // East-west wind component
  vComponent: Float32Array; // North-south wind component
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  timestamp: number;
}
```

### Particle Interface

```typescript
interface Particle {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  speed: number;
  color: string;
}
```

### TimelineState Interface

```typescript
interface TimelineState {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5x, 1x, 2x, 4x
  loopEnabled: boolean;
  startTime: number;
  endTime: number;
}
```

### LayerState Interface

```typescript
interface LayerState {
  wind: boolean;
  temperature: boolean;
  radar: boolean;
  satellite: boolean;
  windyMode: boolean;
  overlayOpacity: number;
}
```

## Error Handling

### Wind Data Loading Errors

- **Scenario**: Wind data API fails or returns invalid data
- **Handling**: Display fallback message, disable particle layer, log error
- **User Feedback**: Toast notification "Wind data unavailable"

### Performance Degradation

- **Scenario**: Frame rate drops below 30 FPS
- **Handling**: Automatically reduce particle count by 25%
- **User Feedback**: Optional notification "Performance mode enabled"

### Timeline Synchronization Issues

- **Scenario**: Storm data doesn't align with timeline range
- **Handling**: Adjust timeline bounds to match available data
- **User Feedback**: Update timeline markers to show data gaps


## Testing Strategy

### Unit Tests

1. **ParticleEngine Tests**
   - Particle initialization and lifecycle
   - Wind vector interpolation accuracy
   - Performance monitoring thresholds
   - Particle respawning logic

2. **TimelineSlider Tests**
   - Time calculation and formatting
   - Playback speed adjustments
   - Keyboard navigation handlers
   - Boundary conditions (start/end of timeline)

3. **WindyMode Tests**
   - Style switching logic
   - Track rendering differences
   - Tooltip format changes
   - State persistence

### Integration Tests

1. **Timeline-Storm Synchronization**
   - Verify storm positions update with timeline
   - Test playback animation smoothness
   - Validate time marker accuracy

2. **Layer Interaction Tests**
   - Test multiple layer toggles
   - Verify overlay opacity changes
   - Test layer state persistence

3. **Responsive Behavior Tests**
   - Test mobile layout adaptations
   - Verify touch target sizes
   - Test orientation change handling

### Performance Tests

1. **Particle Rendering Performance**
   - Measure FPS with varying particle counts
   - Test adaptive performance scaling
   - Verify memory usage stays below 100MB

2. **Timeline Animation Performance**
   - Measure timeline scrubbing responsiveness
   - Test playback smoothness at different speeds
   - Verify no memory leaks during long playback

### Visual Regression Tests

1. **Windy Mode Styling**
   - Compare track rendering in both modes
   - Verify tooltip appearance
   - Test color scheme consistency

2. **Responsive Layouts**
   - Screenshot tests at mobile/tablet/desktop sizes
   - Verify sidebar positioning
   - Test timeline drawer behavior

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Set up WindParticleCanvas component structure
- Implement basic particle engine
- Create WindFieldManager for data handling
- Add performance monitoring utilities

### Phase 2: Timeline Slider (Week 2)
- Build TimelineSlider component
- Implement playback controls
- Add keyboard navigation
- Integrate with existing storm data

### Phase 3: Windy Mode & Styling (Week 3)
- Create WindyModeToggle component
- Implement white-dashed track rendering
- Build SimplifiedTooltip component
- Add style transition animations

### Phase 4: Right Sidebar & Layers (Week 4)
- Build RightSidebar component
- Integrate with existing layer controls
- Add weather overlay enhancements
- Implement layer state management

### Phase 5: Responsive & Accessibility (Week 5)
- Add responsive breakpoints
- Implement mobile adaptations
- Add keyboard shortcuts
- Enhance screen reader support

### Phase 6: Performance & Polish (Week 6)
- Optimize particle rendering
- Add adaptive performance scaling
- Implement error boundaries
- Final testing and bug fixes


## Technical Considerations

### Wind Data Sources

**Option 1: OpenWeatherMap API**
- Provides global wind data at various altitudes
- 3-hour forecast intervals
- Requires API key (free tier available)
- Data format: JSON with u/v wind components

**Option 2: NOAA GFS Data**
- High-resolution global forecast model
- Updated every 6 hours
- Free and open access
- Data format: GRIB2 (requires parsing)

**Recommendation**: Start with OpenWeatherMap for simplicity, add NOAA as enhancement

### Canvas Rendering Optimization

**Techniques**:
1. **Double Buffering**: Use two canvases to avoid flicker
2. **Dirty Rectangle**: Only redraw changed regions
3. **Web Workers**: Offload particle calculations to background thread
4. **GPU Acceleration**: Use WebGL for particle rendering if available

**Trade-offs**:
- WebGL provides 10x performance but adds complexity
- Web Workers add latency but improve main thread responsiveness
- Start with Canvas 2D, migrate to WebGL if needed

### State Management

**Approach**: Use React Context + useReducer for global state

```typescript
interface AppState {
  timeline: TimelineState;
  layers: LayerState;
  storms: Storm[];
  windData: WindField | null;
  performance: PerformanceMetrics;
}
```

**Benefits**:
- Centralized state management
- Easy to debug with Redux DevTools
- Predictable state updates
- No external dependencies

### Browser Compatibility

**Target Support**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

**Polyfills Needed**:
- ResizeObserver for older browsers
- requestAnimationFrame fallback
- Canvas.toBlob for Safari < 14

### Accessibility Standards

**WCAG 2.1 Level AA Compliance**:
- All interactive elements keyboard accessible
- Focus indicators visible (2px outline)
- Color contrast ratio ≥ 4.5:1 for text
- Screen reader announcements for state changes
- Skip links for keyboard navigation
- ARIA labels for all controls

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-slider": "^1.1.2",
    "framer-motion": "^10.16.4"
  },
  "devDependencies": {
    "@types/offscreencanvas": "^2019.7.0"
  }
}
```

### Existing Dependencies (Reuse)
- react-leaflet: Map integration
- leaflet: Base map functionality
- tailwindcss: Styling
- lucide-react: Icons

## Security Considerations

1. **API Key Protection**: Store weather API keys in environment variables
2. **XSS Prevention**: Sanitize all user inputs in tooltips
3. **CORS**: Configure proper CORS headers for wind data endpoints
4. **Rate Limiting**: Implement client-side rate limiting for API calls
5. **Data Validation**: Validate all wind data before rendering

## Monitoring and Analytics

**Metrics to Track**:
- Average FPS during particle animation
- Timeline interaction frequency
- Layer toggle usage patterns
- Mobile vs desktop usage ratio
- Error rates by component
- API response times

**Tools**:
- Performance API for FPS monitoring
- Custom event tracking for user interactions
- Error boundary for crash reporting
