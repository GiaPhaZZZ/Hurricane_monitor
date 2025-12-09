import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { useIsMobile } from '../../hooks/use-mobile';
import type { Storm } from '../../lib/stormData';

interface TimelineSliderProps {
  storms: Storm[];
  currentTime: number;
  onTimeChange: (time: number) => void;
  isPlaying?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  isLoading?: boolean;
}

export default function TimelineSlider({
  storms,
  currentTime,
  onTimeChange,
  isPlaying = false,
  onPlayingChange,
  playbackSpeed = 1,
  onSpeedChange,
  isLoading = false,
}: TimelineSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');
  const sliderRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const lastAnnouncedTimeRef = useRef<number>(0);
  const isMobile = useIsMobile();

  // Calculate time range from storm data
  const { startTime, endTime, timeMarkers } = useTimeRange(storms);

  // Available playback speeds
  const speedOptions = [0.5, 1, 2, 4];

  // Handle playback animation
  useEffect(() => {
    if (!isPlaying || !startTime || !endTime) {
      lastUpdateTimeRef.current = Date.now();
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      // 1 hour per second at 1x speed
      const timeIncrement = (deltaTime / 1000) * 3600 * 1000 * playbackSpeed;
      const newTime = currentTime + timeIncrement;
      
      if (newTime >= endTime) {
        onTimeChange(endTime);
        onPlayingChange?.(false); // Auto-stop at end
        return;
      }
      
      onTimeChange(newTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, startTime, endTime, playbackSpeed, onTimeChange, onPlayingChange]);

  // Convert time to position percentage
  const timeToPosition = useCallback((time: number): number => {
    if (!startTime || !endTime) return 0;
    return ((time - startTime) / (endTime - startTime)) * 100;
  }, [startTime, endTime]);

  // Convert position to time
  const positionToTime = useCallback((positionX: number): number => {
    if (!sliderRef.current || !startTime || !endTime) return startTime || 0;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, positionX / rect.width));
    return startTime + (endTime - startTime) * percentage;
  }, [startTime, endTime]);

  // Handle mouse down on slider
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    // Pause playback when user interacts with timeline
    if (isPlaying) {
      onPlayingChange?.(false);
    }
    
    setIsDragging(true);
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = positionToTime(x);
    onTimeChange(newTime);
  };

  // Toggle play/pause
  const handlePlayPause = () => {
    if (currentTime >= endTime!) {
      // If at end, restart from beginning
      onTimeChange(startTime!);
      onPlayingChange?.(true);
      setAnnouncement('Timeline playback started from beginning');
    } else {
      const newPlayingState = !isPlaying;
      onPlayingChange?.(newPlayingState);
      setAnnouncement(newPlayingState ? 'Timeline playback started' : 'Timeline playback paused');
    }
  };

  // Change playback speed
  const handleSpeedChange = () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    const newSpeed = speedOptions[nextIndex];
    onSpeedChange?.(newSpeed);
    setAnnouncement(`Playback speed changed to ${newSpeed}x`);
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newTime = positionToTime(x);
        onTimeChange(newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, positionToTime, onTimeChange]);

  // Handle hover for tooltip
  const handleMouseHover = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = positionToTime(x);
    
    setHoverTime(time);
    setHoverPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoverPosition(null);
  };

  // Handle orientation changes - preserve timeline state
  // Requirements: 9.8 - Preserve timeline state during rotation
  useEffect(() => {
    let orientationTimeout: NodeJS.Timeout;
    
    const handleOrientationChange = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(() => {
        // Timeline state is preserved in parent component
        // Just force a re-render to update layout
        if (sliderRef.current) {
          // Trigger recalculation by getting bounds (forces layout recalc)
          sliderRef.current.getBoundingClientRect();
        }
      }, 300);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(orientationTimeout);
    };
  }, []);

  // Announce timeline position changes for screen readers
  // Requirements: 10.8
  useEffect(() => {
    // Only announce if time changed significantly (more than 30 minutes) and not during playback
    const timeDiff = Math.abs(currentTime - lastAnnouncedTimeRef.current);
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (!isPlaying && timeDiff >= thirtyMinutes) {
      lastAnnouncedTimeRef.current = currentTime;
      setAnnouncement(`Timeline position: ${formatDateTime(currentTime)}`);
    }
  }, [currentTime, isPlaying]);

  // Keyboard shortcuts for timeline control
  // Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!startTime || !endTime) return;

      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      switch (e.key) {
        case ' ': // Space bar - play/pause
          e.preventDefault();
          handlePlayPause();
          break;
        
        case 'ArrowLeft': // Left arrow - move backward 1 hour
          e.preventDefault();
          const newTimeBackward = Math.max(startTime, currentTime - oneHour);
          onTimeChange(newTimeBackward);
          setAnnouncement(`Moved backward to ${formatDateTime(newTimeBackward)}`);
          if (isPlaying) {
            onPlayingChange?.(false); // Pause when manually navigating
          }
          break;
        
        case 'ArrowRight': // Right arrow - move forward 1 hour
          e.preventDefault();
          const newTimeForward = Math.min(endTime, currentTime + oneHour);
          onTimeChange(newTimeForward);
          setAnnouncement(`Moved forward to ${formatDateTime(newTimeForward)}`);
          if (isPlaying) {
            onPlayingChange?.(false); // Pause when manually navigating
          }
          break;
        
        case 'Home': // Home - jump to beginning
          e.preventDefault();
          onTimeChange(startTime);
          setAnnouncement(`Jumped to timeline start: ${formatDateTime(startTime)}`);
          if (isPlaying) {
            onPlayingChange?.(false);
          }
          break;
        
        case 'End': // End - jump to end
          e.preventDefault();
          onTimeChange(endTime);
          setAnnouncement(`Jumped to timeline end: ${formatDateTime(endTime)}`);
          if (isPlaying) {
            onPlayingChange?.(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentTime, startTime, endTime, isPlaying, onTimeChange, onPlayingChange]);

  // Show skeleton loader while loading storm data
  if (isLoading || (!startTime || !endTime)) {
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-[1000] p-4">
        <div className="max-w-[90%] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const currentPosition = timeToPosition(currentTime);

  // Mobile: Render collapsible bottom drawer
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[1000]">
        {/* Screen reader announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>

        {/* Expand/Collapse Button */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-t-lg shadow-lg min-h-[44px] min-w-[44px] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all duration-200 hover:bg-black/90 hover:shadow-xl hover:-translate-y-0.5"
            aria-label="Expand timeline"
          >
            <ChevronUp className="h-5 w-5 transition-transform duration-200" />
            <span className="text-sm">{formatDateTime(currentTime)}</span>
          </button>
        )}

        {/* Collapsible Drawer - Enhanced slide-in animation */}
        {isExpanded && (
          <div className="bg-black/90 backdrop-blur-sm p-4 animate-in slide-in-from-bottom-5 duration-300 ease-out">
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/90"
              aria-label="Collapse timeline"
            >
              <ChevronDown className="h-5 w-5" />
            </button>

            {/* Playback controls */}
            <div className="flex items-center gap-3 mb-4">
              {/* Play/Pause button - 44px touch target with smooth transitions */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/80 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
              >
                {isPlaying ? <Pause className="h-6 w-6 transition-transform duration-200" /> : <Play className="h-6 w-6 ml-0.5 transition-transform duration-200" />}
              </Button>

              {/* Speed selector - 44px touch target with smooth transitions */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSpeedChange}
                className="h-11 px-4 min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/80 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label={`Playback speed ${playbackSpeed}x`}
              >
                {playbackSpeed}x
              </Button>

              {/* Time range display */}
              <div className="text-white/70 text-xs ml-2">
                {formatTimeMarker(startTime)} - {formatTimeMarker(endTime)}
              </div>
            </div>

            {/* Timeline bar */}
            <div className="relative">
              {/* Time markers */}
              <div className="flex justify-between mb-2 text-xs text-white/70">
                {timeMarkers.map((marker, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center"
                    style={{ position: 'absolute', left: `${timeToPosition(marker.time)}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-px h-2 bg-white/50 mb-1"></div>
                    <span>{marker.label}</span>
                  </div>
                ))}
              </div>

              {/* Slider track - increased height for touch */}
              <div
                ref={sliderRef}
                className="relative h-3 bg-white/20 rounded-full cursor-pointer mt-8"
                onMouseDown={handleMouseDown}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!sliderRef.current) return;
                  const rect = sliderRef.current.getBoundingClientRect();
                  const x = touch.clientX - rect.left;
                  const newTime = positionToTime(x);
                  onTimeChange(newTime);
                  setIsDragging(true);
                }}
                onTouchMove={(e) => {
                  if (!isDragging || !sliderRef.current) return;
                  const touch = e.touches[0];
                  const rect = sliderRef.current.getBoundingClientRect();
                  const x = touch.clientX - rect.left;
                  const newTime = positionToTime(x);
                  onTimeChange(newTime);
                }}
                onTouchEnd={() => setIsDragging(false)}
              >
                {/* Progress bar */}
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                  style={{ width: `${currentPosition}%` }}
                />

                {/* Current time indicator - larger for touch */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 min-h-[44px] min-w-[44px] bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center"
                  style={{ left: `${currentPosition}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>

                {/* Vertical indicator line */}
                <div
                  className="absolute bottom-full mb-2 w-px h-8 bg-white/70"
                  style={{ left: `${currentPosition}%`, transform: 'translateX(-50%)' }}
                />
              </div>

              {/* Current time display */}
              <div className="text-center text-white text-sm mt-3">
                {formatDateTime(currentTime)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Original layout with slide-in animation and Windy.com styling
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/85 to-transparent backdrop-blur-md z-[1000] p-5 pb-6 animate-in slide-in-from-bottom-3 duration-500 ease-out border-t border-white/10">
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="max-w-[90%] mx-auto">
        {/* Playback controls */}
        <div className="flex items-center gap-3 mb-4">
          {/* Play/Pause button with smooth hover effects and loading indicator */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/80 transition-all duration-200 hover:scale-110 active:scale-95 relative"
            aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
          >
            {isPlaying ? <Pause className="h-5 w-5 transition-transform duration-200" /> : <Play className="h-5 w-5 ml-0.5 transition-transform duration-200" />}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white/80 animate-spin" />
            )}
          </Button>

          {/* Speed selector with smooth hover effects */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeedChange}
            className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/80 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={`Playback speed ${playbackSpeed}x`}
          >
            {playbackSpeed}x
          </Button>

          {/* Time range display */}
          <div className="text-white/70 text-xs ml-2">
            {formatTimeMarker(startTime)} - {formatTimeMarker(endTime)}
          </div>
        </div>

        {/* Timeline bar */}
        <div className="relative">
          {/* Time markers */}
          <div className="flex justify-between mb-2 text-xs text-white/70">
            {timeMarkers.map((marker, index) => (
              <div
                key={index}
                className="flex flex-col items-center"
                style={{ position: 'absolute', left: `${timeToPosition(marker.time)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-2 bg-white/50 mb-1"></div>
                <span>{marker.label}</span>
              </div>
            ))}
          </div>

          {/* Slider track with enhanced Windy.com styling */}
          <div
            ref={sliderRef}
            className="relative h-2.5 bg-white/15 rounded-full cursor-pointer mt-8 hover:bg-white/20 transition-colors duration-200"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseHover}
            onMouseLeave={handleMouseLeave}
          >
            {/* Progress bar with gradient */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-lg"
              style={{ width: `${currentPosition}%` }}
            />

            {/* Current time indicator with enhanced styling */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-xl cursor-grab active:cursor-grabbing border-2 border-blue-500 hover:scale-110 transition-transform duration-150"
              style={{ left: `${currentPosition}%`, transform: 'translate(-50%, -50%)' }}
            >
              <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
            </div>

            {/* Vertical indicator line with glow */}
            <div
              className="absolute bottom-full mb-2 w-0.5 h-10 bg-gradient-to-t from-white/80 to-transparent"
              style={{ left: `${currentPosition}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          {/* Hover tooltip with Windy.com styling */}
          {hoverTime !== null && hoverPosition && (
            <div
              className="fixed bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl pointer-events-none z-[1100] border border-gray-200"
              style={{
                left: hoverPosition.x,
                top: hoverPosition.y - 35,
                transform: 'translateX(-50%)',
              }}
            >
              {formatDateTime(hoverTime)}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
            </div>
          )}
        </div>

        {/* Current time display with enhanced styling */}
        <div className="text-center text-white/90 text-sm font-medium mt-3 tracking-wide">
          {formatDateTime(currentTime)}
        </div>
      </div>
    </div>
  );
}

// Hook to calculate time range and markers from storm data
// Requirements: 2.3, 2.5 - Manage timeline bounds when storms have different ranges
function useTimeRange(storms: Storm[]) {
  const [timeRange, setTimeRange] = useState<{
    startTime: number | null;
    endTime: number | null;
    timeMarkers: Array<{ time: number; label: string }>;
  }>({
    startTime: null,
    endTime: null,
    timeMarkers: [],
  });

  useEffect(() => {
    if (storms.length === 0) {
      setTimeRange({ startTime: null, endTime: null, timeMarkers: [] });
      return;
    }

    // Find earliest and latest timestamps across all storms
    // Handle storms with incomplete time data gracefully
    let minTime = Infinity;
    let maxTime = -Infinity;
    let validStormCount = 0;

    storms.forEach(storm => {
      // Validate storm data
      if (!storm.currentPosition || !storm.currentPosition.timestamp) {
        return;
      }

      const allPoints = [
        ...storm.historical,
        storm.currentPosition,
        ...storm.forecast
      ].filter(point => point && point.timestamp); // Filter out invalid points

      if (allPoints.length === 0) {
        return;
      }

      validStormCount++;

      allPoints.forEach(point => {
        if (point.timestamp) {
          minTime = Math.min(minTime, point.timestamp);
          maxTime = Math.max(maxTime, point.timestamp);
        }
      });
    });

    // If no valid storms, return empty range
    if (validStormCount === 0 || minTime === Infinity || maxTime === -Infinity) {
      setTimeRange({ startTime: null, endTime: null, timeMarkers: [] });
      return;
    }

    // Generate time markers at 3-hour intervals
    const markers: Array<{ time: number; label: string }> = [];
    const threeHours = 3 * 60 * 60 * 1000;
    
    // Round start time down to nearest 3-hour mark
    const startTime = Math.floor(minTime / threeHours) * threeHours;
    const endTime = Math.ceil(maxTime / threeHours) * threeHours;

    // Limit number of markers to avoid clutter (max 20 markers)
    const totalDuration = endTime - startTime;
    let markerInterval = threeHours;
    
    if (totalDuration / threeHours > 20) {
      // Use 6-hour intervals if timeline is too long
      markerInterval = 6 * 60 * 60 * 1000;
    }

    for (let time = startTime; time <= endTime; time += markerInterval) {
      markers.push({
        time,
        label: formatTimeMarker(time),
      });
    }

    setTimeRange({ startTime, endTime, timeMarkers: markers });
  }, [storms]);

  return timeRange;
}

// Format time for markers (HH:MM)
function formatTimeMarker(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Format full date and time for tooltip
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
