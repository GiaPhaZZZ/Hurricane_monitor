import { useEffect, useState } from 'react';

interface WeatherValueTooltipProps {
  value: {
    type: string;
    value: number;
    unit: string;
    position: { x: number; y: number };
  } | null;
}

export default function WeatherValueTooltip({ value }: WeatherValueTooltipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (value) {
      setVisible(true);
    } else {
      // Delay hiding to avoid flicker
      const timeout = setTimeout(() => setVisible(false), 100);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  if (!visible || !value) return null;

  const label = value.type === 'temperature' ? 'Temperature' : 'Wind Speed';

  return (
    <div
      className="fixed bg-white text-black text-xs px-3 py-2 rounded-md shadow-lg pointer-events-none z-[1100] border border-gray-200"
      style={{
        left: value.position.x + 10,
        top: value.position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="font-medium">{label}</div>
      <div className="text-gray-700">
        {value.value.toFixed(1)} {value.unit}
      </div>
    </div>
  );
}
