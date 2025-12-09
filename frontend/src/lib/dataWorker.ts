// lib/dataWorker.ts

interface StormPoint {
    timestamp: number;
    lat: number;
    lng: number;
    windSpeed: number;
    pressure: number;
    category: string;
}

interface Storm {
    id: string;
    nameVi: string;
    nameEn: string;
    status: string;
    lastPointTime: number;
    currentPosition: StormPoint;
    historical: StormPoint[];
    forecast: StormPoint[];
    maxWindKmh: number;
}

interface WorkerStormData {
    points: StormPoint[];
    maxWind: number;
}

// Chuyển đổi tốc độ gió từ knots sang km/h
const knToKmh = (kn: number): number => kn * 1.852;

// Gán cấp độ bão dựa trên tốc độ gió
const getCategoryFromWind = (windKmh: number): string => {
  if (windKmh < 62) return "Áp thấp nhiệt đới";
  if (windKmh < 89) return "Bão cấp 1";
  if (windKmh < 118) return "Bão cấp 2";
  if (windKmh < 154) return "Bão cấp 3";
  if (windKmh < 185) return "Bão cấp 4";
  return "Siêu bão";
};

// Hàm xử lý dữ liệu nặng (đã được sửa lỗi định kiểu)
const processStormData = (data: any[]): Storm[] => {
  // Định kiểu cho stormsMap để TypeScript không báo lỗi khi indexing
  const stormsMap: { [key: string]: WorkerStormData } = {};

  data.forEach(row => {
    // Ép kiểu row sang object có key là string
    const r: { [key: string]: string } = row;
    
    const stormId = r['SID'];
    if (!stormId || !r['ISO_TIME'] || !r['LAT'] || !r['LON'] || !r['WMO_WIND']) return;

    const windValue = r['WMO_WIND'] ? parseFloat(r['WMO_WIND']) : 0;
    const windKmh = knToKmh(windValue);
    const lat = parseFloat(r['LAT']);
    const lng = parseFloat(r['LON']);
    const pres = parseFloat(r['WMO_PRES']);

    if (isNaN(lat) || isNaN(lng) || isNaN(windKmh) || isNaN(pres)) return;

    const newPoint: StormPoint = {
      timestamp: new Date(r['ISO_TIME']).getTime(),
      lat: lat,
      lng: lng,
      windSpeed: Math.round(windKmh),
      pressure: pres || 1000, 
      category: getCategoryFromWind(windKmh),
    };

    if (!stormsMap[stormId]) {
      stormsMap[stormId] = { points: [], maxWind: 0 };
    }
    
    stormsMap[stormId].points.push(newPoint);
    if (newPoint.windSpeed > stormsMap[stormId].maxWind) {
      stormsMap[stormId].maxWind = newPoint.windSpeed;
    }
  });

  let processedStorms: Storm[] = [];

  for (const stormId in stormsMap) {
    const { points, maxWind } = stormsMap[stormId];
    if (points.length === 0) continue;

    const sortedPoints = points.sort((a, b) => a.timestamp - b.timestamp);
    const lastPoint = sortedPoints[sortedPoints.length - 1];
    
    processedStorms.push({
      id: stormId,
      nameVi: "Bão " + stormId.substring(4, 7), 
      nameEn: "Typhoon " + stormId.substring(4, 7),
      status: "active",
      lastPointTime: lastPoint.timestamp, 
      currentPosition: lastPoint,
      historical: sortedPoints.slice(0, sortedPoints.length - 1),
      forecast: [lastPoint], 
      maxWindKmh: maxWind,
    } as Storm);
  }
  
  // Sắp xếp và chỉ lấy 5 cơn bão mạnh nhất
  processedStorms.sort((a, b) => b.maxWindKmh - a.maxWindKmh);
  
  return processedStorms.slice(0, 5);
};

// Lắng nghe sự kiện từ luồng chính (main thread)
// Ép kiểu self sang WindowOrWorkerGlobalScope để TypeScript biết nó đang ở Worker context
(self as unknown as Worker).onmessage = (event) => {
    const data = event.data;
    try {
        const result = processStormData(data);
        (self as unknown as Worker).postMessage({ status: 'success', data: result });
    } catch (e) {
        (self as unknown as Worker).postMessage({ status: 'error', message: 'Lỗi trong quá trình xử lý dữ liệu.' });
    }
};