# CurrentPositionMarker Component

## Overview

The `CurrentPositionMarker` component displays a distinct visual marker at the transition point where historical storm data ends and forecast data begins. This marker helps users clearly identify the current position of the storm on the map.

## Features

### Visual Design
- **Larger Size**: 32px diameter (compared to regular markers at 20-40px)
- **Distinctive Icon**: Concentric circles with crosshair design
- **Enhanced Styling**: Multiple layers with white borders and shadows
- **Color Coding**: Uses storm category colors from the Saffir-Simpson scale

### Animations
- **Pulsing Effect**: 2-second cycle animation that scales from 1.0 to 1.3
- **Ring Pulse**: Outer ring expands and fades for additional visual emphasis
- **Smooth Transitions**: CSS-based animations with cubic-bezier easing

### Label Display
- **"Current Position" Title**: Clearly labeled in uppercase
- **Timestamp**: Shows the exact time of the current position
- **Storm Name**: Optional display of the storm name
- **Styled Tooltip**: Dark background with arrow pointer
- **Auto-positioning**: Label appears 8px below the marker

## Usage

### Basic Usage

```tsx
import { CurrentPositionMarker } from './storm/CurrentPositionMarker';

<CurrentPositionMarker
  position={storm.currentPosition}
  stormName="Typhoon Yagi"
  showLabel={true}
/>
```

### With Popup

```tsx
<CurrentPositionMarker
  position={storm.currentPosition}
  stormName="Typhoon Yagi"
  showLabel={true}
>
  <Popup>
    <div>
      <h3>{storm.nameVi}</h3>
      <p>Current Position Details</p>
    </div>
  </Popup>
</CurrentPositionMarker>
```

### Without Label

```tsx
<CurrentPositionMarker
  position={storm.currentPosition}
  showLabel={false}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `position` | `StormPoint` | Yes | - | Current position of the storm (transition point) |
| `stormName` | `string` | No | - | Storm name to display in the label |
| `showLabel` | `boolean` | No | `true` | Whether to show the "Current Position" label |
| `className` | `string` | No | `''` | Additional CSS class name |
| `onClick` | `() => void` | No | - | Click handler for the marker |
| `children` | `React.ReactNode` | No | - | Children elements (e.g., Popup, Tooltip) |

## StormPoint Interface

```typescript
interface StormPoint {
  timestamp: number;    // Unix timestamp in milliseconds
  lat: number;          // Latitude
  lng: number;          // Longitude
  windSpeed: number;    // Wind speed in km/h
  pressure: number;     // Atmospheric pressure in hPa
  category: string;     // Storm category (e.g., "Bão cấp 3")
}
```

## Integration with StormAnimation

The `CurrentPositionMarker` is integrated into the `StormAnimation` component to mark the transition between historical and forecast data:

```tsx
<CurrentPositionMarker
  position={storm.currentPosition}
  stormName={storm.nameVi}
  showLabel={true}
>
  <Popup>
    <div style={{ minWidth: 160 }}>
      <div style={{ fontWeight: 700 }}>{storm.nameVi}</div>
      <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>Vị trí hiện tại</div>
      <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
        {new Date(storm.currentPosition.timestamp).toLocaleString("vi-VN")}
      </div>
      <div><strong>Vị trí:</strong> {storm.currentPosition.lat.toFixed(2)}°N, {storm.currentPosition.lng.toFixed(2)}°E</div>
      <div><strong>Tốc độ gió:</strong> {storm.currentPosition.windSpeed ?? "—"} km/h</div>
      <div><strong>Áp suất:</strong> {storm.currentPosition.pressure ?? "—"} hPa</div>
      <div><strong>Phân loại:</strong> {storm.currentPosition.category}</div>
    </div>
  </Popup>
</CurrentPositionMarker>
```

## Visual Hierarchy

The marker is designed to stand out from other storm markers:

1. **Z-Index**: Set to 1000 to appear above other markers
2. **Size**: 32px (larger than regular markers)
3. **Animation**: Continuous pulsing effect
4. **Crosshair**: Distinctive crosshair design for precision
5. **Multiple Rings**: Concentric circles create depth

## Styling Details

### Marker Icon
- Outer pulsing ring: 20px radius, animated
- Middle ring: 16px radius, 30% opacity
- Inner circle: 12px radius with 3px white border
- Center dot: 6px radius, white fill
- Crosshair lines: 2px width, white color

### Label
- Background: `rgba(30, 30, 30, 0.95)`
- Text color: White
- Padding: `8px 12px`
- Border radius: `6px`
- Box shadow: `0 3px 10px rgba(0, 0, 0, 0.4)`
- Min width: `140px`
- Text alignment: Center

### Animations
- **Marker Pulse**: 2s cubic-bezier(0.4, 0, 0.6, 1) infinite
- **Ring Pulse**: 2s cubic-bezier(0.4, 0, 0.6, 1) infinite
- **Label Fade-in**: 0.4s ease-out

## Requirements Fulfilled

- **Requirement 8.3**: Display visual transition marker at point where historical data ends and forecast begins
- **Requirement 8.4**: Label transition point with "Current Position" text

## Browser Compatibility

The component uses standard CSS animations and SVG, which are supported in all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

- Uses CSS animations (GPU-accelerated) for smooth performance
- SVG icon is lightweight and scales well
- Minimal DOM elements for efficient rendering
- Z-index optimization to avoid unnecessary repaints

## Accessibility

- Marker is keyboard accessible through Leaflet's default behavior
- Color contrast meets WCAG AA standards
- Label provides clear textual information
- Popup can be triggered via keyboard navigation
