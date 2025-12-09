import { TileLayer } from 'react-leaflet';

export type LayerType = 'none' | 'satellite' | 'temperature' | 'radar' | 'wind';

interface WeatherLayerControlProps {
  type: LayerType;
  opacity: number;
}

const WeatherLayerControl: React.FC<WeatherLayerControlProps> = ({ type, opacity }) => {
  if (type === 'none') return null;

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  let url = '';
  let attribution = '';

  switch (type) {
    case 'temperature':
      url = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`;
      attribution = '© OpenWeatherMap';
      break;
    case 'radar':
      url = `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`;
      attribution = '© OpenWeatherMap';
      break;
    case 'satellite':
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '© ESRI';
      break;
  }

  if (!url) return null;

  return (
    <TileLayer
      key={`weather-layer-${type}`}
      url={url}
      attribution={attribution}
      opacity={opacity}
      zIndex={10}
    />
  );
};

export default WeatherLayerControl;