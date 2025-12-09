/**
 * StormInfluenceZone Component
 * 
 * Vẽ vùng ảnh hưởng (buffer zone) bao quanh toàn bộ đường đi của bão
 * Bán kính thay đổi theo tốc độ gió tại mỗi điểm
 */

import { Polygon } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

export interface StormPoint {
  lat: number;
  lng: number;
  windSpeed: number;
  category: string;
}

interface StormInfluenceZoneProps {
  points: StormPoint[];
  color?: string;
  opacity?: number;
}

/**
 * Tính bán kính ảnh hưởng dựa trên tốc độ gió (km)
 */
function getInfluenceRadius(windSpeed: number): number {
  // Công thức: bán kính tăng theo tốc độ gió
  // 50 km/h -> 100km, 150 km/h -> 300km
  return Math.min(50 + windSpeed * 1.5, 400);
}

/**
 * Tính điểm offset theo hướng vuông góc với đường đi
 */
function getOffsetPoint(
  point: { lat: number; lng: number },
  nextPoint: { lat: number; lng: number } | null,
  prevPoint: { lat: number; lng: number } | null,
  distance: number,
  side: 'left' | 'right'
): [number, number] {
  // Nếu không có điểm trước/sau, dùng hướng mặc định
  let bearing = 0;

  if (nextPoint) {
    // Tính góc từ điểm hiện tại đến điểm tiếp theo
    const dLon = nextPoint.lng - point.lng;
    const dLat = nextPoint.lat - point.lat;
    bearing = Math.atan2(dLon, dLat);
  } else if (prevPoint) {
    // Tính góc từ điểm trước đến điểm hiện tại
    const dLon = point.lng - prevPoint.lng;
    const dLat = point.lat - prevPoint.lat;
    bearing = Math.atan2(dLon, dLat);
  }

  // Offset vuông góc (90 độ)
  const offsetBearing = bearing + (side === 'left' ? Math.PI / 2 : -Math.PI / 2);

  // Chuyển đổi khoảng cách km sang độ (xấp xỉ)
  const distanceDeg = distance / 111; // 1 độ ≈ 111km

  const newLat = point.lat + distanceDeg * Math.cos(offsetBearing);
  const newLng = point.lng + distanceDeg * Math.sin(offsetBearing);

  return [newLat, newLng];
}

/**
 * Làm mượt đường viền bằng cách nội suy thêm điểm
 */
function smoothBoundary(points: LatLngExpression[], tension: number = 0.5): LatLngExpression[] {
  if (points.length < 3) return points;

  const smoothed: LatLngExpression[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)] as [number, number];
    const p1 = points[i] as [number, number];
    const p2 = points[i + 1] as [number, number];
    const p3 = points[Math.min(points.length - 1, i + 2)] as [number, number];

    // Thêm điểm gốc
    smoothed.push(p1);

    // Nội suy 3 điểm giữa p1 và p2 để tạo đường cong mượt
    for (let t = 0.25; t < 1; t += 0.25) {
      const lat = catmullRom(p0[0], p1[0], p2[0], p3[0], t, tension);
      const lng = catmullRom(p0[1], p1[1], p2[1], p3[1], t, tension);
      smoothed.push([lat, lng]);
    }
  }

  // Thêm điểm cuối
  smoothed.push(points[points.length - 1]);

  return smoothed;
}

/**
 * Catmull-Rom spline interpolation
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number, tension: number): number {
  const v0 = (p2 - p0) * tension;
  const v1 = (p3 - p1) * tension;
  const t2 = t * t;
  const t3 = t * t2;

  return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
    (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
    v0 * t + p1;
}

/**
 * Component vẽ vùng ảnh hưởng của bão
 */
export function StormInfluenceZone({
  points,
  color = '#ffffff',
  opacity = 0.15,
}: StormInfluenceZoneProps) {
  if (points.length < 2) {
    return null;
  }

  // Tạo đường viền bên trái và bên phải
  const leftBoundary: LatLngExpression[] = [];
  const rightBoundary: LatLngExpression[] = [];

  points.forEach((point, index) => {
    const prevPoint = index > 0 ? points[index - 1] : null;
    const nextPoint = index < points.length - 1 ? points[index + 1] : null;

    // Tính bán kính dựa trên tốc độ gió
    const radius = getInfluenceRadius(point.windSpeed);

    // Tính điểm offset bên trái và bên phải
    const leftPoint = getOffsetPoint(point, nextPoint, prevPoint, radius, 'left');
    const rightPoint = getOffsetPoint(point, nextPoint, prevPoint, radius, 'right');

    leftBoundary.push(leftPoint);
    rightBoundary.push(rightPoint);
  });

  // Làm mượt các đường viền
  const smoothedLeft = smoothBoundary(leftBoundary, 0.3);
  const smoothedRight = smoothBoundary(rightBoundary, 0.3);

  // Tạo polygon: đi theo bên trái, rồi quay lại theo bên phải
  const polygonPoints: LatLngExpression[] = [
    ...smoothedLeft,
    ...smoothedRight.reverse(),
  ];

  return (
    <Polygon
      positions={polygonPoints}
      pathOptions={{
        color: color,
        weight: 2,
        opacity: opacity * 2.5,
        fillColor: color,
        fillOpacity: opacity,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round',

      }}
      pane="stormConePane"
    />
  );
}

export default StormInfluenceZone;
