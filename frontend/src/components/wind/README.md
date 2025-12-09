# Wind Particle System

A high-performance canvas-based wind particle visualization system for React-Leaflet maps.

## Overview

The wind particle system renders thousands of animated particles that flow according to wind vector data, creating a dynamic visualization of wind patterns. The system includes automatic performance monitoring and adaptive scaling to maintain smooth 60 FPS animation across different devices.

## Components

### WindParticleCanvas

Main component that manages the canvas overlay and coordinates all subsystems.

**Props:**
- `windData?: WindField | null` - Wind field data containing u/v components
- `particleCount?: number` - Target number of particles (default: 3000)
- `isVisible: boolean` - Controls visibility with fade transitions
- `opacity?: number` - Overall opacity (0-1, default: 1.0)
- `colorScheme?: 'default' | 'monochrome'` - Color scheme for particles

**Features:**
- Automatic canvas resizing with debouncing (250ms)
- Smooth fade-in/fade-out transitions (500ms)
- Integration with Leaflet map events
- Compositing mode 'lighter' for glow effects

### ParticleEngine

Core engine that manages particle lifecycle and rendering.

**Features:**
- Particle initialization with random positions
- Wind vector-based movement
- Automatic respawning at viewport edges
- Velocity-based color coding:
  - Red (>100 km/h): Extreme winds
  - White (>50 km/h): High winds
  - Gray (<50 km/h): Moderate winds
- Trail rendering proportional to wind speed (max 8px)
- Spatial grid (50x50) for efficient wind vector lookups

### WindFieldManager

Manages wind data fetching, caching, and transformation.

**Features:**
- Stale-while-revalidate caching pattern
- 10-minute cache duration
- Background data refresh
- Mock wind field generation for testing
- OpenWeatherMap API integration (configurable)

**Environment Variables:**
```
VITE_OPENWEATHER_API_URL=https://api.openweathermap.org/data/2.5
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

### PerformanceMonitor

Tracks FPS and provides adaptive performance scaling.

**Features:**
- Real-time FPS calculation (60-frame rolling average)
- Automatic particle count adjustment:
  - Reduce by 25% when FPS < 30
  - Increase by 10% when FPS > 50 (after 5 seconds)
- 5-second cooldown between adjustments
- Mobile device detection (max 1000 particles)
- Performance status reporting

## Usage

### Basic Integration

```tsx
import { MapContainer, TileLayer } from 'react-leaflet';
import { WindParticleCanvas } from './components/wind';
import type { WindField } from './components/wind';

function MyMap() {
  const [windData, setWindData] = useState<WindField | null>(null);

  return (
    <MapContainer center={[15.75, 106.0]} zoom={6}>
      <TileLayer url="https://..." />
      
      <WindParticleCanvas
        windData={windData}
        particleCount={3000}
        isVisible={true}
        opacity={0.8}
        colorScheme="default"
      />
    </MapContainer>
  );
}
```

### With Wind Data Fetching

```tsx
import { WindFieldManager } from './components/wind';

const windFieldManager = new WindFieldManager();

// Fetch wind data for map bounds
const windData = await windFieldManager.fetchWindData({
  north: 23.5,
  south: 8.0,
  east: 110.0,
  west: 102.0,
});

setWindData(windData);
```

### Performance Monitoring

```tsx
import { PerformanceMonitor } from './components/wind';

const monitor = new PerformanceMonitor();

// In animation loop
monitor.recordFrame(deltaTime);

// Check performance
const fps = monitor.getCurrentFPS();
const status = monitor.getPerformanceStatus(); // 'excellent' | 'good' | 'poor'

// Get adaptive particle count
const adaptiveCount = monitor.getAdaptiveParticleCount(3000);
```

## Data Structures

### WindField

```typescript
interface WindField {
  width: number;              // Grid width
  height: number;             // Grid height
  uComponent: Float32Array;   // East-west wind (m/s)
  vComponent: Float32Array;   // North-south wind (m/s)
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  timestamp: number;
}
```

### Particle

```typescript
interface Particle {
  x: number;        // Screen x coordinate
  y: number;        // Screen y coordinate
  lat: number;      // Geographic latitude
  lng: number;      // Geographic longitude
  age: number;      // Current age in frames
  maxAge: number;   // Maximum age (100 frames)
  speed: number;    // Wind speed (km/h)
  vx: number;       // Velocity x component
  vy: number;       // Velocity y component
}
```

## Performance Characteristics

### Target Metrics
- **FPS**: 60 (reduces to 30 under load)
- **Particle Count**: 2000-5000 (desktop), 500-1000 (mobile)
- **Memory Usage**: ~50-100MB
- **CPU Usage**: ~10-20% (single core)

### Optimization Techniques
1. **Spatial Grid**: 50x50 grid for O(1) wind vector lookups
2. **Pre-allocated Arrays**: Minimize garbage collection
3. **requestAnimationFrame**: Browser-optimized animation loop
4. **Debounced Resize**: 250ms debounce on viewport changes
5. **Adaptive Scaling**: Automatic particle count adjustment
6. **Compositing Mode**: GPU-accelerated 'lighter' blending

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Requirements Mapping

This implementation satisfies the following requirements:

- **1.1**: Renders 2000-5000 particles at 60 FPS
- **1.2**: Updates particles based on wind vectors
- **1.3**: Velocity-based color coding (>50 km/h white, <50 km/h gray)
- **1.4**: Automatic particle respawning at viewport edges
- **1.5**: Viewport recalculation on zoom/pan
- **1.6**: Trail rendering proportional to speed (max 8px)
- **1.7**: 500ms fade-in with ease-out easing
- **1.8**: Canvas compositing mode 'lighter' for glow effects
- **8.1**: FPS tracking and adaptive scaling
- **8.2**: 25% particle reduction when FPS < 30
- **8.3**: 10% particle increase when FPS > 50 (after 5 seconds)
- **8.7**: Spatial grid for efficient lookups

## Future Enhancements

- [ ] WebGL renderer for 10x performance improvement
- [ ] Web Worker for particle calculations
- [ ] Real OpenWeatherMap API integration
- [ ] Historical wind data playback
- [ ] Wind barb visualization option
- [ ] Custom color schemes
- [ ] Particle density controls
- [ ] Export animation as video

## Testing

See `WindParticleCanvas.example.tsx` for a working example with mock data.

To test performance:
```tsx
const monitor = performanceMonitorRef.current;
console.log(monitor?.getMetrics());
```

## License

Part of the Storm Tracker application.
