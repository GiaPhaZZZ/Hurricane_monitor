# Storm Data Error Handling Guide

## Overview

This guide documents the comprehensive error handling system implemented for the storm visualization application. The system validates storm data, handles edge cases, and provides user-friendly error messages.

## Core Validation Module

### Location
`src/lib/stormValidation.ts`

### Key Features

1. **Coordinate Validation**
   - Validates latitude (-90 to 90) and longitude (-180 to 180)
   - Checks for NaN and invalid number types
   - Used before rendering any map elements

2. **Wind Speed Validation**
   - Range: 0 to 400 km/h
   - Detects missing or invalid values
   - Provides warnings for missing data

3. **Pressure Validation**
   - Range: 850 to 1050 hPa
   - Validates atmospheric pressure readings
   - Handles missing pressure data gracefully

4. **Timestamp Validation**
   - Ensures timestamps are positive numbers
   - Validates timestamps are within reasonable range (not more than 1 year in future)
   - Prevents rendering of invalid time data

## Validation Functions

### `isValidCoordinate(lat, lng)`
Validates geographic coordinates.

```typescript
if (!isValidCoordinate(point.lat, point.lng)) {
  console.warn('Invalid coordinates detected');
  return null;
}
```

### `validateStormPoint(point, index)`
Validates a single storm point with detailed error reporting.

Returns:
- `isValid`: boolean indicating if point is valid
- `errors`: array of critical errors
- `warnings`: array of non-critical warnings

### `validateStorm(storm)`
Validates complete storm object including:
- Storm ID and name
- Current position
- Historical points array
- Forecast points array
- Minimum point requirements

### `validateAndSanitizeStorm(storm)`
Validates and sanitizes storm data:
- Fills gaps in point arrays
- Interpolates missing points
- Returns sanitized storm or null if critically invalid

## Data Interpolation

### `interpolateStormPoint(prevPoint, nextPoint, factor)`
Interpolates between two storm points for smooth transitions.

Used for:
- Filling gaps in incomplete data
- Creating smooth animations
- Handling missing data points

### `fillStormPointGaps(points)`
Automatically fills gaps in storm point arrays by interpolating between valid points.

Example:
```typescript
const points = [validPoint1, null, validPoint2];
const filled = fillStormPointGaps(points);
// Result: [validPoint1, interpolatedPoint, validPoint2]
```

## Error Handling in Components

### StormAnimation Component

**Validation Flow:**
1. Validates storm data on render
2. Shows error marker if validation fails
3. Sanitizes data before rendering
4. Displays user-friendly error messages in popups

**Error Display:**
- Red error marker at current position
- Vietnamese error message in popup
- Console logging for debugging

### GradientStormTrack Component

**Validation:**
- Filters out invalid coordinates before rendering
- Logs warnings for invalid points
- Requires minimum 2 valid points

**Console Warnings:**
```
[GradientStormTrack] Invalid coordinates detected: {lat, lng, timestamp}
[GradientStormTrack] Not enough valid points after validation
```

### ForecastCone Component

**Validation:**
- Validates current position coordinates
- Filters forecast points for valid coordinates and timestamps
- Handles missing forecast data gracefully

**Error Messages:**
```
[ForecastCone] No forecast points provided
[ForecastCone] Invalid current position coordinates
[ForecastCone] No valid forecast points after validation
```

### AnimatedStormPath Component

**Validation:**
- Checks for minimum 2 points before animation
- Validates points during interpolation
- Handles interpolation errors with fallbacks

**Error Recovery:**
- Falls back to first point if interpolation fails
- Continues animation with valid points only
- Logs detailed error information

### HurricaneMarker Component

**Validation:**
- Validates position coordinates before rendering
- Checks wind speed validity
- Validates next position before calculating bearing

**Error Handling:**
- Returns null for invalid positions
- Uses default values for invalid wind speed
- Handles bearing calculation errors gracefully

## User-Friendly Error Messages

### Vietnamese Error Messages

The system provides localized error messages for Vietnamese users:

- **Invalid coordinates**: "Dữ liệu vị trí bão không hợp lệ. Không thể hiển thị trên bản đồ."
- **Invalid timestamp**: "Dữ liệu thời gian không hợp lệ. Không thể hiển thị lịch sử bão."
- **Missing current position**: "Không có dữ liệu vị trí hiện tại của bão."
- **Insufficient points**: "Không đủ dữ liệu để hiển thị đường đi của bão."
- **No forecast data**: "Không có dữ liệu dự báo cho cơn bão này."

### Function: `getUserFriendlyErrorMessage(result)`

Converts technical validation errors into user-friendly Vietnamese messages.

## Forecast Data Handling

### `hasForecastData(storm)`
Checks if storm has valid forecast data.

### `getForecastMessage(storm)`
Returns user-friendly message when forecast data is missing.

**Usage in Components:**
```typescript
const hasForecast = hasForecastData(storm);
const forecastMessage = getForecastMessage(storm);

// Conditionally render forecast elements
{hasForecast && <ForecastCone ... />}

// Display message to user
{forecastMessage && <div>{forecastMessage}</div>}
```

## Console Logging Strategy

### Log Levels

**Errors (console.error):**
- Critical validation failures
- Invalid coordinates that prevent rendering
- Failed sanitization attempts

**Warnings (console.warn):**
- Missing optional data (wind speed, pressure)
- Invalid points filtered out
- Interpolation fallbacks

**Info (console.log):**
- Successful validation
- Data sanitization completion

### Log Format

All logs follow consistent format:
```
[ComponentName] Description: {data}
```

Examples:
```
[StormAnimation] Validation failed for storm Test Storm: errors
[GradientStormTrack] Invalid coordinates detected: {lat: 100, lng: 200}
[ForecastCone] No valid forecast points after validation
```

## Testing

### Test File
`src/lib/__tests__/stormValidation.test.ts`

### Test Coverage

1. **Coordinate Validation Tests**
   - Valid coordinates (including edge cases)
   - Invalid coordinates (out of range, NaN)

2. **Wind Speed & Pressure Tests**
   - Valid ranges
   - Invalid values
   - Missing data

3. **Timestamp Validation Tests**
   - Current timestamps
   - Past and future timestamps
   - Invalid timestamps

4. **Storm Point Validation Tests**
   - Complete valid points
   - Points with missing data
   - Points with invalid data

5. **Interpolation Tests**
   - Midpoint interpolation
   - Category selection
   - Gap filling

6. **Complete Storm Validation Tests**
   - Valid storm objects
   - Missing required fields
   - Sanitization process

## Best Practices

### 1. Always Validate Before Rendering

```typescript
// Bad
<Marker position={[point.lat, point.lng]} />

// Good
if (isValidCoordinate(point.lat, point.lng)) {
  <Marker position={[point.lat, point.lng]} />
}
```

### 2. Provide Fallbacks

```typescript
// Use sanitized data with defaults
const sanitized = sanitizeStormPoint(point, {
  lat: 0,
  lng: 0,
  windSpeed: 0,
  pressure: 1013,
});
```

### 3. Log for Debugging

```typescript
if (!isValid) {
  console.error('[Component] Validation failed:', errors);
}
```

### 4. Show User-Friendly Messages

```typescript
// Don't show technical errors to users
const message = getUserFriendlyErrorMessage(result);
<div>{message}</div>
```

### 5. Handle Missing Forecast Data

```typescript
const hasForecast = hasForecastData(storm);
const message = getForecastMessage(storm);

// Conditionally render forecast elements
{hasForecast ? <ForecastCone /> : <div>{message}</div>}
```

## Edge Cases Handled

1. **Missing Forecast Data**
   - Component checks for forecast availability
   - Displays message to user
   - Skips forecast rendering

2. **Incomplete Storm Points**
   - Gaps are filled with interpolated points
   - Invalid points are filtered out
   - Minimum point requirements enforced

3. **Invalid Coordinates**
   - Validated before rendering
   - Logged with details
   - Component returns null or shows error marker

4. **Invalid Data Types**
   - Type checking for all numeric values
   - NaN detection
   - Null/undefined handling

5. **Insufficient Points**
   - Minimum 2 points required for tracks
   - Single point shows marker only
   - Warning message displayed

## Performance Considerations

1. **Validation Caching**
   - Validation results can be memoized
   - Avoid re-validating unchanged data

2. **Lazy Validation**
   - Validate only when rendering
   - Skip validation for hidden elements

3. **Batch Processing**
   - Validate arrays of points together
   - Single pass through data

## Future Enhancements

1. **Validation Schema**
   - Consider using Zod or Yup for schema validation
   - Type-safe validation with TypeScript

2. **Error Recovery**
   - Automatic retry for transient errors
   - Fallback to cached data

3. **User Notifications**
   - Toast notifications for errors
   - Error boundary components

4. **Telemetry**
   - Track validation failures
   - Monitor data quality metrics

## Summary

The error handling system provides:
- ✅ Comprehensive validation for all storm data
- ✅ Graceful handling of missing or invalid data
- ✅ User-friendly error messages in Vietnamese
- ✅ Detailed console logging for debugging
- ✅ Data interpolation for incomplete datasets
- ✅ Component-level error boundaries
- ✅ Forecast data availability checking

All components now validate data before rendering and handle edge cases gracefully, ensuring a robust and reliable storm visualization experience.
