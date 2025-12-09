# Multi-Storm Rendering Visual Guide

## Overview Diagram

```
                    [Storm Name Label]
                           ↓
                    ┌──────────────┐
                    │  Bão Yagi    │  ← 15km north of current position
                    └──────┬───────┘
                           ▼
                          ●  ← Current Position Marker (pulsing)
                         /|\
                        / | \
                       /  |  \
    Storm 1 Track ────●───●───●──── (offset -10km)
    Storm 2 Track ────●───●───●──── (center, no offset)
    Storm 3 Track ────●───●───●──── (offset +10km)
                       \  |  /
                        \ | /
                         \|/
                    Forecast Cone
```

## Component Architecture

```
WeatherMap
├── storms.map((storm, index) => 
│   └── StormAnimation
│       ├── props.stormIndex = index
│       ├── props.totalStorms = storms.length
│       ├── props.isActive = (isPlayingAll || selected)
│       │
│       └── Renders:
│           ├── Storm Name Label (15km north)
│           ├── Current Position Marker
│           ├── Traveled Path (with offset)
│           ├── Forecast Cone
│           ├── Animated Marker
│           └── Time Labels
```

## Track Offset Calculation

### Formula
```
trackOffset = (stormIndex - (totalStorms - 1) / 2) * 0.02
offsetKm = trackOffset * 5
```

### Examples

#### 2 Storms
```
Storm 0: (0 - 0.5) * 0.02 = -0.01 → -5km (left)
Storm 1: (1 - 0.5) * 0.02 = +0.01 → +5km (right)

Visual:
    ●───●───●  Storm 0 (5km left)
    ●───●───●  Storm 1 (5km right)
```

#### 3 Storms
```
Storm 0: (0 - 1) * 0.02 = -0.02 → -10km (left)
Storm 1: (1 - 1) * 0.02 =  0.00 →   0km (center)
Storm 2: (2 - 1) * 0.02 = +0.02 → +10km (right)

Visual:
    ●───●───●  Storm 0 (10km left)
    ●───●───●  Storm 1 (center)
    ●───●───●  Storm 2 (10km right)
```

#### 5 Storms
```
Storm 0: (0 - 2) * 0.02 = -0.04 → -20km
Storm 1: (1 - 2) * 0.02 = -0.02 → -10km
Storm 2: (2 - 2) * 0.02 =  0.00 →   0km
Storm 3: (3 - 2) * 0.02 = +0.02 → +10km
Storm 4: (4 - 2) * 0.02 = +0.04 → +20km

Visual:
    ●───●───●  Storm 0 (20km left)
    ●───●───●  Storm 1 (10km left)
    ●───●───●  Storm 2 (center)
    ●───●───●  Storm 3 (10km right)
    ●───●───●  Storm 4 (20km right)
```

## Storm Name Label Design

```
┌─────────────────────────────┐
│                             │
│        Bão Yagi             │  ← Bold 14px, centered
│                             │
└──────────────┬──────────────┘
               │
               ▼  ← Triangle pointer
               ●  ← Small dot (visual anchor)
```

### Styling Details
- Background: `rgba(255,255,255,0.98)` (nearly opaque white)
- Border: `3px solid [category-color]`
- Padding: `8px 12px`
- Border radius: `6px`
- Font: `14px bold`
- Shadow: `0 3px 10px rgba(0,0,0,0.25)`
- Min width: `120px`

### Color Borders by Category
```
Tropical Depression → Green border   (#4CAF50)
Tropical Storm     → Blue border    (#2196F3)
Category 1         → Yellow border  (#FFC107)
Category 2         → Orange border  (#FF9800)
Category 3         → Red border     (#F44336)
Category 4         → Dark Red       (#D32F2F)
Category 5         → Purple border  (#9C27B0)
```

## Animation States

### State 1: All Storms Animating
```
isPlayingAll = true
selectedStorm = undefined

Storm 1: isActive = true  → Animating ✓
Storm 2: isActive = true  → Animating ✓
Storm 3: isActive = true  → Animating ✓
```

### State 2: Single Storm Selected
```
isPlayingAll = false
selectedStorm = Storm 2

Storm 1: isActive = false → Static (visible but not animating)
Storm 2: isActive = true  → Animating ✓
Storm 3: isActive = false → Static (visible but not animating)
```

### State 3: No Animation
```
isPlayingAll = false
selectedStorm = undefined

Storm 1: isActive = false → Static
Storm 2: isActive = false → Static
Storm 3: isActive = false → Static
```

## Perpendicular Offset Direction

The offset is applied perpendicular to the track direction:

```
Track Direction: 45° (Northeast)
Perpendicular: 135° (Southeast) and 315° (Northwest)

         ↗ 45° (track direction)
        /
       /
      ●  Current point
     /|\
    / | \
   ↙  |  ↘
  315°|  135°
      |
  Perpendicular directions
```

### Offset Application
```typescript
// For storm at index 1 of 3 storms (center, offset = 0)
applyTrackOffset(lat, lng, 0, nextLat, nextLng)
→ Returns [lat, lng] (no change)

// For storm at index 0 of 3 storms (left, offset = -0.02)
applyTrackOffset(lat, lng, -0.02, nextLat, nextLng)
→ Calculates bearing to next point
→ Adds 90° for perpendicular
→ Offsets -10km in that direction
→ Returns [newLat, newLng]
```

## Z-Index Layering

```
Layer 10000: Storm Name Labels (zIndexOffset={1000})
Layer 999:   Current Position Markers
Layer 500:   Animated Markers
Layer 400:   Traveled Paths
Layer 300:   Forecast Cones
Layer 200:   Time Labels
Layer 100:   Base Map
```

## Interactive Elements

### Storm Name Label
- **Hover**: Shows cursor pointer
- **Click**: Opens popup with storm details
- **Popup Content**:
  - Storm name (bold)
  - "Vị trí hiện tại" (Current Position)
  - Timestamp
  - Coordinates
  - Wind speed
  - Pressure
  - Category

### Current Position Marker
- **Visual**: Pulsing circle with hurricane icon
- **Animation**: 2-second pulse cycle
- **Hover**: Shows tooltip
- **Click**: Opens detailed popup

### Time Labels
- **Click**: Jumps animation to that point
- **Hover**: Shows cursor pointer
- **Popup**: Shows detailed information for that time

## Performance Optimization

### Offset Calculation
- **Complexity**: O(1) per point
- **Operations**: Simple arithmetic (subtraction, multiplication)
- **Memory**: No additional storage required

### Label Rendering
- **Type**: Standard Leaflet DivIcon
- **Rendering**: Browser-native HTML/CSS
- **Updates**: Only when storm data changes

### Track Rendering
- **Method**: Leaflet Polyline with transformed coordinates
- **Optimization**: Coordinates calculated during render
- **Caching**: Leaflet handles internal caching

## Accessibility

### Screen Reader Support
- Storm name labels have semantic HTML
- Markers include ARIA labels
- Popups are keyboard accessible

### Keyboard Navigation
- Tab through interactive elements
- Enter to open popups
- Escape to close popups

### Color Contrast
- White labels on map background: High contrast
- Colored borders: Distinct and visible
- Text: Black on white (WCAG AAA compliant)

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Features used:
- CSS transforms (widely supported)
- SVG rendering (universal support)
- Leaflet DivIcon (standard feature)
- Geodesic calculations (pure JavaScript)

## Troubleshooting

### Labels Overlapping
**Issue**: Storm name labels overlap when storms are very close
**Solution**: Increase offset distance or adjust label positioning

### Tracks Not Separated
**Issue**: Offset not visible
**Solution**: Check `stormIndex` and `totalStorms` props are passed correctly

### Animation Not Working
**Issue**: Storm not animating when expected
**Solution**: Verify `isActive` prop is true for the storm

### Performance Issues
**Issue**: Lag with many storms
**Solution**: Limit simultaneous animations or reduce animation quality

## Future Enhancements

Potential improvements:
1. **Dynamic Offset**: Adjust offset based on zoom level
2. **Label Collision Detection**: Automatically reposition overlapping labels
3. **Clustering**: Group nearby storms at low zoom levels
4. **Custom Offset**: Allow user to adjust separation distance
5. **Smart Positioning**: Position labels based on available space
