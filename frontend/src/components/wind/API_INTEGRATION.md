# Wind Data API Integration

This document describes the OpenWeatherMap API integration for the wind particle system.

## Overview

The wind particle system fetches real-time wind data from the OpenWeatherMap API to visualize wind patterns across the map. The system includes robust error handling, caching, and fallback mechanisms to ensure a smooth user experience.

## Architecture

```
WindLayerController (UI Layer)
    ↓
WindFieldManager (Data Layer)
    ↓
openWeatherMapClient (API Layer)
    ↓
OpenWeatherMap API
```

## Components

### 1. openWeatherMapClient (`src/lib/openWeatherMapClient.ts`)

Low-level API client that handles HTTP requests to OpenWeatherMap.

**Key Functions:**
- `fetchWindDataForLocation(lat, lon)` - Fetch wind data for a single point
- `fetchWindDataGrid(bounds, gridSize)` - Fetch wind data for a grid of points
- `windToComponents(speed, degrees)` - Convert wind speed/direction to u/v components
- `isApiKeyConfigured()` - Check if API key is set
- `testApiConnection()` - Test API connectivity

**Error Handling:**
- Throws descriptive errors for API failures
- Validates API key configuration
- Handles network errors gracefully

### 2. WindFieldManager (`src/components/wind/WindFieldManager.ts`)

Manages wind data lifecycle including fetching, caching, and transformation.

**Key Features:**
- **Caching**: In-memory cache with 10-minute TTL
- **Stale-While-Revalidate**: Returns cached data while fetching fresh data in background
- **Offline Support**: Detects offline state and uses cached/mock data
- **Error Recovery**: Falls back to cached or mock data on API failures
- **Rate Limiting**: Batches API requests to respect rate limits

**Methods:**
- `fetchWindData(bounds)` - Fetch wind data for map bounds
- `transformToWindField(apiData, bounds)` - Transform API response to WindField format
- `getLastError()` - Get last error that occurred
- `isUsingRealData()` - Check if using real API data vs fallback

### 3. WindLayerController (`src/components/wind/WindLayerController.tsx`)

React component that manages UI states and integrates with WindParticleCanvas.

**Features:**
- Loading indicators during initial fetch
- Error notifications (non-blocking)
- Automatic refresh every 10 minutes
- Refetch on map movement
- Error callback for custom handling

## API Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_OPENWEATHER_API_KEY=your_api_key_here
VITE_OPENWEATHER_API_URL=https://api.openweathermap.org/data/2.5
```

### Getting an API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Navigate to API Keys section
3. Generate a new API key (free tier available)
4. Add the key to your `.env` file

**Free Tier Limits:**
- 60 calls/minute
- 1,000,000 calls/month
- Current weather data included

## Data Flow

### 1. Initial Load

```
User opens map
    ↓
WindLayerController mounts
    ↓
Fetch wind data for current bounds
    ↓
Show loading indicator
    ↓
Transform API response to WindField
    ↓
Cache result
    ↓
Render particles
```

### 2. Background Refresh

```
10 minutes elapsed
    ↓
Mark cached data as stale
    ↓
Return stale data immediately
    ↓
Fetch fresh data in background
    ↓
Update cache
    ↓
Update particles with new data
```

### 3. Error Handling

```
API request fails
    ↓
Check for cached data
    ↓
If cached: Use cached data
    ↓
If no cache: Use mock data
    ↓
Show error notification
    ↓
Log error for debugging
```

## Error Types

### 1. API Key Missing (`api_key_missing`)

**Cause:** `VITE_OPENWEATHER_API_KEY` not set or invalid

**Behavior:**
- Shows info notification: "Using demo wind data"
- Falls back to mock wind data
- Particles still animate normally

**Resolution:** Add valid API key to `.env` file

### 2. Offline (`offline`)

**Cause:** Device has no internet connection

**Behavior:**
- Shows offline notification
- Uses cached data if available
- Falls back to mock data if no cache
- Automatically retries when connection restored

**Resolution:** Restore internet connection

### 3. Fetch Failed (`fetch_failed`)

**Cause:** API request failed (rate limit, server error, etc.)

**Behavior:**
- Shows error notification with message
- Uses cached data if available
- Falls back to mock data if no cache
- Logs error details to console

**Resolution:** Check API key, rate limits, and server status

## Caching Strategy

### Cache Structure

```typescript
interface CachedWindData {
  data: WindField;
  timestamp: number;
  isStale: boolean;
}
```

### Cache Key

Generated from map bounds: `"north,south,east,west"`

Example: `"30.00,25.00,-75.00,-80.00"`

### Cache Lifecycle

1. **Fresh** (0-10 minutes): Return cached data immediately
2. **Stale** (10+ minutes): Return cached data, fetch fresh data in background
3. **Expired**: Remove from cache after 1 hour of inactivity

### Cache Benefits

- Reduces API calls (saves quota)
- Improves performance (instant response)
- Enables offline functionality
- Reduces bandwidth usage

## API Request Optimization

### Grid Sampling

Instead of fetching wind data for every pixel, we sample a 50x50 grid:

```typescript
const GRID_SIZE = { width: 50, height: 50 }; // 2,500 points
```

### Batch Processing

API requests are batched to respect rate limits:

```typescript
const batchSize = 10; // 10 requests at a time
// Wait 1 second between batches
```

### Debouncing

Map movement triggers are debounced to avoid excessive API calls:

```typescript
// Only refetch on 'moveend' event (after user stops panning)
map.on('moveend', handleMoveEnd);
```

## Data Transformation

### API Response Format

```json
{
  "coord": { "lon": -80.0, "lat": 25.0 },
  "wind": {
    "speed": 5.5,  // m/s
    "deg": 180,    // degrees (meteorological)
    "gust": 8.2    // m/s (optional)
  }
}
```

### WindField Format

```typescript
interface WindField {
  width: number;           // Grid width (50)
  height: number;          // Grid height (50)
  uComponent: Float32Array; // East-west wind (m/s)
  vComponent: Float32Array; // North-south wind (m/s)
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  timestamp: number;       // Unix timestamp
}
```

### Conversion Process

1. **Extract wind data** from API response
2. **Convert degrees to radians**: `(degrees + 180) % 360 * π/180`
3. **Calculate u component**: `speed * sin(radians)`
4. **Calculate v component**: `speed * cos(radians)`
5. **Store in Float32Array** for performance

## Testing

### Test API Connection

```typescript
import { testApiConnection } from './lib/openWeatherMapClient';

const isConnected = await testApiConnection();
console.log('API connected:', isConnected);
```

### Mock Data

When API is unavailable, the system generates realistic mock wind data:

- Circular wind pattern (simulates cyclone)
- Random variations for realism
- Same data structure as real API

### Debug Mode

Enable debug logging:

```typescript
// In WindFieldManager
console.log('Using real API data:', windFieldManager.isUsingRealData());
console.log('Last error:', windFieldManager.getLastError());
console.log('Cache size:', windFieldManager.getCacheSize());
```

## Performance Considerations

### API Quota Management

**Free Tier:** 60 calls/minute, 1M calls/month

**Our Usage:**
- Initial load: 2,500 calls (50x50 grid)
- Refresh: 2,500 calls every 10 minutes
- Map movement: 2,500 calls per significant move

**Optimization:**
- Cache reduces redundant calls
- Batch processing respects rate limits
- Debouncing prevents excessive calls

### Memory Usage

- Each WindField: ~400 KB (2,500 points × 2 components × 4 bytes)
- Cache limit: 10 entries = ~4 MB
- Automatic cleanup of old entries

### Network Usage

- Initial load: ~250 KB (2,500 API responses)
- Refresh: ~250 KB every 10 minutes
- Compressed responses reduce bandwidth

## Troubleshooting

### Issue: "API key not configured" error

**Solution:** Add `VITE_OPENWEATHER_API_KEY` to `.env` file

### Issue: Particles not moving

**Possible causes:**
1. Wind data not loaded (check console for errors)
2. API key invalid (verify on OpenWeatherMap dashboard)
3. Rate limit exceeded (wait 1 minute and retry)

**Debug:**
```typescript
console.log('Wind field:', windFieldManager.getCurrentWindField());
console.log('Last error:', windFieldManager.getLastError());
```

### Issue: High API usage

**Solutions:**
1. Increase cache duration (default: 10 minutes)
2. Reduce grid resolution (default: 50x50)
3. Disable auto-refresh on map movement

### Issue: Slow loading

**Possible causes:**
1. Large grid size (2,500 API calls)
2. Slow network connection
3. API server latency

**Solutions:**
1. Reduce grid size to 25x25 (625 calls)
2. Show loading indicator (already implemented)
3. Use cached data while fetching (already implemented)

## Future Enhancements

### Potential Improvements

1. **WebSocket Support**: Real-time wind data updates
2. **Multiple Altitudes**: Fetch wind data at different altitudes
3. **Forecast Data**: Show predicted wind patterns
4. **Historical Data**: Replay past wind patterns
5. **Custom Grid Resolution**: User-configurable grid size
6. **Alternative APIs**: Support for NOAA, Weather.gov, etc.

### API Alternatives

- **NOAA GFS**: Free, high-resolution, requires GRIB2 parsing
- **Weather.gov**: Free, US-only, JSON format
- **Windy API**: Commercial, high-quality, expensive
- **Visual Crossing**: Freemium, good documentation

## References

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Wind Data Visualization Best Practices](https://earth.nullschool.net/)
- [Particle System Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
