# SimplifiedTooltip Component

## Overview

The `SimplifiedTooltip` component provides a minimal, Windy.com-style tooltip for displaying storm data. It features a clean white background, compact single-line format, automatic edge detection, and smooth fade animations.

## Features

✅ **Minimal Design**: White background with 2px border radius and subtle drop shadow  
✅ **Compact Format**: Single-line display with vertical separators (HH:MM | XXX km/h | YYYY hPa)  
✅ **Smart Positioning**: Automatically positions 10px above cursor with viewport edge detection  
✅ **Smooth Animations**: 200ms fade-in/fade-out transitions with hide delay  
✅ **Closest-Point Detection**: Shows only the nearest point's tooltip when multiple are nearby  
✅ **Lightweight**: No external dependencies, pure React implementation

## Requirements Fulfilled

- **5.1**: White background with 2px border radius, compact single-line format
- **5.3**: 12px font size with 500 font weight
- **5.4**: Position tooltip 10px above cursor with automatic edge detection
- **5.5**: 200ms delay before hiding with fade-in/fade-out transitions
- **5.6**: Show only closest point's tooltip when multiple nearby
- **5.7**: Subtle drop shadow (4px blur, 20% opacity)
- **5.8**: Format as "HH:MM | XXX km/h | YYYY hPa" with vertical separator

## Basic Usage

```tsx
import { SimplifiedTooltip } from './components/storm/SimplifiedTooltip';
import type { StormPoint } from './components/storm/HurricaneMarker';

function MyComponent() {
  const [hoveredPoint, setHoveredPoint] = useState<StormPoint | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  return (
    <>
      {/* Your interactive elements */}
      <div
        onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
        onMouseEnter={() => setHoveredPoint(stormData)}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        Hover me
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <SimplifiedTooltip
          stormData={hoveredPoint}
          position={cursorPos}
          isVisible={true}
        />
      )}
    </>
  );
}
```

## Advanced Usage with Hook

For managing multiple nearby points and automatic closest-point detection:

```tsx
import { useSimplifiedTooltip } from './hooks/useSimplifiedTooltip';
import { SimplifiedTooltip } from './components/storm/SimplifiedTooltip';

function MultiStormMap() {
  const { tooltipState, showTooltip, hideTooltip, updatePosition } = useSimplifiedTooltip();

  return (
    <>
      {stormPoints.map((point, index) => (
        <Marker
          key={index}
          onMouseOver={(e) => {
            showTooltip(point, { x: e.clientX, y: e.clientY }, `point-${index}`);
          }}
          onMouseOut={() => {
            hideTooltip(`point-${index}`);
          }}
          onMouseMove={(e) => {
            updatePosition({ x: e.clientX, y: e.clientY });
          }}
        />
      ))}

      {tooltipState.isVisible && tooltipState.stormData && (
        <SimplifiedTooltip
          stormData={tooltipState.stormData}
          position={tooltipState.position}
          isVisible={tooltipState.isVisible}
        />
      )}
    </>
  );
}
```

## Props

### SimplifiedTooltip

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stormData` | `StormPoint` | Yes | Storm data containing timestamp, windSpeed, and pressure |
| `position` | `{ x: number; y: number }` | Yes | Cursor position for tooltip placement |
| `isVisible` | `boolean` | Yes | Whether tooltip should be visible |
| `onHide` | `() => void` | No | Callback when tooltip finishes hiding |

### StormPoint Interface

```typescript
interface StormPoint {
  timestamp: number;      // Unix timestamp in milliseconds
  lat: number;           // Latitude
  lng: number;           // Longitude
  windSpeed: number;     // Wind speed in km/h
  pressure: number;      // Pressure in hPa
  category: string;      // Storm category
}
```

## Hook API

### useSimplifiedTooltip()

Returns an object with:

- `tooltipState`: Current tooltip state (stormData, position, isVisible)
- `showTooltip(stormData, position, pointId)`: Show tooltip for a point
- `hideTooltip(pointId)`: Hide tooltip for a point
- `updatePosition(position)`: Update cursor position
- `clearTooltips()`: Clear all tooltips

## Styling

The component uses inline styles and scoped CSS for:

- **Background**: Pure white (`#ffffff`)
- **Text Color**: Dark gray (`#1e1e1e`)
- **Font**: 12px, weight 500
- **Border Radius**: 2px
- **Shadow**: `0 2px 4px rgba(0, 0, 0, 0.2)`
- **Padding**: 4px horizontal, 8px vertical
- **Transitions**: 200ms ease-in-out for opacity

## Edge Detection

The tooltip automatically adjusts its position to stay within viewport boundaries:

1. **Default**: 10px above cursor, horizontally centered
2. **Top Edge**: Positions below cursor if insufficient space above
3. **Left/Right Edges**: Shifts horizontally to stay within 10px margin
4. **Bottom Edge**: Moves up to stay within 10px margin

## Animation Behavior

- **Show**: Fades in immediately when `isVisible` becomes `true`
- **Hide**: Waits 200ms after `isVisible` becomes `false`, then fades out over 200ms
- **Rapid Hover**: Cancels pending hide timeout if re-hovered during delay

## Performance Considerations

- Uses `requestAnimationFrame` for smooth opacity transitions
- Minimal re-renders with `useRef` for timeout management
- No external dependencies or heavy computations
- Lightweight DOM footprint (single div with inline styles)

## Examples

Three example files are provided:

1. **SimplifiedTooltip.example.tsx**: Basic usage with single storm track
2. **SimplifiedTooltip.advanced.example.tsx**: Multiple storms with closest-point detection
3. See examples in action by importing and rendering them in your app

## Comparison with StormTooltip

| Feature | SimplifiedTooltip | StormTooltip |
|---------|------------------|--------------|
| Style | White, minimal | Dark, detailed |
| Format | Single line | Multi-line |
| Size | Compact (12px) | Larger (13px) |
| Content | Time, wind, pressure | Name, category, wind, pressure, time |
| Use Case | Windy mode | Standard mode |
| Animation | 200ms fade | 200ms fade |

## Integration with Windy Mode

The SimplifiedTooltip is designed for use in Windy mode alongside:

- White-dashed storm tracks
- Simplified storm markers
- Wind particle animations
- Timeline slider

Use the standard `StormTooltip` for gradient mode and `SimplifiedTooltip` for Windy mode.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Accessibility

- Tooltip uses `pointer-events: none` to avoid interfering with interactions
- High contrast text (dark on white)
- Readable font size (12px)
- Consider adding ARIA labels when integrating with interactive elements

## Future Enhancements

Potential improvements for future iterations:

- [ ] Add arrow pointer to indicate hovered element
- [ ] Support for custom formatting functions
- [ ] Configurable hide delay
- [ ] Touch device support with tap-to-show
- [ ] Keyboard navigation support
- [ ] Theme customization options
