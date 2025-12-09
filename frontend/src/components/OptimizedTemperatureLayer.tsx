import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface OptimizedTemperatureLayerProps {
  opacity: number;
  showAnimation?: boolean;
}

const OptimizedTemperatureLayer: React.FC<OptimizedTemperatureLayerProps> = ({ 
  opacity, 
  showAnimation = false 
}) => {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    class OptimizedTemperatureHeatLayer extends L.Layer {
      private _container: HTMLCanvasElement | null = null;
      private _ctx: CanvasRenderingContext2D | null = null;
      private _animationId: number | null = null;
      private _heatData: HeatPoint[] = [];
      private _time = 0;

      onAdd(map: L.Map): this {
        const container = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
        const size = map.getSize();
        container.width = size.x;
        container.height = size.y;
        container.style.position = 'absolute';
        container.style.zIndex = '10';
        container.style.pointerEvents = 'none';
        
        this._container = container;
        this._ctx = container.getContext('2d');
        
        map.getPanes().overlayPane?.appendChild(container);
        
        this._initHeatData();
        
        map.on('moveend zoom resize', this._reset, this);
        this._reset();
        
        return this;
      }

      onRemove(map: L.Map): this {
        if (this._animationId) {
          cancelAnimationFrame(this._animationId);
          this._animationId = null;
        }
        if (this._container) {
          L.DomUtil.remove(this._container);
          this._container = null;
        }
        this._ctx = null;
        map.off('moveend zoom resize', this._reset, this);
        return this;
      }

      private _reset = (): void => {
        if (!this._container) return;
        
        const map = this._map as L.Map;
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._container, topLeft);
        
        const size = map.getSize();
        this._container.width = size.x;
        this._container.height = size.y;
        
        this._initHeatData();
        
        if (!this._animationId) {
          this._animate();
        }
      }

      private _initHeatData(): void {
        this._heatData = [];
        const bounds = (this._map as L.Map).getBounds();
        
        // Tạo grid dày hơn cho hiệu ứng mượt mà
        const latStep = (bounds.getNorth() - bounds.getSouth()) / 40;
        const lngStep = (bounds.getEast() - bounds.getWest()) / 60;
        
        for (let i = 0; i <= 40; i++) {
          for (let j = 0; j <= 60; j++) {
            const lat = bounds.getSouth() + i * latStep;
            const lng = bounds.getWest() + j * lngStep;
            
            const temperature = this._generateTemperature(lat, lng);
            
            this._heatData.push({
              lat,
              lng,
              temperature,
              intensity: this._getTemperatureIntensity(temperature)
            });
          }
        }
      }

      private _generateTemperature(lat: number, lng: number): number {
        // Tạo nhiệt độ thực tế hơn dựa trên vị trí địa lý
        const isOcean = this._isOcean(lat, lng);
        const isMountain = this._isMountain(lat, lng);
        
        // Thêm noise để tạo sự biến thiên tự nhiên
        const noise = (Math.sin(lat * 10) + Math.cos(lng * 10)) * 2;
        
        if (isOcean) {
          return 27 + noise + Math.random() * 3; // 27-32°C cho biển
        } else if (isMountain) {
          return 18 + noise + Math.random() * 8; // 18-28°C cho núi
        } else {
          return 25 + noise + Math.random() * 10; // 25-37°C cho đất liền
        }
      }

      private _isOcean(lat: number, lng: number): boolean {
        return lng > 109 || lng < 102 || lat < 8.5 || lat > 23.5;
      }

      private _isMountain(lat: number, lng: number): boolean {
        return (lat > 20 && lat < 23 && lng > 103 && lng < 106) ||
               (lat > 15 && lat < 17 && lng > 107 && lng < 109);
      }

      private _getTemperatureIntensity(temperature: number): number {
        const minTemp = 15;
        const maxTemp = 40;
        return Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));
      }

      private _animate = (): void => {
        if (!this._ctx || !this._container) return;
        
        const ctx = this._ctx;
        const canvas = this._container;
        
        // Clear canvas với background trong suốt
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Vẽ heat map với hiệu ứng động
        this._drawSmoothHeatMap(ctx, canvas);
        
        this._time += 0.02; // Tốc độ animation
        
        if (this._container && this._container.parentNode) {
          this._animationId = requestAnimationFrame(this._animate);
        }
      }

      private _drawSmoothHeatMap(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        const map = this._map as L.Map;
        
        // Vẽ từng điểm nhiệt độ với gradient mượt mà
        this._heatData.forEach(point => {
          const pixel = map.latLngToContainerPoint([point.lat, point.lng]);
          
          if (pixel.x >= -50 && pixel.x <= canvas.width + 50 && 
              pixel.y >= -50 && pixel.y <= canvas.height + 50) {
            
            // Thêm hiệu ứng động nếu bật animation
            let animatedIntensity = point.intensity;
            if (showAnimation) {
              const wave = Math.sin(this._time + point.lat * 5 + point.lng * 5) * 0.1;
              animatedIntensity = Math.max(0, Math.min(1, point.intensity + wave));
            }
            
            const gradient = ctx.createRadialGradient(
              pixel.x, pixel.y, 0,
              pixel.x, pixel.y, 80
            );
            
            const color = this._getTemperatureColor(point.temperature);
            const alpha = animatedIntensity * opacity * 0.8;
            
            // Tạo gradient với nhiều điểm màu để mượt mà hơn
            gradient.addColorStop(0, color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(0.3, color + Math.floor(alpha * 200).toString(16).padStart(2, '0'));
            gradient.addColorStop(0.6, color + Math.floor(alpha * 100).toString(16).padStart(2, '0'));
            gradient.addColorStop(0.8, color + Math.floor(alpha * 50).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, 80, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      private _getTemperatureColor(temperature: number): string {
        // Cải thiện bảng màu để mượt mà hơn
        if (temperature < 15) return '#1e3a8a'; // Xanh dương đậm
        if (temperature < 20) return '#3b82f6'; // Xanh dương
        if (temperature < 25) return '#06b6d4'; // Cyan
        if (temperature < 30) return '#22c55e'; // Xanh lá
        if (temperature < 32) return '#84cc16'; // Xanh lá nhạt
        if (temperature < 35) return '#facc15'; // Vàng
        if (temperature < 37) return '#f97316'; // Cam
        if (temperature < 40) return '#ef4444'; // Đỏ
        return '#dc2626'; // Đỏ đậm
      }
    }

    const heatLayer = new OptimizedTemperatureHeatLayer();
    map.addLayer(heatLayer);
    layerRef.current = heatLayer;

    return () => {
      if (heatLayer && map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, opacity, showAnimation]);

  return null;
};

interface HeatPoint {
  lat: number;
  lng: number;
  temperature: number;
  intensity: number;
}

export default OptimizedTemperatureLayer;

