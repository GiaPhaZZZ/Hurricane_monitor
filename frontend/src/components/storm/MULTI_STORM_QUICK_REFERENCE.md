# Multi-Storm Rendering - Quick Reference

## Usage

```tsx
import StormAnimation from './StormAnimation';

// Render multiple storms
{storms.map((storm, index) => (
  <StormAnimation
    key={storm.id}
    storm={storm}
    isActive={shouldAnimate}
    stormIndex={index}              // Required for multi-storm
    totalStorms={storms.length}     // Required for multi-storm
  />
))}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `storm` | `Storm` | ✅ Yes | - | Storm data object |
| `isActive` | `boolean` | ✅ Yes | - | Whether storm should animate |
| `stormIndex` | `number` | ⚠️ Optional | `0` | Index in storm array (for offset) |
| `totalStorms` | `number` | ⚠️ Optional | `1` | Total storms being rendered |

> **Note**: `stormIndex` and `totalStorms` are optional but recommended for multi-storm scenarios

## Features

### ✅ Storm Name Labels
- Displayed 15km north of current position
- Colored border matching storm category
- Clickable with detailed popup

### ✅ Track Separation
- Automatic perpendicular offset
- Formula: `(index - (total-1)/2) * 0.02 * 5km`
- Centered distribution

### ✅ Independent Animation
- Each storm has own animation state
- Controlled via `isActive` prop
- Supports "play all" and "single storm" modes

### ✅ Category Colors
- Maintained across all elements
- Automatic color selection
- Consistent visual identity

## Offset Examples

| Storms | Index 0 | Index 1 | Index 2 | Index 3 | Index 4 |
|--------|---------|---------|---------|---------|---------|
| 1      | 0km     | -       | -       | -       | -       |
| 2      | -5km    | +5km    | -       | -       | -       |
| 3      | -10km   | 0km     | +10km   | -       | -       |
| 5      | -20km   | -10km   | 0km     | +10km   | +20km   |

## Animation Control

```tsx
// Play all storms
<StormAnimation isActive={true} ... />

// Play only selected storm
<StormAnimation isActive={storm.id === selectedId} ... />

// No animation (static display)
<StormAnimation isActive={false} ... />
```

## Common Patterns

### Pattern 1: Display All Storms
```tsx
const allStorms = storms.map((storm, index) => (
  <StormAnimation
    key={storm.id}
    storm={storm}
    isActive={false}
    stormIndex={index}
    totalStorms={storms.length}
  />
));
```

### Pattern 2: Animate All Storms
```tsx
const animatingStorms = storms.map((storm, index) => (
  <StormAnimation
    key={storm.id}
    storm={storm}
    isActive={true}
    stormIndex={index}
    totalStorms={storms.length}
  />
));
```

### Pattern 3: Single Storm Focus
```tsx
const focusedStorms = storms.map((storm, index) => (
  <StormAnimation
    key={storm.id}
    storm={storm}
    isActive={storm.id === selectedStormId}
    stormIndex={index}
    totalStorms={storms.length}
  />
));
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Labels overlap | Storms too close; offset working as designed |
| No separation | Check `stormIndex` and `totalStorms` props |
| Wrong colors | Verify storm category data |
| No animation | Check `isActive` prop value |
| Performance lag | Limit active animations to 3-5 storms |

## Key Functions

### `applyTrackOffset(lat, lng, offset, nextLat?, nextLng?)`
Applies perpendicular offset to coordinates
- **Returns**: `[number, number]` (new lat/lng)
- **Offset**: In units (multiply by 5 for km)

### `StormNameLabelIcon(stormName, category)`
Creates storm name label icon
- **Returns**: Leaflet `DivIcon`
- **Style**: White background, colored border

## Requirements Mapping

| Requirement | Implementation |
|-------------|----------------|
| 9.1 - Render all storms | ✅ WeatherMap renders all in array |
| 9.2 - Distinct colors | ✅ getCategoryColor() per storm |
| 9.3 - Offset overlapping | ✅ applyTrackOffset() function |
| 9.4 - Storm name labels | ✅ StormNameLabelIcon() at current pos |
| 9.5 - Independent control | ✅ isActive prop per storm |

## Performance Tips

1. **Limit Active Animations**: Max 3-5 simultaneous
2. **Use Keys**: Always provide unique `key` prop
3. **Memoization**: Consider `React.memo()` for static storms
4. **Zoom-Based**: Simplify at low zoom levels
5. **Cleanup**: Ensure proper unmounting

## Related Files

- `src/components/StormAnimation.tsx` - Main component
- `src/components/WeatherMap.tsx` - Integration
- `src/lib/stormData.ts` - Data types
- `MULTI_STORM_IMPLEMENTATION.md` - Full documentation
- `MULTI_STORM_VISUAL_GUIDE.md` - Visual reference

## Version

- **Implemented**: Task 9
- **Date**: 2025
- **Status**: ✅ Complete
