import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  useMap,
  Tooltip,
} from 'react-leaflet';
import { type LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useToast } from '../hooks/use-toast';
import { ToastContainer } from './ui/toast';
import { LoadingSpinner } from './ui/loading-spinner';

// Import các component
import StormAnimation from './StormAnimation';
import WindyLayer from './WindyLayer';
import WeatherLayerControlPanel from './WeatherLayerControlPanel';

import WeatherLayerControl, { type LayerType } from './WeatherLayerControl';
import WeatherOverlay from './WeatherOverlay';
import WeatherValueTooltip from './WeatherValueTooltip';
import { DEFAULT_ZOOM, VIETNAM_CENTER } from '../lib/mapUtils';
import { type Storm, type PredictionResult } from '../lib/stormData';


// Marker CSS for custom styling
const markerCss = `
  .leaflet-marker-icon-green { filter: hue-rotate(80deg) saturate(1.5) brightness(0.8); }
  .leaflet-marker-icon-blue { filter: hue-rotate(170deg) saturate(1.5) brightness(0.8); }
  .leaflet-marker-icon-red { filter: hue-rotate(300deg) saturate(1.5) brightness(0.8); }
`;

// --- COMPONENT TẠO PANE ---
function CreatePredictionPane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('customPredictionPane')) {
      map.createPane('customPredictionPane');
    }
    const pane = map.getPane('customPredictionPane');
    if (pane) {
      pane.style.zIndex = '999';
    }
  }, [map]);
  return null;
}

// --- COMPONENT TẠO STORM PANE ---
// Creates dedicated panes for storm visualization layers with proper z-index ordering
function CreateStormPanes() {
  const map = useMap();
  useEffect(() => {
    // Storm track pane - below markers but above base layers
    if (!map.getPane('stormTrackPane')) {
      map.createPane('stormTrackPane');
    }
    const trackPane = map.getPane('stormTrackPane');
    if (trackPane) {
      trackPane.style.zIndex = '450'; // Above overlayPane (400) but below markerPane (600)
    }

    // Storm cone pane - below tracks
    if (!map.getPane('stormConePane')) {
      map.createPane('stormConePane');
    }
    const conePane = map.getPane('stormConePane');
    if (conePane) {
      conePane.style.zIndex = '440'; // Below tracks
    }

    // Storm circle pane - above cone, below marker
    if (!map.getPane('stormCirclePane')) {
      map.createPane('stormCirclePane');
    }
    const circlePane = map.getPane('stormCirclePane');
    if (circlePane) {
      circlePane.style.zIndex = '445'; // Above cone (440), below tracks (450)
    }

    // Storm marker pane - above tracks
    if (!map.getPane('stormMarkerPane')) {
      map.createPane('stormMarkerPane');
    }
    const markerPane = map.getPane('stormMarkerPane');
    if (markerPane) {
      markerPane.style.zIndex = '650'; // Above default markerPane (600)
    }
  }, [map]);
  return null;
}


// --- TỰ ĐỘNG ZOOM ---
function AutoFitBounds({
  bounds,
  onComplete,
}: {
  bounds: LatLngBounds | null;
  onComplete?: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      onComplete?.();
    }
  }, [bounds, map, onComplete]);
  return null;
}

interface WeatherMapProps {
  storms: Storm[];
  selectedStorm?: Storm;
  customPrediction?: PredictionResult | null;
  mapFocusBounds?: LatLngBounds | null;
  onMapFocusComplete?: () => void;
}

export default function WeatherMap({
  storms,
  selectedStorm,
  customPrediction,
  mapFocusBounds,
  onMapFocusComplete,
}: WeatherMapProps) {
  const [activeLayer, setActiveLayer] = useState<LayerType>('none');
  const [hoverValue, setHoverValue] = useState<{ type: string; value: number; unit: string; position: { x: number; y: number } } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [opacity, setOpacity] = useState(0.6);
  const [showTemperatureAnimation, setShowTemperatureAnimation] = useState(true);



  const { toasts, hideToast } = useToast();

  return (
    <div className="relative w-full h-full">
      <style>{markerCss}</style>

      <MapContainer
        center={VIETNAM_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
        minZoom={2}
        maxZoom={18}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <CreateStormPanes />
        <CreatePredictionPane />

        {/* === CÁC LỚP THỜI TIẾT (Windy) === */}
        <WindyLayer
          activeLayer={activeLayer}
          onHover={setHoverValue}
          onLoadingChange={setIsWeatherLoading}
        />

        {/* === HIỂN THỊ BÃO === */}
        <StormAnimation
          storms={storms}
          selectedStorm={selectedStorm}

        />

        {/* === DỰ ĐOÁN TÙY CHỈNH === */}
        {customPrediction && (customPrediction.forecast || customPrediction.path || []).length > 0 && (
          <>
            <Polyline
              positions={(customPrediction.forecast || customPrediction.path || []).map(p => [p.lat, p.lng])}
              pathOptions={{
                color: '#ff00ff',
                weight: 4,
                dashArray: '10, 10',
                opacity: 0.8,
                pane: 'customPredictionPane'
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">Predicted Path - {customPrediction.storm_name || 'Unknown Storm'}</h3>
                  <div className="space-y-1 text-sm mt-2">
                    <p>Total Distance: <b>{customPrediction.totalDistance.toFixed(2)} km</b></p>
                    <p>Lifespan: <b>{customPrediction.lifespan.toFixed(2)} hours</b></p>
                    <p>Forecast Points: <b>{(customPrediction.forecast || customPrediction.path || []).length}</b></p>
                  </div>
                </div>
              </Popup>
            </Polyline>

            {/* Start Marker */}
            <Tooltip
              permanent
              direction="top"
              position={[(customPrediction.forecast || customPrediction.path || [])[0]?.lat, (customPrediction.forecast || customPrediction.path || [])[0]?.lng]}
              className="custom-prediction-label"
            >
              Start
            </Tooltip>

            {/* End Marker */}
            <Tooltip
              permanent
              direction="bottom"
              position={[
                (customPrediction.forecast || customPrediction.path || [])[(customPrediction.forecast || customPrediction.path || []).length - 1]?.lat,
                (customPrediction.forecast || customPrediction.path || [])[(customPrediction.forecast || customPrediction.path || []).length - 1]?.lng
              ]}
              className="custom-prediction-label"
            >
              End
            </Tooltip>
          </>
        )}

        {/* === TỰ ĐỘNG ZOOM === */}
        <AutoFitBounds bounds={mapFocusBounds ?? null} onComplete={onMapFocusComplete} />

        {/* === OVERLAY THÔNG TIN === */}
        <WeatherOverlay
          type={activeLayer === 'temperature' || activeLayer === 'wind' ? (activeLayer as 'temperature' | 'wind') : 'none'}
          opacity={opacity}
          onHoverValue={setHoverValue}
          onLoadingChange={setIsWeatherLoading}
        />

        {/* === TILE LAYERS (Satellite, Radar) === */}
        {(activeLayer === 'satellite' || activeLayer === 'radar' || activeLayer === 'temperature') && (
          <WeatherLayerControl
            type={activeLayer}
            opacity={opacity}
          />
        )}

      </MapContainer>

      {/* === CONTROLS === */}
      <div className="absolute top-4 right-4 z-[1000]">
        <WeatherLayerControlPanel
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          opacity={opacity}
          onOpacityChange={setOpacity}
          showTemperatureAnimation={showTemperatureAnimation}
          onTemperatureAnimationChange={setShowTemperatureAnimation}
        />
      </div>

      {/* === LEGEND === */}
      {activeLayer === 'temperature' && (
        <div className="absolute bottom-8 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md z-[1000] text-gray-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-xs">Cold (&lt; 15°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-xs">Cool (15-25°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-xs">Warm (25-30°C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-xs">Hot (&gt; 30°C)</span>
            </div>
          </div>
        </div>
      )}

      {/* === PANEL RADAR === */}
      {activeLayer === 'radar' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] border border-gray-200">
          <p className="text-sm font-medium">Weather Radar Layer</p>
          <p className="text-xs text-gray-600 mt-1">Displays rain and clouds</p>
        </div>
      )}

      {/* === WEATHER VALUE HOVER TOOLTIP === */}
      <WeatherValueTooltip value={hoverValue} />

      {/* === LOADING INDICATOR FOR WEATHER DATA === */}
      {isWeatherLoading && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1001] border border-gray-200">
          <LoadingSpinner size="sm" message="Loading weather data..." />
        </div>
      )}

      {/* === TOAST NOTIFICATIONS === */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>
  );
}