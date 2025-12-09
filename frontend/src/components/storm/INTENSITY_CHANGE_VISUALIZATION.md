# Storm Intensity Change Visualization

## Overview

This document describes the storm intensity change visualization features implemented for Task 10. The system provides dynamic visual feedback for storm intensity changes through marker size adjustments, smooth color transitions, glow animations, and enhanced styling for major hurricanes.

## Features Implemented

### 1. Dynamic Marker Size Updates (Requirement 10.1)

Markers automatically adjust their size based on wind speed changes:

- **Size Range**: 20-40 pixels
- **Wind Speed Range**: 30-200 km/h
- **Calculation**: Linear interpolation with clamping
- **Major Hurricane Boost**: Category 3+ storms receive a 10% size boost with minimum 32px

```typescript
// Example usage
const markerSize = calculateIntensityMarkerSize(windSpeed, category);
// For C3 with 180 km/h: ~35px (boosted from ~32px)
// For TS with 65 km/h: ~23px
```

### 2. Smooth Color Transitions (Requirement 10.2)

Colors transition smoothly when storm category changes:

- **Transition Duration**: 800ms
- **Easing**: ease-in-out
- **Interpolation**: RGB color space interpolation
- **Applied To**: SVG fill, stroke, and background colors

```typescript
// Color transitions are automatic when category changes
<HurricaneMarker
  position={currentPoint}
  previousPosition={previousPoint}
  useIntensitySize={true}
/>
```

### 3. Glow Animation on Intensification (Requirement 10.3)

Brief glow effect when storm intensifies:

- **Duration**: 1.5 seconds
- **Effect**: Expanding drop-shadow from 0px to 40px
- **Trigger**: Category increase OR wind speed increase > 20 km/h
- **Color**: Matches current storm category color

```typescript
// Glow animation triggers automatically
// Or can be manually controlled:
<HurricaneMarker
  position={point}
  showIntensityGlow={true}
/>
```

### 4. Major Hurricane Enhancement (Requirement 10.4)

Category 3+ hurricanes receive enhanced visual treatment:

- **Larger Markers**: Minimum 32px, 10% size boost
- **Thicker Borders**: 2.5px stroke width (vs 2px for lower categories)
- **Larger Eye**: 5px radius (vs 4px for lower categories)
- **Detection**: Automatic based on category

```typescript
// Major hurricane detection
const isMajor = isMajorHurricane('C3'); // true
const isMajor = isMajorHurricane('C1'); // false
```

### 5. Proper Color Scale (Requirement 10.5)

Complete Saffir-Simpson color scale implementation:

| Category | Color | Hex Code | Description |
|----------|-------|----------|-------------|
| TD | Green | #4CAF50 | Tropical Depression |
| TS | Blue | #2196F3 | Tropical Storm |
| C1 | Yellow | #FFC107 | Category 1 Hurricane |
| C2 | Orange | #FF9800 | Category 2 Hurricane |
| C3 | Red | #F44336 | Category 3 Hurricane (Major) |
| C4 | Dark Red | #D32F2F | Category 4 Hurricane (Major) |
| C5 | Purple | #9C27B0 | Category 5 Hurricane (Major) |

## API Reference

### `calculateIntensityMarkerSize(windSpeed, category)`

Calculates marker size with major hurricane boost.

**Parameters:**
- `windSpeed` (number): Wind speed in km/h
- `category` (string): Storm category (TD, TS, C1-C5)

**Returns:** number (20-40 pixels)

**Example:**
```typescript
const size = calculateIntensityMarkerSize(180, 'C3');
// Returns: ~35px (boosted for major hurricane)
```

### `isMajorHurricane(category)`

Checks if a category is a major hurricane (C3+).

**Parameters:**
- `category` (string): Storm category

**Returns:** boolean

**Example:**
```typescript
isMajorHurricane('C3'); // true
isMajorHurricane('C2'); // false
```

### `detectIntensityChange(previousPoint, currentPoint)`

Detects intensity change between two storm points.

**Parameters:**
- `previousPoint` (StormPoint): Previous storm position
- `currentPoint` (StormPoint): Current storm position

**Returns:** 'intensifying' | 'weakening' | 'stable'

**Example:**
```typescript
const change = detectIntensityChange(
  { category: 'C2', windSpeed: 150, ... },
  { category: 'C3', windSpeed: 180, ... }
);
// Returns: 'intensifying'
```

### `getTransitionColor(fromPoint, toPoint, progress)`

Gets interpolated color between two points.

**Parameters:**
- `fromPoint` (StormPoint): Starting point
- `toPoint` (StormPoint): Ending point
- `progress` (number): Interpolation progress (0-1)

**Returns:** string (hex color)

**Example:**
```typescript
const color = getTransitionColor(
  { category: 'C1', ... },
  { category: 'C2', ... },
  0.5
);
// Returns: Interpolated color between yellow and orange
```

### `analyzeIntensityChange(previousPoint, currentPoint, config?)`

Analyzes intensity change with detailed information.

**Parameters:**
- `previousPoint` (StormPoint): Previous position
- `currentPoint` (StormPoint): Current position
- `config` (IntensityAnimationConfig, optional): Animation configuration

**Returns:** IntensityChangeEvent object

**Example:**
```typescript
const analysis = analyzeIntensityChange(prevPoint, currPoint);
console.log(analysis.changeType); // 'intensifying'
console.log(analysis.windSpeedDelta); // 30
console.log(analysis.shouldShowGlow); // true
```

## Component Integration

### HurricaneMarker Component

Enhanced with intensity change visualization:

```typescript
<HurricaneMarker
  position={currentPoint}
  nextPosition={nextPoint}
  previousPosition={previousPoint}  // For intensity detection
  isPulsing={true}
  useIntensitySize={true}           // Enable intensity-aware sizing
  showIntensityGlow={false}         // Auto-detect or manual control
/>
```

**New Props:**
- `previousPosition`: Previous storm point for intensity change detection
- `useIntensitySize`: Enable intensity-aware size calculation (default: true)
- `showIntensityGlow`: Manually control glow animation (default: auto-detect)

### AnimatedStormPath Component

Automatically passes previous position for intensity detection:

```typescript
<AnimatedStormPath
  stormName="Hurricane Example"
  points={stormPoints}
  isHistorical={true}
  autoPlay={true}
/>
```

Markers within AnimatedStormPath automatically receive:
- Previous position for intensity detection
- Intensity-aware sizing
- Auto-detected glow animations

### GradientStormTrack Component

Already supports smooth color transitions through interpolation:

```typescript
<GradientStormTrack
  points={stormPoints}
  isHistorical={true}
  isAnimating={false}
  animationProgress={1}
/>
```

## Animation Timings

All animations are carefully tuned for smooth, natural-looking transitions:

| Animation | Duration | Easing | Purpose |
|-----------|----------|--------|---------|
| Glow Effect | 1500ms | ease-out | Highlight intensification |
| Color Transition | 800ms | ease-in-out | Smooth category changes |
| Size Transition | 600ms | ease-in-out | Smooth size adjustments |
| Pulse Animation | 2000ms | cubic-bezier | Continuous attention |

## Configuration

Default configuration can be customized:

```typescript
import { DEFAULT_INTENSITY_ANIMATION_CONFIG } from '../../lib/stormIntensityChanges';

const customConfig = {
  ...DEFAULT_INTENSITY_ANIMATION_CONFIG,
  glowDuration: 2000,              // Longer glow
  colorTransitionDuration: 1000,   // Slower color transition
  showGlowOnIntensify: false,      // Disable glow
};
```

## Performance Considerations

1. **CSS Transitions**: All animations use CSS transitions for hardware acceleration
2. **Conditional Rendering**: Glow animations only trigger when needed
3. **Memoization**: Color calculations are cached where possible
4. **Efficient Detection**: Intensity changes detected with minimal computation

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All features use standard CSS3 and SVG, ensuring broad compatibility.

## Testing

Example component available at:
```
src/components/storm/IntensityChangeVisualization.example.tsx
```

The example demonstrates:
- Intensifying storm track (TS → C5)
- Weakening storm track (C4 → TD)
- All color transitions
- Size adjustments
- Glow animations
- Major hurricane enhancements

## Troubleshooting

### Glow animation not showing
- Ensure `showIntensityGlow={true}` or provide `previousPosition` for auto-detection
- Check that storm is actually intensifying (category or wind speed increase)

### Marker size not changing
- Verify `useIntensitySize={true}` is set
- Check wind speed values are in valid range (30-200 km/h)

### Colors not transitioning smoothly
- Ensure category values are valid (TD, TS, C1-C5)
- Check that CSS transitions are not disabled globally

### Major hurricane markers not larger
- Verify category is C3, C4, or C5
- Check that `useIntensitySize={true}` is enabled

## Future Enhancements

Potential improvements for future iterations:

1. **Adaptive Glow Intensity**: Scale glow based on rate of intensification
2. **Sound Effects**: Optional audio cues for major intensification
3. **Historical Intensity Graph**: Show intensity timeline in tooltip
4. **Rapid Intensification Alert**: Special visual for rapid intensification (>30 kt/24h)
5. **Pressure-Based Sizing**: Alternative sizing based on central pressure

## Related Files

- `src/lib/stormIntensityChanges.ts` - Core intensity detection and utilities
- `src/components/storm/HurricaneMarker.tsx` - Enhanced marker component
- `src/components/storm/AnimatedStormPath.tsx` - Animation integration
- `src/components/storm/GradientStormTrack.tsx` - Color gradient rendering
- `src/utils/colorInterpolation.ts` - Color utilities
- `src/lib/stormAnimations.ts` - Animation utilities

## Requirements Mapping

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| 10.1 | `calculateIntensityMarkerSize()` | ✅ Complete |
| 10.2 | CSS color transitions + `getTransitionColor()` | ✅ Complete |
| 10.3 | `generateGlowAnimationCSS()` + auto-detection | ✅ Complete |
| 10.4 | `isMajorHurricane()` + size boost | ✅ Complete |
| 10.5 | Complete Saffir-Simpson color scale | ✅ Complete |
