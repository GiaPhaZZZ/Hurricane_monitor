/**
 * WindLayerController Component
 * 
 * Manages wind data fetching, loading states, and error handling for the wind particle layer.
 * Wraps WindParticleCanvas with loading indicators and error messages.
 * 
 * Requirements: 1.2, 11.4
 */

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import WindParticleCanvas from './WindParticleCanvas';
import { WindFieldManager } from './WindFieldManager';
import type { WindField } from './types';
import type { WindDataError } from './WindFieldManager';
import { Loader2, AlertCircle, WifiOff } from 'lucide-react';

export interface WindLayerControllerProps {
  isVisible: boolean;
  opacity?: number;
  colorScheme?: 'default' | 'monochrome';
  particleCount?: number;
  onError?: (error: WindDataError) => void;
}

/**
 * WindLayerController Component
 * 
 * Handles wind data lifecycle and displays appropriate UI states
 */
export default function WindLayerController({
  isVisible,
  opacity = 1.0,
  colorScheme = 'default',
  particleCount = 3000,
  onError,
}: WindLayerControllerProps) {
  const map = useMap();
  const [windField, setWindField] = useState<WindField | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WindDataError | null>(null);
  const windFieldManagerRef = useRef<WindFieldManager | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WindFieldManager
  useEffect(() => {
    windFieldManagerRef.current = new WindFieldManager();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Fetch wind data when visible or map bounds change
  useEffect(() => {
    if (!isVisible || !windFieldManagerRef.current) {
      return;
    }

    const fetchWindData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const bounds = map.getBounds();
        const windData = await windFieldManagerRef.current!.fetchWindData({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });

        if (windData) {
          setWindField(windData);
          
          // Check for errors even if we got data (e.g., using fallback)
          const lastError = windFieldManagerRef.current!.getLastError();
          if (lastError) {
            setError(lastError);
            onError?.(lastError);
          }
        } else {
          const fetchError: WindDataError = {
            type: 'fetch_failed',
            message: 'Failed to fetch wind data',
          };
          setError(fetchError);
          onError?.(fetchError);
        }
      } catch (err) {
        const fetchError: WindDataError = {
          type: 'fetch_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          originalError: err instanceof Error ? err : undefined,
        };
        setError(fetchError);
        onError?.(fetchError);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchWindData();

    // Set up refresh interval (every 10 minutes)
    refreshIntervalRef.current = setInterval(fetchWindData, 10 * 60 * 1000);

    // Refetch when map moves significantly
    const handleMoveEnd = () => {
      fetchWindData();
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isVisible, map, onError]);

  // Render loading indicator
  if (isLoading && !windField) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Loader2 className="animate-spin" size={20} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading wind data...</span>
        </div>
      </div>
    );
  }

  // Render error message (non-blocking, shows in corner)
  const renderErrorNotification = () => {
    if (!error) return null;

    let icon = <AlertCircle size={16} />;
    let message = error.message;
    let bgColor = 'rgba(255, 243, 205, 0.95)'; // Warning yellow
    let textColor = '#856404';

    if (error.type === 'offline') {
      icon = <WifiOff size={16} />;
      bgColor = 'rgba(220, 220, 220, 0.95)';
      textColor = '#333';
    } else if (error.type === 'api_key_missing') {
      message = 'Using demo wind data';
      bgColor = 'rgba(217, 237, 247, 0.95)'; // Info blue
      textColor = '#004085';
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: bgColor,
            color: textColor,
            borderRadius: '6px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            fontSize: '13px',
            maxWidth: '300px',
          }}
        >
          {icon}
          <span>{message}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderErrorNotification()}
      {windField && (
        <WindParticleCanvas
          windData={windField}
          isVisible={isVisible}
          opacity={opacity}
          colorScheme={colorScheme}
          particleCount={particleCount}
        />
      )}
    </>
  );
}
