import { type LayerType } from './WeatherLayerControl';
import { WindyModeToggle } from './storm/WindyModeToggle';

interface WeatherLayerControlPanelProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  showTemperatureAnimation: boolean;
  onTemperatureAnimationChange: (value: boolean) => void;
  isWindyMode?: boolean;
  onWindyModeChange?: (value: boolean) => void;
}

export default function WeatherLayerControlPanel({
  activeLayer,
  onLayerChange,
  opacity,
  onOpacityChange,
  showTemperatureAnimation: _showTemperatureAnimation,
  onTemperatureAnimationChange: _onTemperatureAnimationChange,
  isWindyMode = false,
  onWindyModeChange,
}: WeatherLayerControlPanelProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium mb-1">Map Overlay</p>
        <div className="grid grid-cols-2 gap-1">
          {(['none', 'satellite'] as LayerType[]).map((layer) => (
            <button
              key={layer}
              onClick={() => onLayerChange(layer)}
              className={`px-2 py-1 text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                activeLayer === layer
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              aria-label={`Select ${layer} layer`}
              aria-pressed={activeLayer === layer}
            >
              {layer === 'none' && 'Default'}
              {layer === 'satellite' && 'Satellite'}
            </button>
          ))}
        </div>
      </div>

      {activeLayer !== 'none' && (
        <div>
          <p className="text-xs font-medium mb-1">Opacity</p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            aria-label="Layer opacity"
          />
          <span className="text-xs text-gray-600">{(opacity * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* Windy Mode Toggle */}
      {onWindyModeChange && (
        <div className="pt-2 border-t border-gray-300">
          <WindyModeToggle
            isWindyMode={isWindyMode}
            onToggle={onWindyModeChange}
          />
        </div>
      )}
    </div>
  );
}