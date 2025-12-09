/**
 * WindyModeToggle Component
 * 
 * Toggle switch for switching between gradient-colored tracks and simple white-dashed tracks.
 * Persists user preference to localStorage and provides smooth transition animations.
 * 
 * Requirements: 3.4
 */

import { useEffect, useState } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

const WINDY_MODE_STORAGE_KEY = 'storm-tracker-windy-mode';

/**
 * Props for WindyModeToggle component
 */
export interface WindyModeToggleProps {
  /** Current Windy mode state */
  isWindyMode: boolean;
  /** Callback when mode changes */
  onToggle: (enabled: boolean) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * WindyModeToggle Component
 * 
 * Provides a toggle switch for enabling/disabling Windy mode visualization.
 * When enabled, storm tracks render as white dashed lines instead of gradient colors.
 * 
 * Requirements:
 * - 3.4: Toggle switch UI component with state management and localStorage persistence
 */
export function WindyModeToggle({
  isWindyMode,
  onToggle,
  className = '',
}: WindyModeToggleProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [announcement, setAnnouncement] = useState<string>('');

  // Load saved preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(WINDY_MODE_STORAGE_KEY);
    if (savedMode !== null) {
      const enabled = savedMode === 'true';
      if (enabled !== isWindyMode) {
        onToggle(enabled);
      }
    }
  }, []);

  // Handle toggle with transition state
  const handleToggle = (checked: boolean) => {
    setIsTransitioning(true);
    
    // Save to localStorage
    localStorage.setItem(WINDY_MODE_STORAGE_KEY, String(checked));
    
    // Announce mode change for screen readers
    setAnnouncement(
      checked 
        ? 'Windy mode enabled. Storm tracks now display as white dashed lines.' 
        : 'Windy mode disabled. Storm tracks now display with gradient colors.'
    );
    
    // Trigger callback
    onToggle(checked);
    
    // Reset transition state after animation completes (300ms)
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <Switch
        id="windy-mode"
        checked={isWindyMode}
        onCheckedChange={handleToggle}
        disabled={isTransitioning}
        aria-label="Toggle Windy mode visualization"
      />
      <Label
        htmlFor="windy-mode"
        className="text-sm font-medium cursor-pointer select-none"
      >
        Windy Mode
      </Label>
      <div className="text-xs text-gray-500">
        {isWindyMode ? 'White dashed tracks' : 'Gradient colored tracks'}
      </div>
    </div>
  );
}

export default WindyModeToggle;
