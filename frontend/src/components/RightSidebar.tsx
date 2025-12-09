import { Wind, Thermometer, CloudRain, Satellite, Settings } from 'lucide-react';
import { type LayerType } from './WeatherLayerControl';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useEffect, useState } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import PreferencesModal from './PreferencesModal';

interface RightSidebarProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
  isWindyMode?: boolean;
  onWindyModeChange?: (value: boolean) => void;
  opacity?: number;
  onOpacityChange?: (value: number) => void;
  particleCount?: number;
  onParticleCountChange?: (count: number) => void;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  colorScheme?: 'default' | 'monochrome';
  onColorSchemeChange?: (scheme: 'default' | 'monochrome') => void;
}

interface LayerButton {
  id: LayerType | 'settings';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

const layerButtons: LayerButton[] = [
  { id: 'wind', icon: Wind, label: 'Wind', color: 'bg-blue-500' },
  { id: 'temperature', icon: Thermometer, label: 'Temperature', color: 'bg-orange-500' },
  { id: 'radar', icon: CloudRain, label: 'Radar', color: 'bg-green-500' },
  { id: 'satellite', icon: Satellite, label: 'Satellite', color: 'bg-purple-500' },
  { id: 'settings', icon: Settings, label: 'Settings', color: 'bg-gray-500' },
];

export default function RightSidebar({
  activeLayer,
  onLayerChange,
  isWindyMode = false,
  onWindyModeChange,
  opacity = 0.6,
  onOpacityChange,
  particleCount = 3000,
  onParticleCountChange,
  playbackSpeed = 1,
  onPlaybackSpeedChange,
  colorScheme = 'default',
  onColorSchemeChange,
}: RightSidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');
  const isMobile = useIsMobile();

  // Detect orientation for mobile layout
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Load layer preferences from localStorage
  useEffect(() => {
    const savedLayer = localStorage.getItem('activeLayer');
    if (savedLayer && savedLayer !== activeLayer) {
      onLayerChange(savedLayer as LayerType);
    }
  }, []);

  const handleLayerToggle = (layerId: LayerType | 'settings') => {
    if (layerId === 'settings') {
      // Open preferences modal instead of inline settings
      setShowPreferencesModal(true);
      setAnnouncement('Preferences modal opened');
      return;
    }

    // Toggle layer: if already active, turn it off
    const newLayer = activeLayer === layerId ? 'none' : layerId;
    onLayerChange(newLayer);
    
    // Announce layer change
    const layerNames: { [key in LayerType]: string } = {
      none: 'All layers off',
      wind: 'Wind layer',
      temperature: 'Temperature layer',
      radar: 'Radar layer',
      satellite: 'Satellite layer',
    };
    setAnnouncement(`${layerNames[newLayer]} ${newLayer === 'none' ? '' : 'activated'}`);
    
    // Save to localStorage
    localStorage.setItem('activeLayer', newLayer);
  };

  const isLayerActive = (layerId: LayerType | 'settings') => {
    if (layerId === 'settings') return showSettings;
    return activeLayer === layerId;
  };

  return (
    <>
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Layer Controls - Responsive Layout with Windy.com styling */}
      <nav 
        className={`
          fixed bg-white/95 backdrop-blur-md shadow-xl z-[1000]
          transition-all duration-300
          border border-gray-200/50
          ${isMobile && isPortrait 
            ? 'bottom-16 left-1/2 -translate-x-1/2 rounded-full px-4 py-2.5' 
            : isMobile 
              ? 'right-0 top-1/2 -translate-y-1/2 rounded-l-xl w-16 p-2'
              : 'right-0 top-1/2 -translate-y-1/2 rounded-l-xl w-[64px] p-[12px]'
          }
        `}
        aria-label="Weather layer controls"
        role="navigation"
      >
        <div 
          className={`
            flex gap-3
            ${isMobile && isPortrait ? 'flex-row' : 'flex-col'}
          `}
          role="group"
          aria-label="Layer toggle buttons"
        >
          {layerButtons.map((button) => {
            const Icon = button.icon;
            const isActive = isLayerActive(button.id as LayerType);
            
            return (
              <Tooltip.Root key={button.id} delayDuration={200}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => handleLayerToggle(button.id as LayerType)}
                    className={`
                      ${isMobile ? 'w-11 h-11 min-w-[44px] min-h-[44px]' : 'w-10 h-10'}
                      rounded-full
                      flex items-center justify-center
                      transition-all duration-300 ease-out
                      ${isActive 
                        ? `${button.color} text-white shadow-lg scale-110 rotate-0` 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 hover:shadow-md'
                      }
                      active:scale-95
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600
                    `}
                    aria-label={button.label}
                    aria-pressed={isActive}
                    tabIndex={0}
                  >
                    <Icon className={isMobile ? 'w-6 h-6' : 'w-5 h-5'} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side={isMobile && isPortrait ? 'top' : 'left'}
                    sideOffset={12}
                    className="
                      bg-gray-800 text-white text-xs font-medium
                      px-3 py-1.5 rounded-lg 
                      shadow-xl z-[1001]
                      animate-in fade-in-0 zoom-in-95
                      border border-gray-700
                    "
                  >
                    {button.label}
                    <Tooltip.Arrow className="fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      </nav>

      {/* Preferences Modal */}
      <PreferencesModal
        open={showPreferencesModal}
        onOpenChange={setShowPreferencesModal}
        particleCount={particleCount}
        onParticleCountChange={onParticleCountChange}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={onPlaybackSpeedChange}
        colorScheme={colorScheme}
        onColorSchemeChange={onColorSchemeChange}
      />

      {/* Quick Settings Panel with smooth transitions and Windy.com styling */}
      {showSettings && (
        <div 
          className={`
            fixed bg-white/98 backdrop-blur-md
            rounded-xl shadow-2xl
            z-[999]
            p-5
            animate-in fade-in-0 duration-300 ease-out
            border border-gray-200/60
            ${isMobile && isPortrait 
              ? 'bottom-32 left-1/2 -translate-x-1/2 w-72 slide-in-from-bottom-5' 
              : isMobile 
                ? 'right-[70px] top-1/2 -translate-y-1/2 w-56 slide-in-from-right-5'
                : 'right-[76px] top-1/2 -translate-y-1/2 w-72 slide-in-from-right-5'
            }
          `}
          role="dialog"
          aria-labelledby="settings-heading"
          aria-modal="false"
        >
          <h3 className="font-semibold text-base mb-4 text-gray-800" id="settings-heading">Settings</h3>
          
          {/* Windy Mode Toggle */}
          {onWindyModeChange && (
            <div className="mb-5 pb-5 border-b border-gray-200">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover:text-blue-600">Windy Mode</span>
                <input
                  type="checkbox"
                  checked={isWindyMode}
                  onChange={(e) => onWindyModeChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:scale-110 cursor-pointer"
                  aria-label="Toggle Windy Mode"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Simplified white-dashed track visualization
              </p>
            </div>
          )}

          {/* Opacity Control */}
          {activeLayer !== 'none' && onOpacityChange && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                <span>Layer Opacity</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {(opacity * 100).toFixed(0)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150"
                aria-label="Layer opacity"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${opacity * 100}%, #e5e7eb ${opacity * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
          )}

          {/* Advanced Preferences Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowSettings(false);
                setShowPreferencesModal(true);
              }}
              className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Advanced Preferences
            </button>
          </div>
        </div>
      )}
    </>
  );
}
