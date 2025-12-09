/**
 * Multi-Storm Rendering Example
 * 
 * This example demonstrates how multiple storms are rendered simultaneously
 * with visual separation and independent animation control.
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import StormAnimation from '../StormAnimation';
import { type Storm } from '../../lib/stormData';

// Example: Three storms with overlapping tracks
const exampleStorms: Storm[] = [
  {
    id: 'storm-1',
    nameVi: 'Typhoon Yagi',
    nameInt: 'Yagi',
    status: 'active',
    lastPointTime: Date.now(),
    maxWindKmh: 150,
    currentPosition: {
      timestamp: Date.now(),
      lat: 16.5,
      lng: 108.0,
      windSpeed: 150,
      pressure: 950,
      category: 'Category 4'
    },
    historical: [
      { timestamp: Date.now() - 86400000, lat: 15.0, lng: 110.0, windSpeed: 120, pressure: 970, category: 'Category 3' },
      { timestamp: Date.now() - 43200000, lat: 15.8, lng: 109.0, windSpeed: 140, pressure: 960, category: 'Category 3' }
    ],
    forecast: [
      { timestamp: Date.now() + 21600000, lat: 17.0, lng: 107.5, windSpeed: 130, pressure: 965, category: 'Category 3' },
      { timestamp: Date.now() + 43200000, lat: 17.5, lng: 107.0, windSpeed: 110, pressure: 980, category: 'Category 2' }
    ]
  },
  {
    id: 'storm-2',
    nameVi: 'Typhoon Lekima',
    nameInt: 'Lekima',
    status: 'active',
    lastPointTime: Date.now(),
    maxWindKmh: 180,
    currentPosition: {
      timestamp: Date.now(),
      lat: 16.6,
      lng: 108.1,
      windSpeed: 180,
      pressure: 930,
      category: 'Super Typhoon'
    },
    historical: [
      { timestamp: Date.now() - 86400000, lat: 15.1, lng: 110.2, windSpeed: 150, pressure: 950, category: 'Category 4' },
      { timestamp: Date.now() - 43200000, lat: 15.9, lng: 109.1, windSpeed: 170, pressure: 940, category: 'Category 4' }
    ],
    forecast: [
      { timestamp: Date.now() + 21600000, lat: 17.1, lng: 107.6, windSpeed: 160, pressure: 945, category: 'Category 4' },
      { timestamp: Date.now() + 43200000, lat: 17.6, lng: 107.1, windSpeed: 140, pressure: 960, category: 'Category 3' }
    ]
  },
  {
    id: 'storm-3',
    nameVi: 'Typhoon Krosa',
    nameInt: 'Krosa',
    status: 'developing',
    lastPointTime: Date.now(),
    maxWindKmh: 100,
    currentPosition: {
      timestamp: Date.now(),
      lat: 16.4,
      lng: 107.9,
      windSpeed: 100,
      pressure: 985,
      category: 'Category 2'
    },
    historical: [
      { timestamp: Date.now() - 86400000, lat: 14.9, lng: 109.8, windSpeed: 80, pressure: 995, category: 'Category 1' },
      { timestamp: Date.now() - 43200000, lat: 15.7, lng: 108.9, windSpeed: 90, pressure: 990, category: 'Category 1' }
    ],
    forecast: [
      { timestamp: Date.now() + 21600000, lat: 16.9, lng: 107.4, windSpeed: 95, pressure: 988, category: 'Category 2' },
      { timestamp: Date.now() + 43200000, lat: 17.4, lng: 106.9, windSpeed: 85, pressure: 992, category: 'Category 1' }
    ]
  }
];

/**
 * Example 1: All storms animating simultaneously
 */
export function MultiStormAnimatingExample() {
  return (
    <MapContainer center={[16.5, 108.0]} zoom={7} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        attribution="© Google"
      />
      
      <StormAnimation
        storms={exampleStorms}
        selectedStorm={undefined}
      />
    </MapContainer>
  );
}

/**
 * Example 2: Single storm selected (others visible but not animating)
 */
export function SingleStormSelectedExample() {
  const selectedStormId = 'storm-2';
  
  return (
    <MapContainer center={[16.5, 108.0]} zoom={7} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        attribution="© Google"
      />
      
      <StormAnimation
        storms={exampleStorms}
        selectedStorm={exampleStorms.find(s => s.id === selectedStormId)}
      />
    </MapContainer>
  );
}

/**
 * Example 3: Two storms with very close tracks (demonstrating offset)
 */
export function OverlappingTracksExample() {
  const overlappingStorms = exampleStorms.slice(0, 2);
  
  return (
    <MapContainer center={[16.5, 108.0]} zoom={8} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        attribution="© Google"
      />
      
      <StormAnimation
        storms={overlappingStorms}
        selectedStorm={undefined}
      />
    </MapContainer>
  );
}

/**
 * Visual Separation Demonstration
 * 
 * With 3 storms:
 * - Storm 0 (Yagi): offset = -0.02 → ~10km to the left
 * - Storm 1 (Lekima): offset = 0 → center (no offset)
 * - Storm 2 (Krosa): offset = +0.02 → ~10km to the right
 * 
 * This creates a clear visual separation while maintaining the overall track pattern.
 * 
 * Storm Name Labels:
 * - Each storm displays its name 15km north of current position
 * - Label color matches storm category
 * - Labels are clickable and show detailed popup information
 * 
 * Independent Animation:
 * - Each storm can be animated independently via isActive prop
 * - Animation state is maintained per storm
 * - Supports both "play all" and "single storm" modes
 */
