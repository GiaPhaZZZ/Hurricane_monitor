# Storm Tracker Frontend - Project Overview

## 📋 Table of Contents

1. [Project Introduction](#project-introduction)
2. [System Architecture](#system-architecture)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Data Flow](#data-flow)
7. [Component Breakdown](#component-breakdown)
8. [API Integration](#api-integration)
9. [Visualization Features](#visualization-features)
10. [Performance Optimizations](#performance-optimizations)

---

## 1. Project Introduction

**Storm Tracker Frontend** is a real-time typhoon tracking and forecasting application for Vietnam and the South China Sea region. The application visualizes storm paths, forecasts, and impact zones using interactive maps powered by Leaflet.js.

### Key Objectives
- Display real-time storm data from AI prediction models
- Visualize historical storm tracks and forecast predictions
- Show storm impact zones and affected areas
- Provide storm prediction capabilities using machine learning
- Deliver an intuitive, user-friendly interface for storm monitoring

### Target Users
- Meteorologists and weather forecasters
- Emergency response teams
- General public interested in storm tracking
- Researchers studying tropical cyclones

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│                    (React + TypeScript)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Contexts   │      │
│  │              │  │              │  │              │      │
│  │ - Index.tsx  │  │ - WeatherMap │  │ - WindyState │      │
│  │              │  │ - StormAnim  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Libraries  │  │   Utilities  │  │    Hooks     │      │
│  │              │  │              │  │              │      │
│  │ - stormData  │  │ - validation │  │ - useToast   │      │
│  │ - performance│  │ - colors     │  │ - useTheme   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Backend API Server                        │
│              (AI Team - Ngrok Tunnel)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Endpoints:                                                   │
│  - GET  /get-recent-storms  → Returns storm list            │
│  - POST /predict            → Storm path prediction          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
Index.tsx (Main Page)
    │
    ├─→ WeatherMap.tsx (Map Container)
    │       │
    │       ├─→ Leaflet MapContainer
    │       │
    │       └─→ StormAnimation.tsx (Per Storm)
    │               │
    │               ├─→ GradientStormTrack (Path visualization)
    │               ├─→ HurricaneMarker (Storm icons)
    │               ├─→ StormTooltip (Info popups)
    │               ├─→ StormInfluenceZone (Impact area)
    │               └─→ ForecastCone (Uncertainty cone)
    │
    ├─→ StormTracker (Sidebar - Storm list)
    │
    ├─→ StormInfo (Storm details panel)
    │
    └─→ StormPredictionForm (ML prediction form)
```

---

## 3. Core Features

### 3.1 Real-Time Storm Tracking

**Description**: Display multiple active storms simultaneously on an interactive map.

**Features**:
- Fetch storm data from backend API
- Display up to 3 active storms with distinct colors
- Show historical track (past positions)
- Show forecast track (predicted positions)
- Real-time data updates

**Visual Elements**:
- Storm path lines with gradient colors
- Hurricane markers sized by intensity
- Tooltips showing storm metrics
- Impact zones (buffer areas)

![Storm Tracking Screenshot - TO BE ADDED]

---

### 3.2 Storm Visualization

**Description**: Rich visual representation of storm characteristics and movement.

**Components**:

#### A. Storm Track Lines
- **Historical Track**: Solid line showing past positions
- **Forecast Track**: Dashed line showing predicted path
- **Color Coding**: Each storm has unique color (red, blue, green, orange, purple, yellow)
- **Gradient Effect**: Color intensity varies with storm strength

#### B. Hurricane Markers
- **Size Scaling**: Marker size increases with storm category
  - TD (Tropical Depression): Smallest
  - TS (Tropical Storm): Small
  - C1-C2: Medium
  - C3-C4: Large
  - C5: Largest
- **Interactive**: Click to view detailed information
- **Tooltips**: Hover to see instant metrics

#### C. Storm Influence Zones
- **Buffer Area**: Semi-transparent zone around storm path
- **Dynamic Radius**: Width varies based on wind speed
- **Smooth Boundaries**: Catmull-Rom spline interpolation
- **Visual Style**: Dashed white outline with translucent fill

![Storm Visualization Components - TO BE ADDED]

---

### 3.3 Storm Information Display

**Description**: Detailed metrics and data for each storm point.

**Information Shown**:
- **Storm Name**: Vietnamese and English names
- **Category**: TD, TS, C1-C5 classification
- **Wind Speed**: km/h measurement
- **Pressure**: hPa (hectopascals)
- **Timestamp**: Date and time of observation
- **Position**: Latitude and longitude coordinates

**Display Methods**:
- Tooltips on hover
- Sidebar detail panel
- Popup on marker click

![Storm Information Panel - TO BE ADDED]

---

### 3.4 Storm Prediction

**Description**: Machine learning-based storm path prediction.

**Workflow**:
1. User inputs ≥9 historical data points
2. Data sent to AI prediction API
3. Model returns predicted path coordinates
4. Predicted path displayed in cyan color

**Input Requirements**:
- **Minimum 9 data points** required for accurate AI model prediction
- Each point must contain all 5 fields: datetime, latitude, longitude, windspeed, pressure
- Data should be sorted chronologically (oldest to newest)
- Time intervals between points should be consistent (recommended: 6 hours)

**Input Data Format**:
```typescript
interface StormDataRow {
  datetime: string;    // ISO format: "2025-10-01T00:00"
  latitude: string;    // Decimal degrees
  longitude: string;   // Decimal degrees
  windspeed: string;   // km/h
  pressure: string;    // hPa
}
```

**Example Input Data**:
```
datetime,latitude,longitude,windspeed,pressure
2025-10-01T00:00,15.5,110.5,85,995
2025-10-01T06:00,15.8,110.8,90,992
2025-10-01T12:00,16.1,111.2,95,990
2025-10-01T18:00,16.5,111.6,100,988
2025-10-02T00:00,16.9,112.0,105,985
2025-10-02T06:00,17.3,112.5,110,983
2025-10-02T12:00,17.8,113.0,115,980
2025-10-02T18:00,18.2,113.5,120,978
2025-10-03T00:00,18.7,114.0,125,975
```

**Output**:
- Array of predicted coordinates
- Displayed as cyan dashed line on map
- Automatically zooms to show prediction

**Important Notes**:
- The model requires **exactly 9 data points** for optimal accuracy
- If you have more than 9 points, select the 9 most recent or representative ones
- Ensure no missing or invalid values in the data
- Coordinates must be within valid ranges (lat: -90 to 90, lng: -180 to 180)
- Wind speed and pressure must be positive numbers

![Prediction Form - TO BE ADDED]

---

## 4. Technology Stack

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Mapping & Visualization
- **Leaflet.js** - Interactive maps
- **React-Leaflet** - React bindings for Leaflet
- **Google Maps Tiles** - Satellite imagery

### State Management
- **React Context API** - Global state
- **React Hooks** - Local state management

### Styling
- **Tailwind CSS** - Utility-first CSS
- **Custom CSS** - Component-specific styles

### Data Fetching
- **Fetch API** - HTTP requests
- **React Query** - Data caching (optional)

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **97.6% test coverage**

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking

---

## 5. Project Structure

```
storm_fe/
│
├── public/                      # Static assets
│
├── src/
│   ├── pages/
│   │   ├── Index.tsx           # Main application page
│   │   └── NotFound.tsx        # 404 page
│   │
│   ├── components/
│   │   ├── WeatherMap.tsx      # Main map container
│   │   ├── StormAnimation.tsx  # Storm renderer
│   │   ├── StormTracker.tsx    # Storm list sidebar
│   │   ├── StormInfo.tsx       # Storm details panel
│   │   ├── StormPredictionForm.tsx  # Prediction form
│   │   ├── ThemeToggle.tsx     # Dark/light mode toggle
│   │   │
│   │   ├── storm/              # Storm visualization components
│   │   │   ├── GradientStormTrack.tsx
│   │   │   ├── HurricaneMarker.tsx
│   │   │   ├── StormTooltip.tsx
│   │   │   ├── StormInfluenceZone.tsx
│   │   │   ├── ForecastCone.tsx
│   │   │   ├── CurrentPositionMarker.tsx
│   │   │   └── WindStrengthCircles.tsx
│   │   │
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   └── timeline/           # Timeline components (disabled)
│   │       └── TimelineSlider.tsx
│   │
│   ├── lib/                    # Business logic libraries
│   │   ├── stormData.ts        # Storm data types & utilities
│   │   ├── stormValidation.ts  # Data validation
│   │   ├── stormPerformance.ts # Performance optimization
│   │   ├── stormAnimations.ts  # Animation utilities
│   │   ├── stormIntensityChanges.ts
│   │   └── mapUtils.ts         # Map configuration
│   │
│   ├── utils/                  # Utility functions
│   │   └── colorInterpolation.ts
│   │
│   ├── contexts/               # React contexts
│   │   └── WindyStateContext.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-toast.ts
│   │   ├── use-theme.tsx
│   │   ├── use-mobile.ts
│   │   ├── useTimelineState.ts
│   │   └── useWindyStateSync.ts
│   │
│   ├── styles/                 # Global styles
│   │   ├── index.css
│   │   └── accessibility.css
│   │
│   ├── App.tsx                 # Root component
│   └── main.tsx                # Entry point
│
├── docs/                       # Documentation
│   ├── _index.md              # This file (English)
│   ├── _index-vi.md           # Vietnamese version
│   └── ...
│
├── .kiro/                      # Kiro AI specs
│   └── specs/
│
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── tailwind.config.ts         # Tailwind config
└── README.md                  # Project readme
```

---

## 6. Data Flow

### 6.1 Storm Data Loading Flow

```
1. User opens application
   ↓
2. Index.tsx useEffect triggers
   ↓
3. Fetch GET /get-recent-storms
   ↓
4. Backend returns Storm[] array
   ↓
5. Data validated & sanitized
   ↓
6. State updated: setStorms(data)
   ↓
7. WeatherMap receives storms prop
   ↓
8. StormAnimation renders each storm
   ↓
9. Visual components display on map
```

### 6.2 Storm Prediction Flow

```
1. User opens prediction form
   ↓
2. User inputs ≥9 historical points
   ↓
3. Form validates input data
   ↓
4. POST /predict with data
   ↓
5. AI model processes request
   ↓
6. Backend returns predicted coordinates
   ↓
7. State updated: setCustomPrediction(data)
   ↓
8. Cyan prediction line displayed
   ↓
9. Map auto-zooms to prediction
```

### 6.3 Component State Flow

```
Global State (Context)
├── WindyStateContext
│   ├── timeline state (disabled)
│   ├── layer state (disabled)
│   └── windy mode (disabled)

Local State (Index.tsx)
├── storms: Storm[]
├── selectedStorm: Storm | undefined
├── customPrediction: [lat, lng][]
├── loading: boolean
├── error: string | null
└── showSidebar: boolean
```

---

## 7. Component Breakdown

### 7.1 Index.tsx (Main Page)

**Purpose**: Root page component managing application state and layout.

**Responsibilities**:
- Fetch storm data from API
- Manage selected storm state
- Handle prediction results
- Coordinate between map and sidebar
- Error handling and loading states

**Key Functions**:
```typescript
- useEffect() → Fetch storms on mount
- handleStormSelect() → Select storm from list
- handlePredictionResult() → Process AI prediction
- toggleSidebar() → Show/hide sidebar
```

**State Management**:
- `storms` - Array of all storms
- `selectedStorm` - Currently selected storm
- `customPrediction` - AI prediction path
- `loading` - Loading indicator
- `error` - Error messages

---

### 7.2 WeatherMap.tsx (Map Container)

**Purpose**: Main map component using Leaflet.

**Responsibilities**:
- Initialize Leaflet map
- Render base map tiles
- Create custom panes for z-index layering
- Render storm animations
- Handle map interactions

**Map Configuration**:
- Center: Vietnam (15°N, 110°E)
- Zoom: 5-10 range
- Bounds: Vietnam and South China Sea
- Tiles: Google Satellite + Labels

**Custom Panes** (z-index ordering):
- `stormConePane` (440) - Forecast cones
- `stormCirclePane` (445) - Wind circles
- `stormTrackPane` (450) - Storm tracks
- `overlayPane` (400) - Default overlay
- `markerPane` (600) - Default markers
- `stormMarkerPane` (650) - Storm markers

---

### 7.3 StormAnimation.tsx (Storm Renderer)

**Purpose**: Render all visual elements for a single storm.

**Responsibilities**:
- Render historical track
- Render forecast track
- Render storm markers
- Render influence zone
- Render forecast cone
- Handle storm-specific interactions

**Props**:
```typescript
{
  storm: Storm;
  isActive: boolean;
  stormIndex: number;
  totalStorms: number;
  isWindyMode: boolean;
  currentTime: number;
  customColor: string;
}
```

**Child Components**:
- `GradientStormTrack` - Path lines
- `HurricaneMarker` - Storm icons
- `StormTooltip` - Info tooltips
- `StormInfluenceZone` - Impact area
- `ForecastCone` - Uncertainty cone
- `CurrentPositionMarker` - Current position

---

### 7.4 Storm Visualization Components

#### GradientStormTrack.tsx
**Purpose**: Render storm path with gradient colors.

**Features**:
- Smooth color transitions
- Historical: solid line
- Forecast: dashed line
- Custom color support
- Zoom-based optimization

**Styling**:
- Line width: 4px
- Historical opacity: 80%
- Forecast opacity: 60%
- Smooth line joins

---

#### HurricaneMarker.tsx
**Purpose**: Display hurricane icon at storm positions.

**Features**:
- Size scales with wind speed
- Rotation based on movement direction
- Category-based sizing
- Interactive tooltips
- Pulsing animation (optional)

**Size Calculation**:
```typescript
TD: 12-16px
TS: 16-20px
C1: 20-24px
C2: 24-28px
C3: 28-32px
C4: 32-36px
C5: 36-40px
```

---

#### StormTooltip.tsx
**Purpose**: Display storm information on hover.

**Information Displayed**:
- Storm name (Vietnamese)
- Category (TD, TS, C1-C5)
- Wind speed (km/h)
- Pressure (hPa)
- Timestamp (formatted)

**Styling**:
- Dark background (rgba(30,30,30,0.95))
- White text
- 8px border radius
- Arrow pointer
- 200ms show delay
- 150ms hide delay

---

#### StormInfluenceZone.tsx
**Purpose**: Show storm impact area as buffer zone.

**Features**:
- Dynamic radius based on wind speed
- Smooth boundary using Catmull-Rom spline
- Semi-transparent fill
- Dashed outline
- Separate zones for historical/forecast

**Radius Calculation**:
```typescript
radius = min(50 + windSpeed * 1.5, 400) km
```

**Styling**:
- Fill opacity: 15%
- Border opacity: 37.5%
- Dashed line: 10px dash, 10px gap
- Smooth factor: 2

---

### 7.5 StormPredictionForm.tsx

**Purpose**: Form for inputting storm data and getting AI predictions.

**Features**:
- Dynamic row addition/removal
- Minimum 9 rows validation
- Input validation
- API integration
- Result visualization

**Input Fields** (per row):
- Datetime (ISO format)
- Latitude (decimal degrees)
- Longitude (decimal degrees)
- Wind speed (km/h)
- Pressure (hPa)

**Validation**:
- Minimum 9 rows required
- All fields must be filled
- Valid datetime format
- Valid coordinate ranges
- Numeric values for wind/pressure

---

## 8. API Integration

### 8.1 Backend API Endpoints

**Base URL**: `https://meadow-proexperiment-tobie.ngrok-free.dev`

**Required Headers**:
```javascript
{
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
}
```

---

### 8.2 GET /get-recent-storms

**Purpose**: Fetch list of active storms.

**Request**:
```http
GET /get-recent-storms HTTP/1.1
Host: meadow-proexperiment-tobie.ngrok-free.dev
ngrok-skip-browser-warning: true
```

**Response**:
```typescript
Storm[] // Array of storm objects

interface Storm {
  id: string;
  nameVi: string;
  nameEn: string;
  status: 'active' | 'inactive';
  lastPointTime: number;
  maxWindKmh: number;
  currentPosition: StormPoint;
  historical: StormPoint[];
  forecast: StormPoint[];
}

interface StormPoint {
  timestamp: number;
  lat: number;
  lng: number;
  windSpeed: number;
  pressure: number;
  category: string;
}
```

**Error Handling**:
- Network errors
- Invalid JSON response
- Empty data array
- Missing required fields

---

### 8.3 POST /predict

**Purpose**: Get AI prediction for storm path.

**Request**:
```http
POST /predict HTTP/1.1
Host: meadow-proexperiment-tobie.ngrok-free.dev
Content-Type: application/json
ngrok-skip-browser-warning: true

[
  {
    "id": "uuid",
    "datetime": "2025-10-01T00:00:00",
    "latitude": "15.5",
    "longitude": "110.5",
    "windspeed": "120",
    "pressure": "985"
  },
  // ... minimum 9 rows
]
```

**Response**:
```typescript
Array<{ lat: number; lng: number }>
```

**Error Handling**:
- Insufficient data points
- Invalid data format
- Model prediction errors
- Network timeouts

---

## 9. Visualization Features

### 9.1 Color Scheme

**Storm Colors** (by index):
```javascript
const stormColors = [
  '#ef4444', // Red - Storm 1
  '#3b82f6', // Blue - Storm 2
  '#10b981', // Green - Storm 3
  '#f97316', // Orange - Storm 4
  '#a855f7', // Purple - Storm 5
  '#eab308'  // Yellow - Storm 6
];
```

**Category Colors** (by intensity):
```javascript
TD: '#64748b'  // Gray
TS: '#3b82f6'  // Blue
C1: '#10b981'  // Green
C2: '#eab308'  // Yellow
C3: '#f97316'  // Orange
C4: '#ef4444'  // Red
C5: '#dc2626'  // Dark Red
```

---

### 9.2 Visual Hierarchy

**Z-Index Layering** (bottom to top):
1. Base map tiles (0)
2. Overlay pane (400)
3. Storm cones (440)
4. Storm circles (445)
5. Storm tracks (450)
6. Default markers (600)
7. Storm markers (650)
8. Tooltips (1000+)

---

### 9.3 Responsive Design

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Optimizations**:
- Collapsible sidebar
- Touch-friendly controls
- Simplified visualizations
- Reduced particle count

---

## 10. Performance Optimizations

### 10.1 Rendering Optimizations

- **Zoom-based track simplification**: Fewer points at lower zoom
- **Marker culling**: Skip every other marker on historical track
- **Smooth factor**: Leaflet's built-in path simplification
- **Canvas rendering**: Efficient drawing for complex paths

### 10.2 Data Optimizations

- **Validation caching**: Validate once, use multiple times
- **Memoization**: React.memo for expensive components
- **Lazy loading**: Load components on demand
- **Debouncing**: Delay expensive operations

### 10.3 Network Optimizations

- **Error retry logic**: Automatic retry on failure
- **Request caching**: Cache API responses
- **Optimistic updates**: Update UI before API response
- **Compression**: Gzip/Brotli for API responses

---



## 🔗 Related Documentation

- [Vietnamese Version](./index-vi.md)
- [Setup Guide](./setup/README.md) - TO BE CREATED
- [API Documentation](./api/README.md) - TO BE CREATED
- [Component Guide](./components/README.md) - TO BE CREATED
- [Deployment Guide](./deployment/README.md) - TO BE CREATED

---

**Last Updated**: 2025-01-13  
**Version**: 1.0.0  
**Maintained by**: Storm Tracker Team
