import { Card, CardContent } from './ui/card';
import { Cloud, Sun, Wind } from 'lucide-react';

interface DailyForecast {
  day: string;
  icon: 'sun' | 'cloud' | 'wind';
  temp: number;
}

// Dữ liệu mô phỏng, bạn có thể thay thế bằng dữ liệu từ API
const mockForecast: DailyForecast[] = [
  { day: 'Thứ Hai', icon: 'sun', temp: 32 },
  { day: 'Thứ Ba', icon: 'cloud', temp: 30 },
  { day: 'Thứ Tư', icon: 'wind', temp: 28 },
  { day: 'Thứ Năm', icon: 'sun', temp: 31 },
  { day: 'Thứ Sáu', icon: 'cloud', temp: 29 },
  { day: 'Thứ Bảy', icon: 'sun', temp: 30 },
  { day: 'Chủ Nhật', icon: 'wind', temp: 28 },
];

const getIcon = (iconType: 'sun' | 'cloud' | 'wind') => {
  switch (iconType) {
    case 'sun': return <Sun className="h-6 w-6 text-yellow-500" />;
    case 'cloud': return <Cloud className="h-6 w-6 text-gray-400" />;
    case 'wind': return <Wind className="h-6 w-6 text-blue-400" />;
  }
};

export default function WeeklyForecast() {
  return (
    <Card className="h-full">
      <CardContent className="flex items-center justify-between p-4 space-x-2">
        {mockForecast.map((day, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 text-center text-sm">
            <span>{day.day}</span>
            {getIcon(day.icon)}
            <span className="font-semibold text-lg">{day.temp}°C</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}