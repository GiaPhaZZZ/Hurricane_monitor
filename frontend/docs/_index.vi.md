# Storm Tracker Frontend - Tổng Quan Dự Án

> **Phiên bản**: 1.0.0  
> **Cập nhật**: 13/01/2025  
> **Ngôn ngữ**: [English](./_index.md) | **Tiếng Việt**

---

## 📋 Mục Lục

1. [Giới Thiệu Dự Án](#1-giới-thiệu-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Tính Năng Chính](#3-tính-năng-chính)
4. [Công Nghệ Sử Dụng](#4-công-nghệ-sử-dụng)
5. [Cấu Trúc Dự Án](#5-cấu-trúc-dự-án)
6. [Luồng Dữ Liệu](#6-luồng-dữ-liệu)
7. [Chi Tiết Components](#7-chi-tiết-components)
8. [Tích Hợp API](#8-tích-hợp-api)
9. [Tính Năng Visualization](#9-tính-năng-visualization)
10. [Tối Ưu Hiệu Suất](#10-tối-ưu-hiệu-suất)

---

## 1. Giới Thiệu Dự Án

**Storm Tracker Frontend** là ứng dụng theo dõi và dự báo bão thời gian thực cho khu vực Việt Nam và Biển Đông. Ứng dụng trực quan hóa đường đi của bão, dự báo và vùng ảnh hưởng sử dụng bản đồ tương tác Leaflet.js.

### 🎯 Mục Tiêu Chính
- Hiển thị dữ liệu bão thời gian thực từ mô hình AI
- Trực quan hóa đường đi lịch sử và dự báo
- Hiển thị vùng ảnh hưởng và khu vực bị tác động
- Dự đoán đường đi bão bằng machine learning
- Giao diện trực quan, dễ sử dụng

### 👥 Đối Tượng Sử Dụng
- Chuyên gia khí tượng và dự báo thời tiết
- Đội ứng phó khẩn cấp
- Người dân quan tâm theo dõi bão
- Nhà nghiên cứu bão nhiệt đới

---

## 2. Kiến Trúc Hệ Thống

### Sơ Đồ Tổng Quan

```
Frontend (React + TypeScript)
    ↓
    ├─→ Pages (Index.tsx)
    ├─→ Components (WeatherMap, StormAnimation)
    ├─→ Libraries (stormData, validation, performance)
    └─→ Contexts (WindyState)
    
    ↓ HTTPS/REST API
    
Backend API (AI Team - Ngrok)
    ├─→ GET /get-recent-storms
    └─→ POST /predict
```

### Kiến Trúc Components

```
Index.tsx (Trang chính)
    │
    ├─→ WeatherMap.tsx (Container bản đồ)
    │       │
    │       ├─→ Leaflet MapContainer
    │       │
    │       └─→ StormAnimation.tsx (Mỗi cơn bão)
    │               │
    │               ├─→ GradientStormTrack (Đường đi)
    │               ├─→ HurricaneMarker (Icon bão)
    │               ├─→ StormTooltip (Tooltip thông tin)
    │               ├─→ StormInfluenceZone (Vùng ảnh hưởng)
    │               └─→ ForecastCone (Vùng dự báo)
    │
    ├─→ StormTracker (Sidebar - Danh sách bão)
    ├─→ StormInfo (Panel chi tiết bão)
    └─→ StormPredictionForm (Form dự đoán ML)
```

---

## 3. Tính Năng Chính

### 3.1 Theo Dõi Bão Thời Gian Thực

**Mô tả**: Hiển thị nhiều cơn bão đang hoạt động cùng lúc trên bản đồ tương tác.

**Tính năng**:
- Lấy dữ liệu bão từ API backend
- Hiển thị tối đa 3 cơn bão với màu sắc riêng biệt
- Hiển thị đường đi lịch sử (vị trí đã qua)
- Hiển thị đường dự báo (vị trí dự đoán)
- Cập nhật dữ liệu thời gian thực

**Các thành phần trực quan**:
- Đường đi bão với màu gradient
- Icon bão có kích thước theo cường độ
- Tooltip hiển thị thông số bão
- Vùng ảnh hưởng (buffer zone)

![Ảnh Theo Dõi Bão - SẼ THÊM SAU]

---

### 3.2 Trực Quan Hóa Bão

**Mô tả**: Biểu diễn trực quan phong phú về đặc điểm và chuyển động của bão.

**Các thành phần**:

#### A. Đường Đi Bão
- **Đường lịch sử**: Đường liền nét hiển thị vị trí đã qua
- **Đường dự báo**: Đường đứt nét hiển thị đường đi dự đoán
- **Mã màu**: Mỗi bão có màu riêng (đỏ, xanh dương, xanh lá, cam, tím, vàng)
- **Hiệu ứng gradient**: Độ đậm màu thay đổi theo cường độ bão

#### B. Icon Bão (Hurricane Markers)
- **Tỷ lệ kích thước**: Kích thước icon tăng theo cấp độ bão
  - TD (Áp thấp nhiệt đới): Nhỏ nhất
  - TS (Bão nhiệt đới): Nhỏ
  - C1-C2: Trung bình
  - C3-C4: Lớn
  - C5: Lớn nhất
- **Tương tác**: Click để xem thông tin chi tiết
- **Tooltip**: Hover để xem thông số ngay lập tức

#### C. Vùng Ảnh Hưởng
- **Vùng buffer**: Vùng bán trong suốt xung quanh đường đi bão
- **Bán kính động**: Độ rộng thay đổi dựa trên tốc độ gió
- **Đường viền mượt**: Nội suy Catmull-Rom spline
- **Kiểu hiển thị**: Đường viền chấm chấm trắng với tô màu mờ

![Ảnh Components Trực Quan - SẼ THÊM SAU]

---

### 3.3 Hiển Thị Thông Tin Bão

**Mô tả**: Các thông số và dữ liệu chi tiết cho mỗi điểm trên đường đi bão.

**Thông tin hiển thị**:
- **Tên bão**: Tên tiếng Việt và tiếng Anh
- **Cấp độ**: Phân loại TD, TS, C1-C5
- **Tốc độ gió**: Đo bằng km/h
- **Áp suất**: hPa (hectopascal)
- **Thời gian**: Ngày giờ quan sát
- **Vị trí**: Tọa độ vĩ độ và kinh độ

**Phương thức hiển thị**:
- Tooltip khi hover
- Panel chi tiết ở sidebar
- Popup khi click vào marker

![Ảnh Panel Thông Tin - SẼ THÊM SAU]

---

### 3.4 Dự Đoán Bão

**Mô tả**: Dự đoán đường đi bão dựa trên machine learning.

**Quy trình**:
1. Người dùng nhập ≥9 điểm dữ liệu lịch sử
2. Dữ liệu gửi đến API dự đoán AI
3. Mô hình trả về tọa độ đường đi dự đoán
4. Đường dự đoán hiển thị trên bản đồ màu cyan

**Dữ liệu đầu vào**:
```typescript
interface StormDataRow {
  datetime: string;    // VD: "2025-10-01T00:00"
  latitude: string;    // Vĩ độ
  longitude: string;   // Kinh độ
  windspeed: string;   // Tốc độ gió (km/h)
  pressure: string;    // Áp suất (hPa)
}
```

**Dữ liệu đầu ra**:
```typescript
interface PredictionPoint {
  lat: number;
  lng: number;
}
```

**Yêu cầu dữ liệu đầu vào**:
- **Tối thiểu 9 điểm dữ liệu** để mô hình AI có thể dự đoán chính xác
- Mỗi điểm phải có đầy đủ 5 trường: datetime, latitude, longitude, windspeed, pressure
- Dữ liệu nên được sắp xếp theo thứ tự thời gian (từ cũ đến mới)
- Khoảng cách thời gian giữa các điểm nên đều đặn (khuyến nghị 6 giờ)

**Ví dụ dữ liệu nhập vào**:
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

**Lưu ý quan trọng**:
- Mô hình yêu cầu **chính xác 9 điểm** để đạt độ chính xác tối ưu
- Nếu có nhiều hơn 9 điểm, chọn 9 điểm gần nhất hoặc đại diện nhất
- Đảm bảo dữ liệu không có giá trị thiếu hoặc không hợp lệ
- Tọa độ phải nằm trong phạm vi hợp lệ (lat: -90 đến 90, lng: -180 đến 180)

![Ảnh Form Dự Đoán - SẼ THÊM SAU]

---

## 4. Công Nghệ Sử Dụng

### Frontend Framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS

### Mapping & Visualization
- **Leaflet.js** - Interactive maps
- **React-Leaflet** - React bindings for Leaflet
- **Turf.js** - Geospatial analysis

### State Management
- **React Context API** - Global state
- **React Hooks** - Local state

### Data Fetching
- **Fetch API** - HTTP requests
- **React Query** - Server state management

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing (planned)

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

---

## 5. Cấu Trúc Dự Án

```
storm_fe/
├── src/
│   ├── pages/
│   │   ├── Index.tsx              # Trang chính
│   │   └── NotFound.tsx           # Trang 404
│   │
│   ├── components/
│   │   ├── WeatherMap.tsx         # Container bản đồ
│   │   ├── StormAnimation.tsx     # Render từng bão
│   │   ├── StormTracker.tsx       # Sidebar danh sách bão
│   │   ├── StormInfo.tsx          # Panel chi tiết bão
│   │   ├── StormPredictionForm.tsx # Form dự đoán
│   │   ├── ThemeToggle.tsx        # Toggle dark/light mode
│   │   │
│   │   ├── storm/                 # Storm visualization components
│   │   │   ├── GradientStormTrack.tsx      # Đường đi gradient
│   │   │   ├── HurricaneMarker.tsx         # Icon bão
│   │   │   ├── StormTooltip.tsx            # Tooltip thông tin
│   │   │   ├── StormInfluenceZone.tsx      # Vùng ảnh hưởng
│   │   │   ├── ForecastCone.tsx            # Vùng dự báo
│   │   │   ├── CurrentPositionMarker.tsx   # Vị trí hiện tại
│   │   │   └── WindStrengthCircles.tsx     # Vòng tròn gió
│   │   │
│   │   ├── timeline/              # Timeline components (đã tắt)
│   │   │   └── TimelineSlider.tsx
│   │   │
│   │   └── ui/                    # UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── toast.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── stormData.ts           # Types & interfaces
│   │   ├── stormValidation.ts     # Validation logic
│   │   ├── stormPerformance.ts    # Performance optimization
│   │   ├── stormAnimations.ts     # Animation utilities
│   │   ├── stormIntensityChanges.ts # Intensity tracking
│   │   ├── mapUtils.ts            # Map utilities
│   │   └── windyStatePersistence.ts # State persistence
│   │
│   ├── contexts/
│   │   └── WindyStateContext.tsx  # Global state management
│   │
│   ├── hooks/
│   │   ├── use-toast.ts           # Toast notifications
│   │   ├── use-theme.tsx          # Theme management
│   │   ├── use-mobile.ts          # Mobile detection
│   │   ├── useTimelineState.ts    # Timeline state
│   │   └── useWindyStateSync.ts   # State synchronization
│   │
│   ├── utils/
│   │   └── colorInterpolation.ts  # Color utilities
│   │
│   ├── styles/
│   │   ├── index.css              # Global styles
│   │   └── accessibility.css      # A11y styles
│   │
│   └── __tests__/                 # Test files
│       └── ...
│
├── docs/                          # Documentation
│   ├── _index-vi.md              # Tài liệu tiếng Việt
│   └── _index.md                 # English documentation
│
├── public/                        # Static assets
│
├── .kiro/                         # Kiro IDE specs
│   └── specs/
│       ├── windy-style-storm-tracker/
│       └── windy-style-enhancements/
│
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Vite config
├── tailwind.config.ts             # Tailwind config
└── README.md                      # Project readme
```

---

## 6. Luồng Dữ Liệu

### 6.1 Luồng Lấy Dữ Liệu Bão

```
1. User mở ứng dụng
   ↓
2. Index.tsx useEffect() trigger
   ↓
3. Fetch GET /get-recent-storms
   ↓
4. Backend trả về Storm[]
   ↓
5. Validate & sanitize data
   ↓
6. Update state: setStorms(data)
   ↓
7. WeatherMap nhận props storms
   ↓
8. Render StormAnimation cho mỗi bão
   ↓
9. Hiển thị trên bản đồ
```

### 6.2 Luồng Dự Đoán Bão

```
1. User nhập ≥9 dòng dữ liệu
   ↓
2. Click "Chạy Dự Đoán"
   ↓
3. Validate input data
   ↓
4. POST /predict với body: StormDataRow[]
   ↓
5. Backend AI xử lý và trả về predictions
   ↓
6. Parse response: { lat, lng }[]
   ↓
7. Update state: setCustomPrediction(data)
   ↓
8. WeatherMap nhận customPredictionPath
   ↓
9. Vẽ đường dự đoán màu cyan
   ↓
10. Zoom map đến vùng dự đoán
```

### 6.3 Luồng Tương Tác

```
User hover vào marker
   ↓
StormTooltip hiển thị
   ↓
Hiển thị: tên, cấp độ, gió, áp suất, thời gian

User click vào bão trong sidebar
   ↓
setSelectedStorm(storm)
   ↓
StormInfo panel hiển thị chi tiết
   ↓
Map zoom đến vị trí bão
```

---

## 7. Chi Tiết Components

### 7.1 Index.tsx (Trang Chính)

**Vai trò**: Component gốc, quản lý state và layout tổng thể.

**State quản lý**:
```typescript
const [storms, setStorms] = useState<Storm[]>([]);
const [selectedStorm, setSelectedStorm] = useState<Storm | undefined>();
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [showSidebar, setShowSidebar] = useState(false);
const [customPrediction, setCustomPrediction] = useState<[number, number][] | null>(null);
const [mapFocusBounds, setMapFocusBounds] = useState<LatLngBounds | null>(null);
```

**Chức năng chính**:
- Fetch dữ liệu bão từ API
- Quản lý sidebar visibility
- Xử lý storm selection
- Quản lý custom prediction
- Layout responsive

---

### 7.2 WeatherMap.tsx

**Vai trò**: Container cho Leaflet map và các layer.

**Props**:
```typescript
interface WeatherMapProps {
  storms: Storm[];
  selectedStorm?: Storm;
  isPlayingAll: boolean;
  customPredictionPath: [number, number][] | null;
  mapFocusBounds: LatLngBounds | null;
  onMapFocusComplete: () => void;
}
```

**Chức năng**:
- Khởi tạo Leaflet MapContainer
- Render base map layers (Google Satellite + Labels)
- Render StormAnimation cho mỗi bão
- Render custom prediction path
- Quản lý map bounds và zoom
- Tạo các panes cho z-index layering

**Map Configuration**:
```typescript
const VIETNAM_CENTER = { lat: 16.0, lng: 108.0 };
const DEFAULT_ZOOM = 6;
const VIETNAM_BOUNDS = [
  [8.0, 102.0],  // Southwest
  [24.0, 120.0]  // Northeast
];
```

---

### 7.3 StormAnimation.tsx

**Vai trò**: Render visualization cho một cơn bão cụ thể.

**Props**:
```typescript
interface StormAnimationProps {
  storm: Storm;
  isActive: boolean;
  stormIndex?: number;
  totalStorms?: number;
  isWindyMode?: boolean;
  currentTime?: number;
  customColor?: string;
}
```

**Components con**:
- `GradientStormTrack` - Đường đi lịch sử và dự báo
- `HurricaneMarker` - Icon bão tại các điểm
- `StormTooltip` - Tooltip thông tin
- `StormInfluenceZone` - Vùng ảnh hưởng
- `ForecastCone` - Vùng dự báo (đã tắt)
- `CurrentPositionMarker` - Vị trí hiện tại

**Tối ưu hóa**:
- Zoom-based point optimization
- Adaptive rendering
- Performance monitoring

---

### 7.4 GradientStormTrack.tsx

**Vai trò**: Vẽ đường đi bão với màu gradient.

**Props**:
```typescript
interface GradientStormTrackProps {
  points: StormPoint[];
  isHistorical: boolean;
  isAnimating?: boolean;
  animationProgress?: number;
  zIndex?: number;
  isWindyMode?: boolean;
  customColor?: string;
}
```

**Tính năng**:
- Gradient color theo intensity
- Solid line cho historical
- Dashed line cho forecast
- Smooth line joins
- Custom color support

**Styling**:
```typescript
// Historical
opacity: 0.8
dashArray: undefined (solid)

// Forecast
opacity: 0.6
dashArray: '10 5' (dashed)
```

---

### 7.5 HurricaneMarker.tsx

**Vai trò**: Icon bão với kích thước động.

**Props**:
```typescript
interface HurricaneMarkerProps {
  position: StormPoint;
  nextPosition?: StormPoint;
  previousPosition?: StormPoint;
  isPulsing?: boolean;
  size?: number;
  useIntensitySize?: boolean;
  showIntensityGlow?: boolean;
  children?: React.ReactNode;
}
```

**Tính năng**:
- Kích thước theo wind speed
- Rotation theo hướng di chuyển
- Pulsing animation
- Intensity glow effect
- Custom icon rendering

**Size calculation**:
```typescript
function calculateIntensityMarkerSize(windSpeed: number, category: string): number {
  const baseSize = 20;
  const sizeMultiplier = windSpeed / 100;
  return Math.min(baseSize + sizeMultiplier * 15, 50);
}
```

---

### 7.6 StormTooltip.tsx

**Vai trò**: Hiển thị thông tin bão khi hover.

**Props**:
```typescript
interface StormTooltipProps {
  stormName: string;
  stormData: StormPoint;
  permanent?: boolean;
  className?: string;
  currentTime?: number;
  isHistorical?: boolean;
  isForecast?: boolean;
}
```

**Thông tin hiển thị**:
- Tên bão
- Cấp độ (category)
- Tốc độ gió (km/h)
- Áp suất (hPa)
- Thời gian (formatted)
- Label: Lịch sử / Dự báo

**Styling**:
```css
background: rgba(30, 30, 30, 0.95)
color: white
padding: 12px 16px
border-radius: 8px
box-shadow: 0 4px 12px rgba(0,0,0,0.3)
```

---

### 7.7 StormInfluenceZone.tsx

**Vai trò**: Vẽ vùng ảnh hưởng bao quanh đường đi bão.

**Props**:
```typescript
interface StormInfluenceZoneProps {
  points: StormPoint[];
  color?: string;
  opacity?: number;
}
```

**Thuật toán**:
1. Tính bán kính cho mỗi điểm dựa trên wind speed
2. Tạo offset points bên trái và bên phải
3. Smooth boundary với Catmull-Rom spline
4. Tạo polygon từ left + right boundaries

**Radius calculation**:
```typescript
function getInfluenceRadius(windSpeed: number): number {
  return Math.min(50 + windSpeed * 1.5, 400); // km
}
```

**Smoothing**:
- Catmull-Rom spline interpolation
- Tension: 0.3
- 3 interpolated points giữa mỗi cặp điểm
- Leaflet smoothFactor: 2

---

### 7.8 StormPredictionForm.tsx

**Vai trò**: Form nhập dữ liệu để dự đoán đường đi bão.

**State**:
```typescript
interface StormDataRow {
  id: string;
  datetime: string;
  latitude: string;
  longitude: string;
  windspeed: string;
  pressure: string;
}

const [rows, setRows] = useState<StormDataRow[]>([...]);
```

**Validation**:
- Tối thiểu 9 dòng dữ liệu
- Datetime format: ISO 8601
- Latitude: -90 to 90
- Longitude: -180 to 180
- Wind speed: > 0
- Pressure: > 0

**API Call**:
```typescript
const response = await fetch(API_URL, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  body: JSON.stringify(rows)
});
```

---

## 8. Tích Hợp API

### 8.1 API Endpoints

**Base URL**: `https://meadow-proexperiment-tobie.ngrok-free.dev`

#### GET /get-recent-storms

**Mô tả**: Lấy danh sách các cơn bão gần đây.

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
```typescript
try {
  const response = await fetch(API_URL, { headers });
  if (!response.ok) {
    throw new Error(`Lỗi ${response.status}`);
  }
  const data = await response.json();
  setStorms(data);
} catch (error) {
  setError(error.message);
}
```

---

#### POST /predict

**Mô tả**: Dự đoán đường đi bão dựa trên dữ liệu lịch sử.

**Request**:
```http
POST /predict HTTP/1.1
Host: meadow-proexperiment-tobie.ngrok-free.dev
Content-Type: application/json
ngrok-skip-browser-warning: true

[
  {
    "datetime": "2025-10-01T00:00",
    "latitude": "15.5",
    "longitude": "110.5",
    "windspeed": "120",
    "pressure": "985"
  },
  // ... tối thiểu 9 điểm
]
```

**Response**:
```typescript
Array<{ lat: number; lng: number }>

// Example:
[
  { "lat": 16.2, "lng": 111.3 },
  { "lat": 16.8, "lng": 112.1 },
  { "lat": 17.5, "lng": 112.9 }
]
```

**Error Handling**:
```typescript
if (rows.length < 9) {
  showError("Cần ít nhất 9 dòng dữ liệu");
  return;
}

try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify(rows)
  });
  
  if (!response.ok) {
    throw new Error(`Lỗi ${response.status}`);
  }
  
  const predictionData = await response.json();
  onPredictionResult(predictionData);
  showSuccess("Dự đoán thành công!");
} catch (error) {
  showError(`Dự đoán thất bại: ${error.message}`);
}
```

---

### 8.2 Data Validation

**Storm Validation** (`src/lib/stormValidation.ts`):

```typescript
// Validate storm object
function validateStorm(storm: Storm): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!storm.id) errors.push('Missing storm ID');
  if (!storm.nameVi) errors.push('Missing Vietnamese name');
  if (!storm.currentPosition) errors.push('Missing current position');
  
  // Validate coordinates
  if (!isValidCoordinate(storm.currentPosition.lat, storm.currentPosition.lng)) {
    errors.push('Invalid coordinates');
  }
  
  // Validate wind speed
  if (storm.currentPosition.windSpeed < 0 || storm.currentPosition.windSpeed > 300) {
    warnings.push('Unusual wind speed');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}

// Validate coordinates
function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Validate timestamp
function isValidTimestamp(timestamp: number): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && timestamp > 0;
}
```

---

## 9. Tính Năng Visualization

### 9.1 Color System

**Storm Colors** (theo index):
```typescript
const stormColors = [
  '#ef4444', // Đỏ - Storm 1
  '#3b82f6', // Xanh dương - Storm 2
  '#10b981', // Xanh lá - Storm 3
  '#f97316', // Cam - Storm 4
  '#a855f7', // Tím - Storm 5
  '#eab308'  // Vàng - Storm 6
];
```

**Category Colors** (theo cấp độ):
```typescript
function getCategoryColor(category: string): string {
  const colors = {
    'TD': '#64748b',  // Slate - Tropical Depression
    'TS': '#3b82f6',  // Blue - Tropical Storm
    'C1': '#22c55e',  // Green - Category 1
    'C2': '#eab308',  // Yellow - Category 2
    'C3': '#f97316',  // Orange - Category 3
    'C4': '#ef4444',  // Red - Category 4
    'C5': '#dc2626',  // Dark Red - Category 5
  };
  return colors[category] || '#64748b';
}
```

---

### 9.2 Size Scaling

**Marker Size** (theo wind speed):
```typescript
function calculateMarkerSize(windSpeed: number): number {
  const baseSize = 20;
  const maxSize = 50;
  const sizeMultiplier = windSpeed / 100;
  return Math.min(baseSize + sizeMultiplier * 15, maxSize);
}
```

**Influence Zone Radius** (theo wind speed):
```typescript
function getInfluenceRadius(windSpeed: number): number {
  // 50 km/h → 125 km radius
  // 150 km/h → 275 km radius
  // Max: 400 km
  return Math.min(50 + windSpeed * 1.5, 400);
}
```

---

### 9.3 Animation & Smoothing

**Catmull-Rom Spline** (cho smooth boundaries):
```typescript
function catmullRom(
  p0: number, 
  p1: number, 
  p2: number, 
  p3: number, 
  t: number, 
  tension: number
): number {
  const v0 = (p2 - p0) * tension;
  const v1 = (p3 - p1) * tension;
  const t2 = t * t;
  const t3 = t * t2;
  
  return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
         (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
         v0 * t + p1;
}
```

**Smooth Boundary**:
- Tension: 0.3
- Interpolation: 3 điểm giữa mỗi cặp
- Leaflet smoothFactor: 2

---

## 10. Tối Ưu Hiệu Suất

### 10.1 Zoom-Based Optimization

**Adaptive Point Rendering**:
```typescript
function getTrackForZoomLevel(points: StormPoint[], zoom: number): StormPoint[] {
  if (zoom >= 8) return points; // Hiển thị tất cả
  if (zoom >= 6) return points.filter((_, i) => i % 2 === 0); // 50%
  return points.filter((_, i) => i % 4 === 0); // 25%
}
```

---

### 10.2 Performance Monitoring

**FPS Tracking**:
```typescript
function getTargetFPS(deviceType: 'desktop' | 'mobile'): number {
  return deviceType === 'desktop' ? 60 : 30;
}
```

---

### 10.3 Memory Management

**Cleanup on Unmount**:
```typescript
useEffect(() => {
  // Setup
  const cleanup = () => {
    // Cancel animations
    // Clear timers
    // Remove event listeners
  };
  
  return cleanup;
}, []);
```

---

## 11. Testing

### Test Coverage: 97.6%

**Test Files**:
- `src/test/accessibility.test.ts` - WCAG compliance
- `src/test/performance.test.ts` - Performance benchmarks
- `src/components/storm/__tests__/interaction.test.tsx` - User interactions
- `src/lib/__tests__/stormValidation.test.ts` - Data validation
- `src/lib/__tests__/stormPerformance.test.ts` - Performance utilities

**Run Tests**:
```bash
npm test
```

---

## 12. Development

### Setup
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Environment
- Node.js: v18+
- npm: v9+

---

## 13. Deployment

### Build
```bash
npm run build
```

Output: `dist/` folder

### Deploy Options
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

---

## 14. Troubleshooting

### White Screen
**Nguyên nhân**: React hooks order violation
**Giải pháp**: Đảm bảo tất cả hooks được gọi trước conditional returns

### API Errors
**Nguyên nhân**: Ngrok URL thay đổi hoặc CORS
**Giải pháp**: Thêm header `ngrok-skip-browser-warning: true`

### Performance Issues
**Nguyên nhân**: Quá nhiều điểm render
**Giải pháp**: Bật zoom-based optimization

---

## 15. Future Enhancements

- [ ] Real-time updates với WebSocket
- [ ] PWA support (offline mode)
- [ ] Multi-language support
- [ ] Export data (CSV, JSON)
- [ ] Historical storm database
- [ ] Comparison tools
- [ ] Mobile app (React Native)

---

## 16. Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

## 17. License

MIT License - See LICENSE file

---

## 18. Contact

- **Project**: Storm Tracker Frontend
- **Version**: 1.0.0
- **Last Updated**: 13/01/2025

---

**Tài liệu này được tạo và duy trì bởi Storm Tracker Development Team** 🌪️
