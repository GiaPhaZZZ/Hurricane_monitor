import { MapPin, Wind, Thermometer, Clock, TrendingUp } from 'lucide-react';
import { getCategoryColor, type Storm, type StormPoint } from '../lib/stormData';
import { Card, CardContent } from './ui/card';

interface StormInfoProps {
  storm: Storm;
}

function WeatherIcon({ category }: { category: string }) {
  const color = getCategoryColor(category);
  return (
    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
      <div className="w-6 h-6 rounded-full border-2 border-black" style={{ backgroundColor: color }}></div>
    </div>
  );
}

function StormDetailsCard({ title, icon, value, unit, color }: {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center p-4 text-center">
      <div className="flex items-center gap-2 mb-2" style={{ color: color }}>
        {icon}
        <h5 className="text-sm font-semibold">{title}</h5>
      </div>
      <p className="text-2xl font-bold">{typeof value === 'number' ? value.toFixed(2) : value}</p>
      <p className="text-sm text-muted-foreground">{unit}</p>
    </Card>
  );
}

function ForecastPoint({ point }: { point: StormPoint }) {
  return (
    <div className="relative pl-6 pb-6 border-l-2 border-dashed border-gray-300 last:border-0 dark:border-gray-700">
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900"></div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {new Date(point.timestamp).toLocaleString()}
        </span>
        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
          <span>Lat: {point.lat.toFixed(2)}</span>
          <span>Lng: {point.lng.toFixed(2)}</span>
          <span>Wind: {point.windSpeed.toFixed(0)} km/h</span>
        </div>
      </div>
    </div>
  );
}

export default function StormInfo({ storm }: StormInfoProps) {
  if (!storm) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            {storm.nameVi}
            <span className="text-sm font-normal text-gray-500">({storm.nameInt})</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded text-xs font-medium text-white`} style={{ backgroundColor: getCategoryColor(storm.currentPosition.category) }}>
              {storm.currentPosition.category}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated: {new Date(storm.currentPosition.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <WeatherIcon category={storm.currentPosition.category} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <StormDetailsCard
          title="Wind Speed"
          icon={<Wind className="w-4 h-4" />}
          value={storm.currentPosition.windSpeed}
          unit="km/h"
          color="#3b82f6"
        />
        <StormDetailsCard
          title="Pressure"
          icon={<Thermometer className="w-4 h-4" />}
          value={storm.currentPosition.pressure}
          unit="hPa"
          color="#ef4444"
        />
      </div>

      {/* Location */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-full dark:bg-gray-800">
              <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Current Location</p>
              <p className="font-semibold">{storm.currentPosition.lat.toFixed(2)}°N, {storm.currentPosition.lng.toFixed(2)}°E</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast */}
      {storm.forecast.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Forecast Path
          </h3>
          <div className="pl-2">
            {storm.forecast.map((point, index) => (
              <ForecastPoint key={index} point={point} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}