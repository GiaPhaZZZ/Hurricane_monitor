/**
 * StormTooltip Component
 * 
 * Displays enhanced storm information tooltip with dark styling.
 * Features hover delays, arrow pointer, and comprehensive storm metrics.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { Tooltip } from 'react-leaflet';
import type { StormPoint } from './HurricaneMarker';

/**
 * Props for StormTooltip component
 */
export interface StormTooltipProps {
  /** Storm name to display */
  stormName: string;
  /** Storm data point with metrics */
  stormData: StormPoint;
  /** Whether tooltip is permanently open (optional) */
  permanent?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Current timeline position (optional) */
  currentTime?: number;
  /** Whether this is historical data */
  isHistorical?: boolean;
  /** Whether this is forecast data */
  isForecast?: boolean;
}

/**
 * Format timestamp relative to current timeline position
 * Requirements: 5.1, 5.8 - Format timestamps relative to timeline
 */
function formatRelativeTimestamp(timestamp: number, currentTime?: number): string {
  const date = new Date(timestamp);
  const formatted = date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  if (!currentTime) {
    return formatted;
  }
  
  const diff = timestamp - currentTime;
  const hours = Math.abs(Math.round(diff / (1000 * 60 * 60)));
  
  if (Math.abs(diff) < 1000 * 60 * 30) { // Within 30 minutes
    return `${formatted} (hiện tại)`;
  } else if (diff > 0) {
    return `${formatted} (+${hours}h)`;
  } else {
    return `${formatted} (-${hours}h)`;
  }
}

/**
 * StormTooltip Component
 * 
 * Displays comprehensive storm information in a styled tooltip.
 * 
 * Requirements:
 * - 5.1, 5.8: Display storm data at selected timeline position with relative timestamps
 * - 7.1: Display tooltip within 200ms of hover (handled by CSS transition)
 * - 7.2: Show storm name, category, wind speed, pressure, and timestamp
 * - 7.3: Position 10px above marker with centered alignment
 * - 7.4: Dark background (rgba(30, 30, 30, 0.95)), white text, 8px border radius
 * - 7.5: Hide tooltip after 150ms when cursor leaves (handled by CSS transition)
 */
export function StormTooltip({
  stormName,
  stormData,
  permanent = false,
  className = '',
  currentTime,
  isHistorical = false,
  isForecast = false,
}: StormTooltipProps) {
  // Determine data type label
  let dataTypeLabel = '';
  let dataTypeClass = '';
  
  if (isHistorical) {
    dataTypeLabel = 'Lịch sử';
    dataTypeClass = 'historical';
  } else if (isForecast) {
    dataTypeLabel = 'Dự báo';
    dataTypeClass = 'forecast';
  }
  
  return (
    <>
      <Tooltip
        direction="top"
        offset={[0, -10]}
        opacity={1}
        permanent={permanent}
        className={`storm-tooltip ${className}`}
      >
        <div className="storm-tooltip-content">
          <div className="storm-tooltip-header">
            <div className="storm-tooltip-name">{stormName}</div>
            {dataTypeLabel && (
              <div className={`storm-tooltip-type ${dataTypeClass}`}>
                {dataTypeLabel}
              </div>
            )}
          </div>
          <div className="storm-tooltip-category">
            <span className="storm-tooltip-label">Cấp độ:</span> {stormData.category}
          </div>
          <div className="storm-tooltip-wind">
            <span className="storm-tooltip-label">Tốc độ gió:</span> {stormData.windSpeed.toFixed(2)} km/h
          </div>
          <div className="storm-tooltip-pressure">
            <span className="storm-tooltip-label">Áp suất:</span> {stormData.pressure.toFixed(2)} hPa
          </div>
          <div className="storm-tooltip-time">
            <span className="storm-tooltip-label">Thời gian:</span> {formatRelativeTimestamp(stormData.timestamp, currentTime)}
          </div>
        </div>
      </Tooltip>

      <style>{`
        /* Base tooltip styling */
        .storm-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Remove default Leaflet tooltip styles */
        .storm-tooltip::before {
          display: none !important;
        }

        /* Content container with dark background */
        .storm-tooltip-content {
          background: rgba(30, 30, 30, 0.95);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          font-size: 13px;
          line-height: 1.5;
          min-width: 200px;
          position: relative;
          transition: opacity 200ms ease-in-out;
        }

        /* Arrow pointer using pseudo-element */
        .storm-tooltip-content::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(30, 30, 30, 0.95);
        }

        /* Header with name and type label */
        .storm-tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          gap: 8px;
        }

        /* Storm name styling */
        .storm-tooltip-name {
          font-weight: 700;
          font-size: 15px;
          color: #ffffff;
          flex: 1;
        }

        /* Data type label (Historical/Forecast) */
        .storm-tooltip-type {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .storm-tooltip-type.historical {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        .storm-tooltip-type.forecast {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.4);
        }

        /* Metric rows */
        .storm-tooltip-category,
        .storm-tooltip-wind,
        .storm-tooltip-pressure,
        .storm-tooltip-time {
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .storm-tooltip-time {
          margin-bottom: 0;
          font-size: 12px;
          color: #d1d5db;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Label styling */
        .storm-tooltip-label {
          color: #9ca3af;
          font-weight: 500;
        }

        /* Hover delays - show after 200ms */
        .leaflet-tooltip {
          transition: opacity 200ms ease-in-out 200ms;
        }

        /* Hide delay - hide after 150ms */
        .leaflet-tooltip.leaflet-tooltip-top {
          transition: opacity 150ms ease-in-out 150ms;
        }

        /* Ensure tooltip is centered above marker */
        .leaflet-tooltip-top {
          margin-top: -10px;
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .storm-tooltip-content {
            min-width: 180px;
            font-size: 12px;
            padding: 10px 14px;
          }

          .storm-tooltip-name {
            font-size: 14px;
          }
        }
      `}</style>
    </>
  );
}

export default StormTooltip;
