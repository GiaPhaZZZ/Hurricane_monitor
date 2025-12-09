/**
 * Windy Mode Tests
 * 
 * Tests style switching logic, track rendering differences, and state persistence
 * for Windy mode visualization toggle.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

/// <reference types="@testing-library/jest-dom/vitest" />

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WindyModeToggle } from '../WindyModeToggle';
import { GradientStormTrack } from '../GradientStormTrack';
import { ForecastCone } from '../ForecastCone';
import { CurrentPositionMarker } from '../CurrentPositionMarker';
import { WindStrengthCircles } from '../WindStrengthCircles';
import type { StormPoint } from '../../../lib/stormData';

// Mock Leaflet components
vi.mock('react-leaflet', async () => {
  const actual = await vi.importActual('react-leaflet');
  return {
    ...actual,
    Polyline: ({ pathOptions, className }: any) => (
      <div 
        data-testid="polyline" 
        data-color={pathOptions?.color}
        data-weight={pathOptions?.weight}
        data-opacity={pathOptions?.opacity}
        data-dasharray={pathOptions?.dashArray}
        data-classname={className}
      />
    ),
    Polygon: ({ pathOptions, className }: any) => (
      <div 
        data-testid="polygon"
        data-fill-color={pathOptions?.fillColor}
        data-fill-opacity={pathOptions?.fillOpacity}
        data-color={pathOptions?.color}
        data-dasharray={pathOptions?.dashArray}
        data-classname={className}
      />
    ),
    Circle: ({ pathOptions }: any) => (
      <div 
        data-testid="circle"
        data-color={pathOptions?.color}
        data-opacity={pathOptions?.opacity}
      />
    ),
    Marker: ({ icon, children }: any) => (
      <div data-testid="marker" data-icon={icon?.options?.html}>
        {children}
      </div>
    ),
    useMap: () => ({
      getZoom: () => 7,
      on: vi.fn(),
      off: vi.fn(),
    }),
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('WindyModeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should render toggle switch with label', () => {
    const onToggle = vi.fn();
    render(<WindyModeToggle isWindyMode={false} onToggle={onToggle} />);
    
    expect(screen.getByText('Windy Mode')).toBeInTheDocument();
    expect(screen.getByText('Gradient colored tracks')).toBeInTheDocument();
  });

  it('should display correct mode description', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<WindyModeToggle isWindyMode={false} onToggle={onToggle} />);
    
    expect(screen.getByText('Gradient colored tracks')).toBeInTheDocument();
    
    rerender(<WindyModeToggle isWindyMode={true} onToggle={onToggle} />);
    expect(screen.getByText('White dashed tracks')).toBeInTheDocument();
  });

  it('should call onToggle when switch is clicked', () => {
    const onToggle = vi.fn();
    render(<WindyModeToggle isWindyMode={false} onToggle={onToggle} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('should persist mode preference to localStorage', () => {
    const onToggle = vi.fn();
    render(<WindyModeToggle isWindyMode={false} onToggle={onToggle} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(localStorage.getItem('storm-tracker-windy-mode')).toBe('true');
  });
});

describe('GradientStormTrack - Windy Mode', () => {
  const mockPoints: StormPoint[] = [
    {
      timestamp: Date.now(),
      lat: 10.0,
      lng: 105.0,
      windSpeed: 50,
      pressure: 1000,
      category: 'TS',
    },
    {
      timestamp: Date.now() + 3600000,
      lat: 10.5,
      lng: 105.5,
      windSpeed: 60,
      pressure: 995,
      category: 'Category 1',
    },
  ];

  it('should render white dashed lines in Windy mode', () => {
    const { container } = render(
      <GradientStormTrack
        points={mockPoints}
        isHistorical={true}
        isWindyMode={true}
      />
    );
    
    const polylines = container.querySelectorAll('[data-testid="polyline"]');
    expect(polylines.length).toBeGreaterThan(0);
    
    const mainTrack = polylines[0];
    expect(mainTrack.getAttribute('data-color')).toBe('#ffffff');
    expect(mainTrack.getAttribute('data-weight')).toBe('3');
    expect(mainTrack.getAttribute('data-opacity')).toBe('0.8');
    expect(mainTrack.getAttribute('data-dasharray')).toBe('10 10');
  });

  it('should render gradient colors in normal mode', () => {
    const { container } = render(
      <GradientStormTrack
        points={mockPoints}
        isHistorical={true}
        isWindyMode={false}
      />
    );
    
    const polylines = container.querySelectorAll('[data-testid="polyline"]');
    expect(polylines.length).toBeGreaterThan(0);
    
    // Should have gradient track segments (not white)
    const gradientTracks = Array.from(polylines).filter(
      (p) => p.getAttribute('data-color') !== '#ffffff'
    );
    expect(gradientTracks.length).toBeGreaterThan(0);
  });

  it('should render historical points as white circles in Windy mode', () => {
    const { container } = render(
      <GradientStormTrack
        points={mockPoints}
        isHistorical={true}
        isWindyMode={true}
      />
    );
    
    // Check for point markers (rendered as polylines with small weight)
    const polylines = container.querySelectorAll('[data-testid="polyline"]');
    const pointMarkers = Array.from(polylines).filter(
      (p) => p.getAttribute('data-classname') === 'windy-mode-point'
    );
    
    expect(pointMarkers.length).toBeGreaterThan(0);
  });
});

describe('ForecastCone - Windy Mode', () => {
  const mockCurrentPosition: StormPoint = {
    timestamp: Date.now(),
    lat: 10.0,
    lng: 105.0,
    windSpeed: 50,
    pressure: 1000,
    category: 'TS',
  };

  const mockForecastPoints: StormPoint[] = [
    {
      timestamp: Date.now() + 3600000,
      lat: 10.5,
      lng: 105.5,
      windSpeed: 60,
      pressure: 995,
      category: 'Category 1',
    },
  ];

  it('should render white dashed borders in Windy mode', () => {
    const { container } = render(
      <ForecastCone
        currentPosition={mockCurrentPosition}
        forecastPoints={mockForecastPoints}
        isWindyMode={true}
      />
    );
    
    const polygon = container.querySelector('[data-testid="polygon"]');
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute('data-color')).toBe('#ffffff');
    expect(polygon?.getAttribute('data-dasharray')).toBe('10 10');
    expect(polygon?.getAttribute('data-fill-opacity')).toBe('0.2');
  });

  it('should render with default styling in normal mode', () => {
    const { container } = render(
      <ForecastCone
        currentPosition={mockCurrentPosition}
        forecastPoints={mockForecastPoints}
        isWindyMode={false}
      />
    );
    
    const polygon = container.querySelector('[data-testid="polygon"]');
    expect(polygon).toBeTruthy();
    expect(polygon?.getAttribute('data-dasharray')).toBe('10 5');
    expect(polygon?.getAttribute('data-fill-opacity')).toBe('0.25');
  });
});

describe('CurrentPositionMarker - Windy Mode', () => {
  const mockPosition: StormPoint = {
    timestamp: Date.now(),
    lat: 10.0,
    lng: 105.0,
    windSpeed: 50,
    pressure: 1000,
    category: 'TS',
  };

  it('should render red circular icon in Windy mode', () => {
    const { container } = render(
      <CurrentPositionMarker
        position={mockPosition}
        isWindyMode={true}
      />
    );
    
    const marker = container.querySelector('[data-testid="marker"]');
    expect(marker).toBeTruthy();
    
    // Check that the icon HTML contains red color
    const iconHtml = marker?.getAttribute('data-icon') || '';
    expect(iconHtml).toContain('#ff0000');
  });

  it('should render category-colored icon in normal mode', () => {
    const { container } = render(
      <CurrentPositionMarker
        position={mockPosition}
        isWindyMode={false}
      />
    );
    
    const marker = container.querySelector('[data-testid="marker"]');
    expect(marker).toBeTruthy();
    
    // Check that the icon HTML does NOT contain red color (uses category color)
    const iconHtml = marker?.getAttribute('data-icon') || '';
    expect(iconHtml).not.toContain('#ff0000');
  });
});

describe('WindStrengthCircles - Windy Mode', () => {
  const mockCenter = { lat: 10.0, lng: 105.0 };

  it('should render white circles at 30% opacity in Windy mode', () => {
    const { container } = render(
      <WindStrengthCircles
        center={mockCenter}
        windSpeed={50}
        category="TS"
        isWindyMode={true}
      />
    );
    
    const circles = container.querySelectorAll('[data-testid="circle"]');
    expect(circles.length).toBeGreaterThan(0);
    
    circles.forEach((circle) => {
      expect(circle.getAttribute('data-color')).toBe('#ffffff');
      expect(parseFloat(circle.getAttribute('data-opacity') || '0')).toBeLessThanOrEqual(0.3);
    });
  });

  it('should render category-colored circles in normal mode', () => {
    const { container } = render(
      <WindStrengthCircles
        center={mockCenter}
        windSpeed={50}
        category="TS"
        isWindyMode={false}
      />
    );
    
    const circles = container.querySelectorAll('[data-testid="circle"]');
    expect(circles.length).toBeGreaterThan(0);
    
    // Should not be white in normal mode
    const whiteCircles = Array.from(circles).filter(
      (c) => c.getAttribute('data-color') === '#ffffff'
    );
    expect(whiteCircles.length).toBe(0);
  });
});
