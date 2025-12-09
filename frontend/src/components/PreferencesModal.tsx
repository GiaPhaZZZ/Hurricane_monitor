/**
 * PreferencesModal Component
 * 
 * Advanced user preferences and settings panel
 * Requirements: 7.4, 7.5
 */

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogBody,
  DialogFooter 
} from './ui/dialog'
import { Button } from './ui/button'
import { Wind, Palette, Gauge, Clock } from 'lucide-react'

interface PreferencesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  particleCount?: number
  onParticleCountChange?: (count: number) => void
  playbackSpeed?: number
  onPlaybackSpeedChange?: (speed: number) => void
  colorScheme?: 'default' | 'monochrome'
  onColorSchemeChange?: (scheme: 'default' | 'monochrome') => void
}

interface Preferences {
  particleCount: number
  playbackSpeed: number
  colorScheme: 'default' | 'monochrome'
  autoSaveEnabled: boolean
}

const PARTICLE_PRESETS = [
  { label: 'Low (1000)', value: 1000, description: 'Best for older devices' },
  { label: 'Medium (2500)', value: 2500, description: 'Balanced performance' },
  { label: 'High (5000)', value: 5000, description: 'Best visual quality' },
  { label: 'Ultra (8000)', value: 8000, description: 'Maximum particles' },
]

const SPEED_PRESETS = [
  { label: '0.5x', value: 0.5, description: 'Slow motion' },
  { label: '1x', value: 1, description: 'Normal speed' },
  { label: '2x', value: 2, description: 'Fast forward' },
  { label: '4x', value: 4, description: 'Very fast' },
]

const COLOR_SCHEMES = [
  { 
    id: 'default' as const, 
    label: 'Default', 
    description: 'Velocity-based colors',
    preview: 'linear-gradient(to right, #60a5fa, #22c55e, #facc15, #ef4444)'
  },
  { 
    id: 'monochrome' as const, 
    label: 'Monochrome', 
    description: 'White particles only',
    preview: 'linear-gradient(to right, #ffffff, #e5e7eb)'
  },
]

export default function PreferencesModal({
  open,
  onOpenChange,
  particleCount = 3000,
  onParticleCountChange,
  playbackSpeed = 1,
  onPlaybackSpeedChange,
  colorScheme = 'default',
  onColorSchemeChange,
}: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    particleCount,
    playbackSpeed,
    colorScheme,
    autoSaveEnabled: true,
  })

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userPreferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const savePreferences = () => {
    if (preferences.autoSaveEnabled) {
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
    }
    
    // Apply preferences
    onParticleCountChange?.(preferences.particleCount)
    onPlaybackSpeedChange?.(preferences.playbackSpeed)
    onColorSchemeChange?.(preferences.colorScheme)
    
    onOpenChange(false)
  }

  const resetToDefaults = () => {
    const defaults: Preferences = {
      particleCount: 3000,
      playbackSpeed: 1,
      colorScheme: 'default',
      autoSaveEnabled: true,
    }
    setPreferences(defaults)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>User Preferences</DialogTitle>
          <DialogDescription>
            Customize your storm tracking experience
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Particle Count Override */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Wind Particle Count</h3>
            </div>
            <p className="text-sm text-gray-600">
              Adjust the number of animated particles. Higher values provide better visualization but may impact performance.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {PARTICLE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setPreferences(prev => ({ ...prev, particleCount: preset.value }))}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all duration-200
                    ${preferences.particleCount === preset.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{preset.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>

            {/* Custom particle count slider */}
            <div className="pt-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Custom: {preferences.particleCount} particles
              </label>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={preferences.particleCount}
                onChange={(e) => setPreferences(prev => ({ ...prev, particleCount: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Playback Speed Presets */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Playback Speed</h3>
            </div>
            <p className="text-sm text-gray-600">
              Set the default animation speed for timeline playback.
            </p>
            
            <div className="grid grid-cols-4 gap-2">
              {SPEED_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setPreferences(prev => ({ ...prev, playbackSpeed: preset.value }))}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all duration-200
                    ${preferences.playbackSpeed === preset.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{preset.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme Preferences */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Color Scheme</h3>
            </div>
            <p className="text-sm text-gray-600">
              Choose how wind particles are colored.
            </p>
            
            <div className="space-y-2">
              {COLOR_SCHEMES.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => setPreferences(prev => ({ ...prev, colorScheme: scheme.id }))}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left transition-all duration-200
                    ${preferences.colorScheme === scheme.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{scheme.label}</div>
                      <div className="text-xs text-gray-500">{scheme.description}</div>
                    </div>
                    {preferences.colorScheme === scheme.id && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <div 
                    className="h-3 rounded-full"
                    style={{ background: scheme.preview }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Auto-save Toggle */}
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">General Settings</h3>
            </div>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <div className="text-sm font-medium text-gray-700">Auto-save preferences</div>
                <div className="text-xs text-gray-500 mt-0.5">Automatically save your settings</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoSaveEnabled}
                onChange={(e) => setPreferences(prev => ({ ...prev, autoSaveEnabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="mr-auto"
          >
            Reset to Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={savePreferences}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
