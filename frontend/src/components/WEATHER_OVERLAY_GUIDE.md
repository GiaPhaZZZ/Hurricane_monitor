# Weather Overlay System - Implementation Guide

## Overview

The Weather Overlay system provides interactive, timeline-synchronized weather data visualization with temperature and wind speed layers.

## Components

### 1. WeatherOverlay Component
**File:** `src/components/WeatherOverlay.tsx`

Main component that renders weather data on the map using canvas-based heat maps.

**Props:**
```typescript
interface WeatherOverlayProps {
  type: WeatherOverlayType;           // 'temperature' | 'wind' | 'none'
  opacity: number;                     // 0-1 range
  currentTime?: number;                // Timeline timestamp
  onHoverValue?: (value | null) => void; // Hover callback
}
```

**Features:**
- Canvas-based rendering for performance
- Automatic data refresh every 10 minutes
- Timeline integration for temporal data
- Real-time opacity control
- Mouse hover value detection

### 2. WeatherValueTooltip Component
**File:** `src/components/WeatherValueTooltip.tsx`

Displays weather values when hovering over the overlay.

**Props:**
```typescript
interface WeatherValueTooltipProps {
  value: {
    type: string;      // 'temperature' | 'wind'
    value: number;     // Numeric value
    unit: string;      // '°C' | 'km/h'
    position: { x: number; y: number };
  } | null;
}
```

## Usage Example

```tsx
import WeatherOverlay from './WeatherOverlay';
import WeatherValueTooltip from './WeatherValueTooltip';

function MyMap() {
  const [hoverValue, setHoverValue] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  return (
    <MapContainer>
      {/* Temperature overlay */}
      <WeatherOverlay
        type="temperature"
        opacity={0.6}
        currentTime={currentTime}
        onHoverValue={setHoverValue}
      />
      
      {/* Hover tooltip */}
      <WeatherValueTooltip value={hoverValue} />
    </MapContainer>
  );
}
```

## Color Scales

### Temperature Scale
Blue (cold) → Green → Yellow → Red (hot)

| Range | Color | Hex |
|-------|-------|-----|
| < 0°C | Dark Blue | #1e3a8a |
| 0-5°C | Blue | #3b82f6 |
| 5-10°C | Light Blue | #60a5fa |
| 10-15°C | Cyan | #06b6d4 |
| 15-20°C | Green | #22c55e |
| 20-25°C | Light Green | #84cc16 |
| 25-30°C | Yellow | #facc15 |
| 30-35°C | Orange | #f97316 |
| 35-40°C | Red | #ef4444 |
| > 40°C | Dark Red | #dc2626 |

### Wind Speed Scale
Light Blue (calm) → Green → Yellow → Magenta (extreme)

| Range | Color | Hex |
|-------|-------|-----|
| < 10 km/h | Light Blue | #bae6fd |
| 10-20 km/h | Sky Blue | #7dd3fc |
| 20-30 km/h | Blue | #38bdf8 |
| 30-40 km/h | Green | #22c55e |
| 40-50 km/h | Light Green | #84cc16 |
| 50-60 km/h | Yellow | #facc15 |
| 60-80 km/h | Orange | #f97316 |
| 80-100 km/h | Red | #ef4444 |
| 100-120 km/h | Purple | #c026d3 |
| > 120 km/h | Magenta | #d946ef |

## Timeline Integration

The overlay automatically updates when the timeline changes:

```tsx
// Timeline component passes currentTime
<TimelineSlider
  currentTime={currentTime}
  onTimeChange={setCurrentTime}
/>

// WeatherOverlay receives and uses currentTime
<WeatherOverlay
  type="temperature"
  currentTime={currentTime}
/>
```

**Data Refresh Logic:**
1. Initial fetch when component mounts
2. Fetch when `currentTime` changes
3. Automatic refresh every 10 minutes
4. Debounced to prevent excessive fetching (1 minute minimum)

## Opacity Control

Real-time opacity adjustment without re-rendering:

```tsx
// Opacity slider in controls
<input
  type="range"
  min="0"
  max="1"
  step="0.1"
  value={opacity}
  onChange={(e) => setOpacity(parseFloat(e.target.value))}
/>

// WeatherOverlay updates opacity dynamically
<WeatherOverlay
  type="temperature"
  opacity={opacity}
/>
```

## Hover Value Display

Interactive value display on mouse hover:

**How it works:**
1. Mouse moves over canvas overlay
2. Canvas calculates pixel position
3. Converts to lat/lng coordinates
4. Finds nearest data point (within 0.5 degrees)
5. Triggers `onHoverValue` callback with value
6. Tooltip displays at cursor position

**Tooltip Features:**
- 10px offset from cursor
- Smooth show/hide transitions
- 100ms delay to avoid flicker
- Edge detection for viewport boundaries
- High z-index (1100) for visibility

## Performance Optimization

### Canvas Rendering
- Hardware-accelerated canvas
- Radial gradients for smooth color transitions
- Efficient viewport clipping
- Only renders visible data points

### Data Management
- Debounced fetching (1 minute minimum)
- Cached data with timestamps
- Efficient nearest-point algorithm
- Grid-based data structure (30x40 points)

### Event Handling
- Throttled mouse move events
- Proper cleanup on unmount
- Minimal re-renders

## API Integration (Future)

Currently uses mock data. To integrate with real API:

```typescript
async function fetchWeatherData(type: WeatherOverlayType, timestamp: number) {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?...`
  );
  const data = await response.json();
  
  // Transform API data to WeatherData format
  return transformApiData(data);
}
```

## Troubleshooting

### Overlay not showing
- Check that `type` is not 'none'
- Verify `weatherData` is loaded
- Check canvas z-index (should be 10)

### Hover values not working
- Ensure `onHoverValue` callback is provided
- Check canvas `pointerEvents` is 'auto'
- Verify data points are within 0.5 degrees

### Performance issues
- Reduce data point density
- Increase debounce interval
- Check for memory leaks in intervals

### Timeline not updating overlay
- Verify `currentTime` prop is passed
- Check `fetchWeatherData` is called on time change
- Ensure data refresh logic is working

## Best Practices

1. **Always provide cleanup:** Clear intervals and event listeners
2. **Debounce fetching:** Avoid excessive API calls
3. **Use canvas for performance:** Better than SVG for large datasets
4. **Proper z-index layering:** Ensure overlay doesn't block interactions
5. **Edge detection:** Handle tooltip positioning at viewport edges
6. **Error handling:** Gracefully handle API failures
7. **Loading states:** Show feedback during data fetches

## Related Components

- `TimelineSlider.tsx` - Timeline control
- `RightSidebar.tsx` - Layer controls
- `WeatherMap.tsx` - Main map component
- `WindParticleCanvas.tsx` - Wind particle visualization

## Requirements Mapping

| Requirement | Implementation |
|-------------|----------------|
| 4.2 | Temperature color scale |
| 4.3 | Wind speed color scale |
| 4.4 | Opacity controls |
| 4.5 | 10-minute data refresh |
| 4.6 | Hover value display |
| 4.7 | Timeline integration |

## Future Enhancements

1. **WebGL Rendering:** For better performance with large datasets
2. **Bilinear Interpolation:** Smoother gradients between points
3. **Animation:** Smooth transitions when data updates
4. **Caching Strategy:** More sophisticated caching with stale-while-revalidate
5. **Multiple Layers:** Support for pressure, humidity, etc.
6. **Custom Color Scales:** User-configurable color schemes
7. **Data Export:** Export overlay data as image or GeoJSON
