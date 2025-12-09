# Design Document: Windy.com-Style Storm Visualization

## Overview

This design transforms the storm track visualization to match Windy.com's professional aesthetic. The focus is on creating smooth gradient storm tracks, enhanced animated markers with hurricane icons, progressive track drawing animations, and visually distinct forecast cones. The design maintains compatibility with the existing API integration and Leaflet-based mapping system.

## Architecture

### Component Structure

```
WeatherMap (existing)
├── StormAnimation (enhanced)
│   ├── GradientStormTrack (new)
│   ├── HurricaneMarker (new)
│   ├── AnimatedStormPath (new)
│   └── ForecastCone (enhanced)
└── StormTooltip (new)
```

### Key Design Principles

1. **Visual Hierarchy**: Storm tracks should be the primary visual focus with gradient colors and glow effects
2. **Smooth Animations**: All transitions use easing functions for natural movement
3. **Performance**: Use canvas-based rendering for complex gradients and animations
4. **Accessibility**: Maintain color contrast and provide alternative text for screen readers

## Components and Interfaces

### Component Hierarchy Update

```
WeatherMap (existing)
├── StormAnimation (enhanced)
│   ├── GradientStormTrack (existing)
│   ├── HurricaneMarker (existing)
│   ├── WindStrengthCircles (new)
│   ├── AnimatedStormPath (existing)
│   └── ForecastCone (existing)
└── StormTooltip (existing)
```

### 1. GradientStormTrack Component

**Purpose**: Renders storm tracks with smooth color gradients based on intensity changes

**Implementation Approach**:
- Use Leaflet's `Canvas` renderer for performance with gradient polylines
- Create custom path renderer that interpolates colors between points
- Apply drop shadow effect using CSS filters or canvas shadow properties

**Props Interface**:
```typescript
interface GradientStormTrackProps {
  points: StormPoint[];
  isHistorical: boolean;
  isAnimating: boolean;
  animationProgress: number; // 0-1 for progressive drawing
}
```

**Rendering Strategy**:
- Split track into segments between consecutive points
- Calculate color for each segment based on storm category
- Use linear interpolation for smooth color transitions
- Apply different opacity for historical (80%) vs forecast (60%) segments
- Add glow effect using multiple overlapping lines with decreasing opacity

### 2. HurricaneMarker Component

**Purpose**: Displays hurricane icon markers that rotate based on movement direction

**Implementation Approach**:
- Create SVG hurricane spiral icon with customizable size and color
- Use Leaflet's `DivIcon` with embedded SVG
- Calculate rotation angle from bearing between consecutive points
- Apply pulsing animation using CSS keyframes

**Props Interface**:
```typescript
interface HurricaneMarkerProps {
  position: StormPoint;
  nextPosition?: StormPoint;
  size: number; // 20-40px based on wind speed
  isPulsing: boolean;
  showTooltip: boolean;
}
```

**SVG Icon Design**:
```svg
<svg viewBox="0 0 40 40">
  <path d="M20,20 Q15,10 20,5 Q25,10 20,20 Q30,15 35,20 Q30,25 20,20 Q25,30 20,35 Q15,30 20,20 Q10,25 5,20 Q10,15 20,20" 
        fill="currentColor" 
        stroke="white" 
        stroke-width="2"/>
  <circle cx="20" cy="20" r="4" fill="white"/>
</svg>
```

### 3. AnimatedStormPath Component

**Purpose**: Manages progressive drawing animation of storm tracks

**Implementation Approach**:
- Use requestAnimationFrame for smooth 60fps animation
- Interpolate marker position between points for fluid movement
- Track animation state (playing, paused, completed)
- Display timestamp labels at key points during animation

**State Management**:
```typescript
interface AnimationState {
  isPlaying: boolean;
  currentSegment: number;
  segmentProgress: number; // 0-1 within current segment
  startTime: number;
  duration: number; // 3000ms total
}
```

**Animation Logic**:
- Calculate total animation duration (3 seconds)
- Divide duration proportionally across all segments
- Use linear interpolation for position: `pos = lerp(start, end, progress)`
- Update marker rotation smoothly during movement
- Emit events at key points for timestamp label display

### 4. Enhanced ForecastCone Component

**Purpose**: Renders uncertainty cone with gradient fill and proper width calculation

**Implementation Approach**:
- Calculate cone width using formula: `width = 50nm * (hours / 24)`
- Create polygon with smooth curves using Bezier interpolation
- Apply gradient fill from opaque at current position to transparent at end
- Use dashed white border for visual distinction

**Cone Calculation**:
```typescript
function calculateForecastCone(points: StormPoint[]): LatLng[][] {
  const conePoints: LatLng[][] = [[], []]; // left and right edges
  
  points.forEach((point, index) => {
    const hoursFromNow = (point.timestamp - Date.now()) / (1000 * 60 * 60);
    const widthKm = (50 * 1.852) * (hoursFromNow / 24); // 50nm to km
    
    const bearing = calculateBearing(points[index], points[index + 1]);
    const leftPoint = offsetPoint(point, bearing - 90, widthKm);
    const rightPoint = offsetPoint(point, bearing + 90, widthKm);
    
    conePoints[0].push(leftPoint);
    conePoints[1].push(rightPoint);
  });
  
  return [
    ...conePoints[0],
    ...conePoints[1].reverse()
  ];
}
```

**Gradient Fill Implementation**:
- Use Leaflet's `fillOpacity` with custom gradient renderer
- Create canvas gradient from current position (25% opacity) to end (5% opacity)
- Apply white border with 2px width and dash pattern [10, 5]

### 5. WindStrengthCircles Component

**Purpose**: Renders concentric dashed circles around storm markers to visualize wind strength zones

**Implementation Approach**:
- Use Leaflet's `Circle` component with custom dash pattern styling
- Calculate radii based on wind speed data and standard meteorological thresholds
- Apply category-based colors with reduced opacity for subtle visual effect
- Animate radius changes when storm intensity updates

**Props Interface**:
```typescript
interface WindStrengthCirclesProps {
  center: LatLng;
  windSpeed: number;
  category: string;
  windRadii?: {
    kt34?: number; // Radius in km for 34-knot winds
    kt50?: number; // Radius in km for 50-knot winds
    kt64?: number; // Radius in km for 64-knot winds
    kt100?: number; // Radius in km for 100-knot winds
  };
  isAnimating: boolean;
}
```

**Circle Calculation Logic**:
```typescript
function calculateWindCircles(windSpeed: number, windRadii?: WindRadii): CircleConfig[] {
  const circles: CircleConfig[] = [];
  const thresholds = [
    { speed: 34, radius: windRadii?.kt34 || windSpeed * 0.5 },
    { speed: 50, radius: windRadii?.kt50 || windSpeed * 0.35 },
    { speed: 64, radius: windRadii?.kt64 || windSpeed * 0.25 },
    { speed: 100, radius: windRadii?.kt100 || windSpeed * 0.15 }
  ];
  
  // Only show circles for wind speeds that exceed the threshold
  thresholds.forEach(threshold => {
    if (windSpeed >= threshold.speed) {
      circles.push({
        radius: threshold.radius,
        windSpeed: threshold.speed
      });
    }
  });
  
  return circles;
}
```

**Styling Configuration**:
```typescript
interface CircleStyle {
  color: string; // Category color
  weight: 2; // Line width in pixels
  opacity: 0.4; // 40% opacity
  fillOpacity: 0; // No fill
  dashArray: '8, 6'; // 8px dash, 6px gap
}
```

**Animation Implementation**:
- Use CSS transitions for smooth radius changes
- Transition duration: 500ms with ease-in-out easing
- Animate opacity fade-in when circles first appear
- Stagger animation start times by 100ms per circle for cascading effect

### 6. StormTooltip Component

**Purpose**: Displays rich storm information on marker hover

**Implementation Approach**:
- Use Leaflet's custom tooltip with enhanced styling
- Position tooltip 10px above marker with centered alignment
- Implement hover delay (200ms show, 150ms hide)
- Style with dark background and rounded corners

**Tooltip Content**:
```typescript
interface TooltipContent {
  stormName: string;
  category: string;
  windSpeed: number;
  pressure: number;
  timestamp: Date;
}
```

**Styling**:
```css
.storm-tooltip {
  background: rgba(30, 30, 30, 0.95);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 13px;
  line-height: 1.5;
  min-width: 200px;
}

.storm-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(30, 30, 30, 0.95);
}
```

## Data Models

### Enhanced StormPoint

```typescript
interface StormPoint {
  timestamp: number;
  lat: number;
  lng: number;
  windSpeed: number;
  pressure: number;
  category: string;
  // New fields for enhanced visualization
  bearing?: number; // Movement direction in degrees
  intensity?: number; // Normalized 0-1 for gradient calculation
  uncertaintyRadius?: number; // For forecast points
}
```

### Animation Configuration

```typescript
interface AnimationConfig {
  duration: number; // Total animation duration in ms
  fps: number; // Target frames per second
  easing: 'linear' | 'ease-in-out' | 'ease-out';
  showTimestamps: boolean;
  timestampInterval: number; // Show timestamp every N points
}

const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 3000,
  fps: 60,
  easing: 'ease-in-out',
  showTimestamps: true,
  timestampInterval: 5
};
```

### Color Gradient System

```typescript
interface ColorStop {
  position: number; // 0-1 along the track
  color: string; // Hex color
  category: string;
}

function generateGradientStops(points: StormPoint[]): ColorStop[] {
  return points.map((point, index) => ({
    position: index / (points.length - 1),
    color: getCategoryColor(point.category),
    category: point.category
  }));
}

function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
}
```

## Visual Design Specifications

### Storm Track Styling

**Historical Track**:
- Line width: 4px
- Opacity: 80%
- Style: Solid line
- Glow: 2px white shadow with 50% opacity
- Color: Gradient based on category at each point

**Forecast Track**:
- Line width: 4px
- Opacity: 60%
- Style: Dashed [10px dash, 5px gap]
- Glow: 2px white shadow with 30% opacity
- Color: Gradient based on predicted category

**Transition Point** (Current Position):
- Marker: Pulsing circle with hurricane icon
- Size: 32px diameter
- Border: 3px white
- Animation: Scale 1.0 to 1.3 over 2 seconds, infinite loop
- Label: "Current Position" with timestamp

### Wind Strength Circle Specifications

**Circle Thresholds and Radii**:
```typescript
// Standard meteorological wind speed thresholds
const WIND_THRESHOLDS = {
  TROPICAL_STORM: 34, // knots (63 km/h)
  STORM_FORCE: 50, // knots (93 km/h)
  HURRICANE_FORCE: 64, // knots (119 km/h)
  MAJOR_HURRICANE: 100 // knots (185 km/h)
};

// Default radius multipliers if actual wind radii data not available
const RADIUS_MULTIPLIERS = {
  kt34: 0.5, // 50% of max wind speed in km
  kt50: 0.35, // 35% of max wind speed in km
  kt64: 0.25, // 25% of max wind speed in km
  kt100: 0.15 // 15% of max wind speed in km
};
```

**Visual Properties**:
- Line width: 2px
- Dash pattern: [8, 6] (8px dash, 6px gap)
- Opacity: 40%
- No fill (fillOpacity: 0)
- Color: Matches storm category color
- Z-index: Below storm marker, above forecast cone

**Circle Display Rules**:
- Tropical Storm (34-63 kt): Show 1-2 circles (34kt, possibly 50kt)
- Category 1-2 (64-95 kt): Show 2-3 circles (34kt, 50kt, 64kt)
- Category 3-5 (96+ kt): Show 3-4 circles (34kt, 50kt, 64kt, possibly 100kt)
- Only display circles for current position marker
- Hide circles during track animation, show on completion

**Animation Behavior**:
```typescript
const CIRCLE_ANIMATION = {
  fadeIn: {
    duration: 300, // ms
    delay: 100, // ms between each circle
    easing: 'ease-out'
  },
  radiusChange: {
    duration: 500, // ms
    easing: 'ease-in-out'
  },
  opacityPulse: {
    duration: 2000, // ms
    range: [0.3, 0.5], // Pulse between 30% and 50% opacity
    enabled: false // Optional enhancement
  }
};
```

### Hurricane Marker Specifications

**Size Calculation**:
```typescript
function calculateMarkerSize(windSpeed: number): number {
  const minSize = 20;
  const maxSize = 40;
  const minWind = 30; // km/h
  const maxWind = 200; // km/h
  
  const normalized = (windSpeed - minWind) / (maxWind - minWind);
  return minSize + (maxSize - minSize) * Math.max(0, Math.min(1, normalized));
}
```

**Color Mapping** (Saffir-Simpson Scale):
- Tropical Depression: `#4CAF50` (Green)
- Tropical Storm: `#2196F3` (Blue)
- Category 1: `#FFC107` (Yellow)
- Category 2: `#FF9800` (Orange)
- Category 3: `#F44336` (Red)
- Category 4: `#D32F2F` (Dark Red)
- Category 5: `#9C27B0` (Purple)

### Forecast Cone Styling

**Dimensions**:
- Base width at current position: 0km
- Width growth: 50 nautical miles per 24 hours
- Maximum width: 300km at 72-hour forecast

**Visual Properties**:
- Fill: White with gradient opacity (25% to 5%)
- Border: White, 2px, dashed [10, 5]
- Z-index: Below storm track, above base map

**Gradient Implementation**:
```typescript
function createConeGradient(startPoint: LatLng, endPoint: LatLng): string {
  return `linear-gradient(
    to ${calculateBearing(startPoint, endPoint)}deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.05) 100%
  )`;
}
```

## Animation System

### Progressive Track Drawing

**Phase 1: Initial State** (0ms)
- Display only the starting point marker
- Show storm name label

**Phase 2: Track Drawing** (0-2500ms)
- Progressively reveal track line from start to current position
- Move marker along track at constant speed
- Display timestamp labels at key points (every 5th point)
- Update marker rotation based on movement direction

**Phase 3: Forecast Display** (2500-3000ms)
- Fade in forecast cone over 500ms
- Draw forecast track with dashed line
- Display final forecast marker with direction arrow

**Animation Timing**:
```typescript
const ANIMATION_TIMELINE = {
  trackDrawing: { start: 0, end: 2500 },
  forecastFadeIn: { start: 2500, end: 3000 },
  markerMovement: { start: 0, end: 2500 },
  labelDisplay: { interval: 500 } // Show label every 500ms
};
```

### Easing Functions

```typescript
function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}
```

### Multi-Storm Animation

When playing all storms simultaneously:
- Stagger start times by 500ms per storm
- Maintain independent animation states
- Use different z-index for selected vs background storms
- Reduce opacity of non-selected storms to 50%

## Error Handling

### Missing Data Scenarios

1. **No Forecast Data**:
   - Display only historical track
   - Show "No forecast available" message in tooltip
   - Omit forecast cone rendering

2. **Incomplete Storm Points**:
   - Interpolate missing points using linear interpolation
   - Display warning icon on affected segments
   - Log warning to console for debugging

3. **Invalid Coordinates**:
   - Validate lat/lng ranges before rendering
   - Skip invalid points with console warning
   - Maintain track continuity by connecting valid points

### Performance Optimization

1. **Large Track Datasets**:
   - Simplify tracks with > 100 points using Douglas-Peucker algorithm
   - Render simplified version at zoom levels < 7
   - Use full resolution at zoom levels >= 7

2. **Multiple Active Storms**:
   - Limit simultaneous animations to 5 storms
   - Queue additional storms for sequential playback
   - Reduce animation quality (30fps) when > 3 storms active

3. **Memory Management**:
   - Clean up animation frames on component unmount
   - Remove event listeners when storms are deselected
   - Cache gradient calculations for reuse

## Testing Strategy

### Visual Regression Tests

1. **Storm Track Rendering**:
   - Verify gradient colors match category at each point
   - Confirm line width and opacity values
   - Check glow effect visibility

2. **Marker Display**:
   - Test marker size calculation across wind speed range
   - Verify rotation angles match movement direction
   - Confirm pulsing animation timing

3. **Wind Strength Circles**:
   - Verify correct number of circles based on wind speed
   - Confirm dash pattern (8px dash, 6px gap) renders correctly
   - Test circle radii match wind speed thresholds
   - Validate color and opacity (40%) match storm category
   - Check smooth radius transitions during intensity changes

4. **Animation Playback**:
   - Validate smooth marker movement at 60fps
   - Check timestamp label display timing
   - Verify forecast cone fade-in effect
   - Test wind circle fade-in with staggered timing

### Interaction Tests

1. **Hover Behavior**:
   - Tooltip appears within 200ms of hover
   - Tooltip content displays correct storm data
   - Tooltip hides after 150ms when cursor leaves

2. **Animation Controls**:
   - Play/pause toggles animation state correctly
   - Reset returns to initial state
   - Multiple rapid clicks don't break animation

### Performance Tests

1. **Rendering Performance**:
   - Measure FPS during animation (target: 60fps)
   - Track memory usage with 10 active storms
   - Monitor CPU usage during gradient rendering

2. **Load Testing**:
   - Test with 50+ historical points per storm
   - Verify performance with 10 simultaneous storms
   - Check responsiveness during rapid zoom/pan

### Cross-Browser Compatibility

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Verify:
- SVG icon rendering
- CSS animation support
- Canvas gradient performance
- Leaflet compatibility

## Implementation Notes

### Dependencies

- Existing: `leaflet`, `react-leaflet`
- No new dependencies required
- Use native Canvas API for gradients
- Leverage CSS animations for pulsing effects

### File Structure

```
src/
├── components/
│   ├── storm/
│   │   ├── GradientStormTrack.tsx (existing)
│   │   ├── HurricaneMarker.tsx (existing)
│   │   ├── WindStrengthCircles.tsx (new)
│   │   ├── AnimatedStormPath.tsx (existing)
│   │   ├── ForecastCone.tsx (existing)
│   │   ├── StormTooltip.tsx (existing)
│   │   └── StormAnimation.tsx (to be updated)
│   └── WeatherMap.tsx (minimal changes)
├── lib/
│   ├── stormData.ts (existing)
│   ├── stormAnimations.ts (existing)
│   ├── windStrengthCalculations.ts (new)
│   └── stormGradients.ts (existing)
└── utils/
    ├── geoCalculations.ts (existing)
    └── colorInterpolation.ts (existing)
```

### Migration Strategy

1. Create new components alongside existing StormAnimation
2. Add feature flag to toggle between old and new visualization
3. Test new components thoroughly in isolation
4. Gradually migrate existing functionality
5. Remove old components once new system is stable

### Accessibility Considerations

- Add ARIA labels to all interactive markers
- Provide keyboard navigation for storm selection
- Include screen reader announcements for animation state changes
- Ensure color contrast meets WCAG AA standards
- Provide alternative text descriptions for visual elements
