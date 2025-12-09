import { ArrowUpRight, CloudRain } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { type Storm } from '../lib/stormData';

interface StormTrackerProps {
  storms: Storm[];
  selectedStorm?: Storm;
  onStormSelect: (storm: Storm) => void;
}

export default function StormTracker({ storms, selectedStorm, onStormSelect }: StormTrackerProps) {
  if (storms.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <CloudRain className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Hiện không có cơn bão nào được dự báo</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Các cơn bão sắp tới
      </h3>
      <div className="space-y-2">
        {storms.map(storm => (
          <Card
            key={storm.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedStorm?.id === storm.id
                ? 'border-blue-500 ring-2 ring-blue-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
            onClick={() => onStormSelect(storm)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900">
                  <CloudRain className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{storm.nameVi}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Updated: {new Date(storm.lastPointTime).toLocaleString('en-US')}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <ArrowUpRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}