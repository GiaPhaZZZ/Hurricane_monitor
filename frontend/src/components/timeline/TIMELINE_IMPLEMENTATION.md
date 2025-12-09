# Timeline Slider Implementation

## Overview

The Timeline Slider component provides temporal navigation for storm data visualization, allowing users to scrub through time and view storm positions at any point in the historical or forecast period.

## Components

### TimelineSlider.tsx

Main timeline component that renders:
- **Horizontal slider bar** spanning 90% viewport width at bottom of map
- **Time markers** at 3-hour intervals
- **Draggable time handle** for position tracking
- **Playback controls** (play/pause button and speed selector)
- **Hover tooltip** showing date/time at cursor position
- **Vertical indicator line** for current time position

#### Props

```typescript
interface TimelineSliderProps {
  storms: Storm[];              // All storm data
  currentTime: number;          // Current timeline position (timestamp)
  onTimeChange: (time: number) => void;  // Callback when time changes
  isPlaying?: boolean;          // Playback state
  onPlayingChange?: (playing: boolean) => void;  // Callback for play/pause
  playbackSpeed?: number;       // Playback speed (0.5x, 1x, 2x, 4x)
  onSpeedChange?: (speed: number) => void;  // Callback for speed change
}
```

#### Features

1. **Time Range Calculation**: Automatically calculates start/end times from storm data
2. **3-Hour Markers**: Generates time markers at 3-hour intervals
3. **Click-to-Jump**: Click anywhere on timeline to jump to that time
4. **Drag Interaction**: Smooth dragging with position updates
5. **Hover Tooltip**: Shows exact date/time at cursor position
6. **Playback Animation**: Uses requestAnimationFrame for smooth 60 FPS animation
7. **Auto-Stop**: Automatically stops playback at timeline end
8. **Speed Control**: Cycle through 0.5x, 1x, 2x, 4x speeds

### useTimelineState.ts

Custom hook for managing timeline state and filtering storm data:

```typescript
const {
  currentTime,        // Current timeline position
  setCurrentTime,     // Update timeline position
  isPlaying,          // Playback state
  setIsPlaying,       // Toggle playback
  playbackSpeed,      // Current speed
  setPlaybackSpeed,   // Change speed
  filteredStorms,     // Storms filtered to current time
} = useTimelineState(storms);
```

#### Storm Filtering Logic

1. **Position Interpolation**: Interpolates storm positions between data points
2. **Historical/Forecast Split**: Splits points into historical (before current time) and forecast (after)
3. **Current Position**: Calculates interpolated current position based on timeline
4. **Edge Cases**: Handles missing data and gaps in timeline gracefully

## Integration

### In Index.tsx

```typescript
// 1. Import components
import TimelineSlider from '../components/timeline/TimelineSlider';
import { useTimelineState } from '../hooks/useTimelineState';

// 2. Initialize timeline state
const {
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed,
  filteredStorms,
} = useTimelineState(storms);

// 3. Pass filtered storms to WeatherMap
<WeatherMap storms={filteredStorms} ... />

// 4. Render timeline slider
<TimelineSlider
  storms={storms}
  currentTime={currentTime}
  onTimeChange={setCurrentTime}
  isPlaying={isPlaying}
  onPlayingChange={setIsPlaying}
  playbackSpeed={playbackSpeed}
  onSpeedChange={setPlaybackSpeed}
/>
```

## Performance Considerations

1. **requestAnimationFrame**: Used for smooth 60 FPS playback animation
2. **Memoization**: Storm filtering is memoized to avoid unnecessary recalculations
3. **Debouncing**: Viewport resize operations are debounced (handled by parent)
4. **Efficient Updates**: Only updates when necessary (< 100ms as per requirements)

## User Interactions

### Mouse Interactions
- **Click on timeline bar**: Jump to that time position
- **Drag handle**: Scrub through time smoothly
- **Hover over timeline**: Show tooltip with date/time
- **Click play/pause button**: Toggle playback
- **Click speed button**: Cycle through speeds

### Automatic Behaviors
- **Auto-pause on interaction**: Pauses playback when user drags timeline
- **Auto-stop at end**: Stops playback when reaching timeline end
- **Auto-restart**: Restarts from beginning if play clicked at end

## Styling

- **Position**: Absolute bottom, full width, z-index 1000
- **Background**: Black with 80% opacity and backdrop blur
- **Colors**: White text/controls on dark background
- **Animations**: Smooth transitions for all state changes
- **Responsive**: Adapts to viewport width (90% max-width)

## Requirements Met

✅ **2.1**: Horizontal bar spanning 90% viewport width at bottom  
✅ **2.2**: Time markers at 3-hour intervals  
✅ **2.3**: Updates storm positions at selected timestamp within 100ms  
✅ **2.4**: Click-to-jump functionality  
✅ **2.5**: Handles edge cases (missing data, gaps)  
✅ **2.6**: Hover tooltip showing date/time  
✅ **2.7**: Vertical indicator line for current time  
✅ **2.8**: Click on timeline bar jumps to time  
✅ **7.1**: Play/pause button on left side  
✅ **7.2**: Play button changes to pause icon  
✅ **7.3**: Pause button changes to play icon  
✅ **7.4**: Speed options (0.5x, 1x, 2x, 4x)  
✅ **7.5**: Adjusts animation rate proportionally  

## Future Enhancements

- Keyboard navigation (Space, Arrow keys, Home/End)
- Loop mode toggle
- URL query param support for sharing timeline position
- Mobile-responsive drawer mode
- Timeline zoom for detailed time ranges
