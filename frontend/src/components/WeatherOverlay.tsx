import { useEffect, useRef, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export type WeatherOverlayType = 'temperature' | 'wind' | 'none';

interface WeatherOverlayProps {
  type: WeatherOverlayType;
  opacity: number;
  currentTime?: number;
  onHoverValue?: (value: { type: string; value: number; unit: string; position: { x: number; y: number } } | null) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

interface WeatherDataPoint {
  lat: number;
  lng: number;
  value: number;
}

interface WeatherData {
  timestamp: number;
  data: WeatherDataPoint[];
}

const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ 
  type, 
  opacity,
  currentTime,
  onHoverValue,
  onLoadingChange
}) => {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch weather data from API
  // Requirements: 4.7 - Fetch historical weather data for past times, forecast for future
  const fetchWeatherData = useCallback(async (timestamp?: number) => {
    if (type === 'none') return;

    const now = Date.now();
    const targetTime = timestamp || now;
    
    // Avoid fetching too frequently (minimum 1 minute between fetches)
    // But always fetch if timestamp changed significantly (more than 1 hour)
    const timeDiff = weatherData ? Math.abs(targetTime - weatherData.timestamp) : Infinity;
    const oneHour = 60 * 60 * 1000;
    
    if (now - lastFetchTimeRef.current < 60000 && weatherData && timeDiff < oneHour) {
      return;
    }

    lastFetchTimeRef.current = now;

    try {
      // Notify parent component that loading started
      onLoadingChange?.(true);
      
      // Generate mock data for now (in production, this would fetch from API)
      // Handle historical vs forecast data differently
      const data = await generateWeatherData(type, targetTime);
      setWeatherData(data);
      
      // Notify parent component that loading completed
      onLoadingChange?.(false);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      
      // Handle data gaps gracefully - keep existing data if fetch fails
      if (!weatherData) {
        // If no data at all, try to generate fallback data
        try {
          const fallbackData = await generateWeatherData(type, now);
          setWeatherData(fallbackData);
        } catch (fallbackError) {
          console.error('Failed to generate fallback weather data:', fallbackError);
        }
      }
      
      // Notify parent component that loading completed (even with error)
      onLoadingChange?.(false);
    }
  }, [type, weatherData]);

  // Set up data refresh every 10 minutes
  useEffect(() => {
    if (type === 'none') {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchWeatherData(currentTime);

    // Set up 10-minute refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchWeatherData(currentTime);
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [type, fetchWeatherData]);

  // Update data when timeline changes
  useEffect(() => {
    if (currentTime && type !== 'none') {
      fetchWeatherData(currentTime);
    }
  }, [currentTime, type, fetchWeatherData]);

  // Create and manage the overlay layer
  useEffect(() => {
    if (type === 'none' || !weatherData) {
      if (layerRef.current && map.hasLayer(layerRef.current)) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    class WeatherHeatLayer extends L.Layer {
      private _container: HTMLCanvasElement | null = null;
      private _ctx: CanvasRenderingContext2D | null = null;
      private _data: WeatherDataPoint[] = [];
      private _type: WeatherOverlayType = 'temperature';
      private _opacity: number = 0.6;

      constructor(data: WeatherDataPoint[], overlayType: WeatherOverlayType, overlayOpacity: number) {
        super();
        this._data = data;
        this._type = overlayType;
        this._opacity = overlayOpacity;
      }

      onAdd(map: L.Map): this {
        const container = L.DomUtil.create('canvas', 'leaflet-zoom-animated weather-overlay-canvas');
        const size = map.getSize();
        container.width = size.x;
        container.height = size.y;
        container.style.position = 'absolute';
        container.style.zIndex = '10';
        container.style.pointerEvents = 'auto';
        container.style.cursor = 'crosshair';
        
        this._container = container;
        this._ctx = container.getContext('2d');
        
        map.getPanes().overlayPane?.appendChild(container);
        
        // Add mouse move handler for hover values
        L.DomEvent.on(container, 'mousemove', this._onMouseMove, this);
        L.DomEvent.on(container, 'mouseout', this._onMouseOut, this);
        
        map.on('moveend zoom resize', this._reset, this);
        this._reset();
        
        return this;
      }

      onRemove(map: L.Map): this {
        if (this._container) {
          L.DomEvent.off(this._container, 'mousemove', this._onMouseMove, this);
          L.DomEvent.off(this._container, 'mouseout', this._onMouseOut, this);
          L.DomUtil.remove(this._container);
          this._container = null;
        }
        this._ctx = null;
        map.off('moveend zoom resize', this._reset, this);
        return this;
      }

      private _onMouseMove = (e: Event): void => {
        if (!this._container || !onHoverValue) return;
        
        const mouseEvent = e as MouseEvent;
        const rect = this._container.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;
        
        // Convert pixel position to lat/lng
        const map = this._map as L.Map;
        const point = L.point(x, y);
        const latlng = map.containerPointToLatLng(point);
        
        // Find nearest data point
        const value = this._getValueAtPosition(latlng.lat, latlng.lng);
        
        if (value !== null) {
          onHoverValue({
            type: this._type,
            value: value,
            unit: this._type === 'temperature' ? '°C' : 'km/h',
            position: { x: mouseEvent.clientX, y: mouseEvent.clientY }
          });
        }
      };

      private _onMouseOut = (): void => {
        if (onHoverValue) {
          onHoverValue(null);
        }
      };

      private _getValueAtPosition(lat: number, lng: number): number | null {
        // Find closest data point
        let minDist = Infinity;
        let closestValue: number | null = null;
        
        for (const point of this._data) {
          const dist = Math.sqrt(
            Math.pow(point.lat - lat, 2) + Math.pow(point.lng - lng, 2)
          );
          
          if (dist < minDist && dist < 0.5) { // Within 0.5 degrees
            minDist = dist;
            closestValue = point.value;
          }
        }
        
        return closestValue;
      }

      private _reset = (): void => {
        if (!this._container) return;
        
        const map = this._map as L.Map;
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._container, topLeft);
        
        const size = map.getSize();
        this._container.width = size.x;
        this._container.height = size.y;
        
        this._render();
      };

      private _render(): void {
        if (!this._ctx || !this._container) return;
        
        const ctx = this._ctx;
        const canvas = this._container;
        const map = this._map as L.Map;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw heat map
        this._data.forEach(point => {
          const pixel = map.latLngToContainerPoint([point.lat, point.lng]);
          
          if (pixel.x >= -100 && pixel.x <= canvas.width + 100 && 
              pixel.y >= -100 && pixel.y <= canvas.height + 100) {
            
            const gradient = ctx.createRadialGradient(
              pixel.x, pixel.y, 0,
              pixel.x, pixel.y, 80
            );
            
            const color = this._getColor(point.value);
            const alpha = this._opacity;
            
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

      private _getColor(value: number): string {
        if (this._type === 'temperature') {
          return getTemperatureColor(value);
        } else {
          return getWindSpeedColor(value);
        }
      }

      updateOpacity(newOpacity: number): void {
        this._opacity = newOpacity;
        this._render();
      }
    }

    const heatLayer = new WeatherHeatLayer(weatherData.data, type, opacity);
    map.addLayer(heatLayer);
    layerRef.current = heatLayer;

    return () => {
      if (heatLayer && map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, type, weatherData, opacity, onHoverValue]);

  // Update opacity when it changes
  useEffect(() => {
    if (layerRef.current && 'updateOpacity' in layerRef.current) {
      (layerRef.current as any).updateOpacity(opacity);
    }
  }, [opacity]);

  return null;
};

// Temperature color scale: blue (cold) → green → yellow → red (hot)
function getTemperatureColor(temperature: number): string {
  if (temperature < 0) return '#1e3a8a'; // Dark blue
  if (temperature < 5) return '#3b82f6'; // Blue
  if (temperature < 10) return '#60a5fa'; // Light blue
  if (temperature < 15) return '#06b6d4'; // Cyan
  if (temperature < 20) return '#22c55e'; // Green
  if (temperature < 25) return '#84cc16'; // Light green
  if (temperature < 30) return '#facc15'; // Yellow
  if (temperature < 35) return '#f97316'; // Orange
  if (temperature < 40) return '#ef4444'; // Red
  return '#dc2626'; // Dark red
}

// Wind speed color scale: light blue (calm) → green → yellow → magenta (extreme)
function getWindSpeedColor(speed: number): string {
  if (speed < 10) return '#bae6fd'; // Light blue (calm)
  if (speed < 20) return '#7dd3fc'; // Sky blue
  if (speed < 30) return '#38bdf8'; // Blue
  if (speed < 40) return '#22c55e'; // Green
  if (speed < 50) return '#84cc16'; // Light green
  if (speed < 60) return '#facc15'; // Yellow
  if (speed < 80) return '#f97316'; // Orange
  if (speed < 100) return '#ef4444'; // Red
  if (speed < 120) return '#c026d3'; // Purple
  return '#d946ef'; // Magenta (extreme)
}

// Generate mock weather data (in production, this would fetch from API)
// Requirements: 4.7 - Update weather overlays to match timeline timestamp
async function generateWeatherData(type: WeatherOverlayType, timestamp: number): Promise<WeatherData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const data: WeatherDataPoint[] = [];
  
  // Generate grid of data points
  const latMin = 8;
  const latMax = 24;
  const lngMin = 102;
  const lngMax = 110;
  
  const latStep = (latMax - latMin) / 30;
  const lngStep = (lngMax - lngMin) / 40;
  
  // Use timestamp to create temporal variation
  const timeOffset = timestamp / (1000 * 60 * 60); // Hours since epoch
  const now = Date.now();
  const isForecast = timestamp > now;
  
  for (let i = 0; i <= 30; i++) {
    for (let j = 0; j <= 40; j++) {
      const lat = latMin + i * latStep;
      const lng = lngMin + j * lngStep;
      
      let value: number;
      if (type === 'temperature') {
        // Temperature varies by latitude, time, and adds some noise
        const baseTemp = 30 - (lat - latMin) * 0.5;
        // Add temporal variation (temperature changes over time)
        const temporalVariation = Math.sin(timeOffset / 24) * 5; // Daily cycle
        const noise = (Math.sin(lat * 10 + timeOffset) + Math.cos(lng * 10 + timeOffset)) * 3;
        value = baseTemp + temporalVariation + noise + Math.random() * 3;
        
        // Historical data is more stable, forecast has more uncertainty
        if (isForecast) {
          value += (Math.random() - 0.5) * 4; // Add forecast uncertainty
        }
      } else {
        // Wind speed with temporal and spatial variation
        const baseWind = 20 + Math.random() * 30;
        const temporalVariation = Math.sin(timeOffset / 12) * 15; // Wind changes over time
        const noise = (Math.sin(lat * 5 + timeOffset) + Math.cos(lng * 5 + timeOffset)) * 10;
        value = Math.max(0, baseWind + temporalVariation + noise);
        
        // Forecast wind data has more uncertainty
        if (isForecast) {
          value += (Math.random() - 0.5) * 10; // Add forecast uncertainty
        }
      }
      
      data.push({ lat, lng, value });
    }
  }
  
  return {
    timestamp,
    data
  };
}

export default WeatherOverlay;
