# Implementation Plan

- [x] 1. Set up wind particle system infrastructure









  - Create WindParticleCanvas component with canvas element and resize handling
  - Implement ParticleEngine class with particle initialization and update logic
  - Create WindFieldManager for wind data fetching and caching
  - Add PerformanceMonitor utility for FPS tracking and adaptive scaling
  - _Requirements: 1.1, 1.2, 8.1, 8.2, 8.3_

- [x] 2. Implement particle rendering and animation






  - [x] 2.1 Build particle lifecycle management (spawn, update, respawn)


    - Implement particle position updates based on wind vectors
    - Add particle age tracking and automatic respawning
    - Create spatial grid for efficient wind vector lookups
    - _Requirements: 1.1, 1.4, 8.7_

  - [x] 2.2 Add velocity-based particle coloring and trails


    - Implement color coding based on wind speed thresholds
    - Add particle trail rendering with length proportional to speed
    - Use canvas compositing mode 'lighter' for glow effects
    - _Requirements: 1.3, 1.6, 1.8_

  - [x] 2.3 Implement smooth fade-in/fade-out transitions


    - Add opacity animation when toggling wind layer
    - Use ease-out easing for natural transitions
    - Handle viewport changes with particle field recalculation
    - _Requirements: 1.5, 1.7_

  - [ ] 2.4 Write unit tests for particle engine
















    - Test particle initialization and lifecycle
    - Verify wind vector interpolation accuracy
    - Test respawning logic at viewport edges
    - _Requirements: 1.1, 1.4_

- [x] 3. Create timeline slider component





  - [x] 3.1 Build TimelineSlider base component with time range


    - Create horizontal slider bar spanning 90% viewport width
    - Implement draggable time handle with position tracking
    - Add time marker labels at 3-hour intervals
    - Position timeline at bottom of map with proper z-index
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Add playback controls (play/pause/speed)


    - Create play/pause button with icon toggle
    - Implement speed selector (0.5x, 1x, 2x, 4x)
    - Add animation loop using requestAnimationFrame
    - Handle automatic stop at timeline end
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 3.3 Implement timeline interaction handlers


    - Add click-to-jump functionality on timeline bar
    - Implement drag handling with smooth position updates
    - Create hover tooltip showing date/time at cursor
    - Add vertical indicator line for current time position
    - _Requirements: 2.4, 2.6, 2.7, 2.8_

  - [x] 3.4 Integrate timeline with storm data updates


    - Connect timeline state to storm position rendering
    - Update map to show storm at selected timestamp
    - Ensure updates complete within 100ms
    - Handle edge cases (missing data, gaps in timeline)
    - _Requirements: 2.3, 2.5_

  - [ ]* 3.5 Add keyboard navigation for timeline
    - Implement Space bar for play/pause toggle
    - Add Left/Right arrow keys for time navigation
    - Add Home/End keys for timeline boundaries
    - Ensure focus indicators are visible
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7_

  - [ ]* 3.6 Write tests for timeline functionality
    - Test time calculation and formatting
    - Verify playback speed adjustments
    - Test keyboard navigation handlers
    - Validate boundary conditions
    - _Requirements: 2.1, 2.2, 2.3, 2.4_


- [x] 4. Implement Windy mode visualization toggle





  - [x] 4.1 Create WindyModeToggle component in settings


    - Add toggle switch UI component
    - Implement state management for Windy mode
    - Persist mode preference to localStorage
    - Add smooth transition animations between modes
    - _Requirements: 3.4_

  - [x] 4.2 Implement white-dashed track rendering


    - Render storm tracks as white dashed lines (10px dash, 10px gap)
    - Set line width to 3 pixels with 80% opacity
    - Render historical points as small white circles (2px radius)
    - Update forecast cones with white dashed borders
    - _Requirements: 3.1, 3.2, 3.5, 3.8_

  - [x] 4.3 Update storm markers for Windy mode


    - Render current position as red circular icon with white border
    - Update wind strength circles to white color at 30% opacity
    - Ensure markers maintain proper z-index layering
    - _Requirements: 3.6, 3.7_

  - [x] 4.4 Add mode transition animations


    - Implement 300ms transition between gradient and white styles
    - Ensure smooth color and opacity changes
    - Handle mode switching during active animations
    - _Requirements: 3.4_

  - [x] 4.5 Write tests for Windy mode



    - Test style switching logic
    - Verify track rendering differences
    - Test state persistence
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Build simplified tooltip component





  - [x] 5.1 Create SimplifiedTooltip component


    - Design white background with 2px border radius
    - Implement compact single-line format: "HH:MM | XXX km/h | YYYY hPa"
    - Use 12px font size with 500 font weight
    - Add subtle drop shadow (4px blur, 20% opacity)
    - _Requirements: 5.1, 5.3, 5.7_

  - [x] 5.2 Implement tooltip positioning logic

    - Position tooltip 10px above cursor
    - Add automatic edge detection for viewport boundaries
    - Show only closest point's tooltip when multiple nearby
    - _Requirements: 5.4, 5.6_

  - [x] 5.3 Add tooltip show/hide animations

    - Implement 200ms delay before hiding
    - Add fade-in/fade-out transitions
    - Handle rapid hover state changes
    - _Requirements: 5.5_

  - [x] 5.4 Format storm data for display

    - Format wind speed as "XXX km/h"
    - Format pressure as "YYYY hPa"
    - Format timestamp as "HH:MM"
    - Use vertical separator between values
    - _Requirements: 5.8_

- [x] 6. Create right sidebar layer controls




  - [x] 6.1 Build RightSidebar component structure


    - Create vertical sidebar on right edge of viewport
    - Set sidebar width to 60px with 10px padding
    - Implement proper z-index for overlay positioning
    - _Requirements: 6.1, 6.7_

  - [x] 6.2 Add circular icon buttons for layers

    - Create 40px diameter circular buttons
    - Add icons for wind, temperature, radar, satellite, settings
    - Implement active state highlighting with colored backgrounds
    - Add hover effects and transitions
    - _Requirements: 6.2, 6.4_

  - [x] 6.3 Implement layer toggle functionality

    - Connect buttons to layer state management
    - Ensure only one weather overlay active at a time
    - Add visual feedback on button click
    - Store layer preferences in localStorage
    - _Requirements: 6.3, 4.8_

  - [x] 6.4 Add hover tooltips for buttons

    - Display label tooltip to the left of each button
    - Show layer name on hover
    - Position tooltips with proper spacing
    - _Requirements: 6.6_

  - [x] 6.5 Implement responsive sidebar behavior

    - Collapse to icon-only mode on mobile (< 768px)
    - Adjust button sizes for touch targets on mobile
    - Handle orientation changes
    - _Requirements: 6.8, 9.2_


- [x] 7. Enhance weather overlay layers






  - [x] 7.1 Update WeatherOverlay component for timeline integration

    - Connect overlay to timeline state for temporal data
    - Update overlay data to match selected timestamp
    - Implement data refresh every 10 minutes
    - _Requirements: 4.5, 4.7_

  - [x] 7.2 Implement temperature overlay color scale

    - Use blue (cold) → green → yellow → red (hot) gradient
    - Apply smooth color interpolation between values
    - Set semi-transparent rendering
    - _Requirements: 4.2_


  - [x] 7.3 Implement wind speed overlay color scale


    - Use light blue (calm) → green → yellow → magenta (extreme) gradient
    - Apply smooth color interpolation
    - Coordinate with particle layer for consistency
    - _Requirements: 4.3_



  - [x] 7.4 Add overlay opacity controls

    - Implement real-time opacity adjustment (0-100%)
    - Connect to existing opacity slider in controls
    - Ensure smooth opacity transitions
    - _Requirements: 4.4_




  - [x] 7.5 Add hover value display





    - Show exact meteorological value at cursor position
    - Display in tooltip format
    - Update in real-time as cursor moves
    - _Requirements: 4.6_

- [x] 8. Implement performance optimizations





  - [x] 8.1 Add adaptive particle count scaling


    - Monitor frame rate continuously
    - Reduce particle count by 25% when FPS drops below 30
    - Increase particle count by 10% when FPS recovers above 50
    - Cap maximum particle count based on device type
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 8.2 Optimize canvas rendering


    - Use requestAnimationFrame for animation loop
    - Implement dirty rectangle optimization
    - Pre-allocate particle arrays to avoid GC
    - Pause animation when map not visible
    - _Requirements: 8.4, 8.5, 8.8_

  - [x] 8.3 Add spatial grid for wind vector lookups

    - Create 50x50 grid for efficient particle-to-wind mapping
    - Implement fast grid cell lookup
    - Update grid on viewport changes
    - _Requirements: 8.7_

  - [x] 8.4 Implement viewport resize debouncing

    - Debounce canvas resize operations by 250ms
    - Recalculate particle field on resize
    - Handle orientation changes smoothly
    - _Requirements: 8.6, 9.8_

  - [ ]* 8.5 Add performance monitoring and logging
    - Track average FPS over time
    - Log performance metrics to console in dev mode
    - Create performance dashboard for debugging
    - _Requirements: 8.1, 8.2_

  - [ ]* 8.6 Write performance tests
    - Measure FPS with varying particle counts
    - Test adaptive scaling behavior
    - Verify memory usage stays below 100MB
    - Test timeline animation performance
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 9. Add responsive design adaptations





  - [x] 9.1 Implement mobile layout for timeline


    - Move timeline to collapsible bottom drawer on mobile
    - Hide timeline by default with expand button
    - Increase touch target sizes to 44px minimum
    - _Requirements: 9.1, 9.2, 9.7_


  - [x] 9.2 Optimize particle count for mobile

    - Reduce maximum particle count to 1000 on mobile
    - Detect device capabilities on initialization
    - Adjust based on screen size and performance
    - _Requirements: 9.4_


  - [x] 9.3 Adapt layer controls for mobile

    - Stack controls vertically at bottom in portrait mode
    - Maintain tablet layout with larger touch targets
    - Ensure all controls remain accessible
    - _Requirements: 9.3, 9.6_


  - [x] 9.4 Handle pinch-to-zoom on mobile

    - Update particle field on zoom level changes
    - Maintain smooth animation during zoom
    - Recalculate wind vectors for new viewport
    - _Requirements: 9.5_


  - [x] 9.5 Add orientation change handling

    - Recalculate layout within 300ms of orientation change
    - Preserve timeline state during rotation
    - Update canvas dimensions appropriately
    - _Requirements: 9.8_

  - [ ]* 9.6 Test responsive layouts
    - Screenshot tests at mobile/tablet/desktop sizes
    - Verify touch target sizes on mobile
    - Test orientation change behavior
    - _Requirements: 9.1, 9.2, 9.3_


      - [x] 10. Implement accessibility features





  - [x] 10.1 Add keyboard shortcuts for timeline control


    - Implement Space bar for play/pause
    - Add Left/Right arrows for time navigation (1 hour steps)
    - Add Home/End keys for timeline boundaries
    - Add number keys 1-5 for layer toggles
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_


  - [x] 10.2 Add visible focus indicators

    - Style focus outlines for all interactive elements
    - Use 2px outline with high contrast color
    - Ensure focus indicators visible in all modes
    - Test keyboard navigation flow
    - _Requirements: 10.7_


  - [x] 10.3 Implement screen reader support

    - Add ARIA labels to all controls
    - Announce timeline position changes
    - Announce layer toggle states
    - Add descriptive alt text for icons
    - _Requirements: 10.8_



  - [x] 10.4 Ensure WCAG 2.1 Level AA compliance








    - Verify color contrast ratios ≥ 4.5:1 for text
    - Test with keyboard-only navigation
    - Test with screen reader (NVDA/JAWS)
    - Add skip links for main content areas
    - _Requirements: 10.7, 10.8_

  - [ ]* 10.5 Write accessibility tests
    - Test keyboard navigation paths
    - Verify ARIA labels are present
    - Test screen reader announcements
    - Validate focus management
    - _Requirements: 10.1, 10.2, 10.3, 10.7, 10.8_

- [x] 11. Integrate wind data API





  - [x] 11.1 Set up wind data fetching from OpenWeatherMap


    - Create API client for OpenWeatherMap wind data
    - Implement authentication with API key from env variables
    - Add error handling for API failures
    - Cache wind data to minimize API calls
    - _Requirements: 1.2, 1.5_

  - [x] 11.2 Parse and transform wind data to WindField format


    - Convert API response to WindField interface
    - Extract u/v wind components
    - Calculate grid dimensions and bounds
    - Handle missing or invalid data gracefully
    - _Requirements: 1.2_

  - [x] 11.3 Implement wind data caching and updates


    - Cache wind data in memory with timestamp
    - Refresh data every 10 minutes
    - Implement stale-while-revalidate pattern
    - Handle offline scenarios
    - _Requirements: 4.5_

  - [x] 11.4 Add loading states and error handling


    - Show loading indicator while fetching wind data
    - Display error message if API fails
    - Provide fallback behavior (disable particle layer)
    - Log errors for debugging
    - _Requirements: 1.2_

- [x] 12. Wire up timeline with storm visualization





  - [x] 12.1 Connect timeline state to storm components


    - Pass current time from timeline to StormAnimation
    - Update storm positions based on selected time
    - Interpolate positions between data points
    - Handle historical vs forecast data differently
    - _Requirements: 2.3, 2.4_

  - [x] 12.2 Synchronize weather overlays with timeline


    - Update temperature/wind overlays to match timeline
    - Fetch historical weather data for past times
    - Show forecast data for future times
    - Handle data gaps gracefully
    - _Requirements: 4.7_

  - [x] 12.3 Update tooltips to show time-specific data


    - Display storm data at selected timeline position
    - Format timestamps relative to timeline
    - Show "Historical" or "Forecast" labels
    - _Requirements: 5.1, 5.8_

  - [x] 12.4 Handle edge cases in timeline integration


    - Handle storms with incomplete time data
    - Manage timeline bounds when storms have different ranges
    - Ensure smooth transitions during playback
    - _Requirements: 2.3, 2.5_


- [x] 13. Add state management and persistence





  - [x] 13.1 Create global state context for Windy features


    - Set up React Context for timeline, layers, and Windy mode
    - Implement useReducer for state management
    - Create action creators for state updates
    - Add TypeScript types for all state
    - _Requirements: 3.4, 6.3_

  - [x] 13.2 Implement localStorage persistence


    - Save layer preferences to localStorage
    - Persist Windy mode setting
    - Save timeline playback speed preference
    - Restore state on app initialization
    - _Requirements: 3.4, 6.3_

  - [x] 13.3 Add URL query param support for sharing


    - Encode timeline position in URL
    - Include active layers in URL
    - Include Windy mode state in URL
    - Parse URL params on app load
    - _Requirements: 2.3_

  - [x] 13.4 Implement state synchronization


    - Ensure timeline and storm positions stay in sync
    - Coordinate layer toggles with overlay rendering
    - Handle concurrent state updates gracefully
    - _Requirements: 2.3, 4.8_

- [x] 14. Polish UI and add final touches





  - [x] 14.1 Add smooth animations and transitions


    - Implement fade-in for particle layer
    - Add slide-in animation for timeline
    - Smooth layer toggle transitions
    - Polish button hover effects
    - _Requirements: 1.7, 3.4_



  - [x] 14.2 Improve loading states and feedback

    - Add skeleton loaders for timeline
    - Show loading spinner for wind data
    - Add progress indicator for playback
    - Implement toast notifications for errors
    - _Requirements: 11.4_


  - [x] 14.3 Optimize visual styling

    - Match Windy.com color scheme and aesthetics
    - Ensure consistent spacing and alignment
    - Polish tooltip appearance
    - Refine icon sizes and colors
    - _Requirements: 5.1, 5.3, 5.7_


  - [x] 14.4 Add user preferences panel

    - Create settings modal for advanced options
    - Add particle count override option
    - Add playback speed presets
    - Add color scheme preferences
    - _Requirements: 7.4, 7.5_

- [-] 15. Testing and quality assurance




  - [ ]* 15.1 Write integration tests
    - Test timeline-storm synchronization
    - Test layer interaction scenarios    
    - Test responsive behavior at different breakpoints
    - _Requirements: 2.3, 4.8, 9.1_

  - [x] 15.2 Perform visual regression testing







    - Capture screenshots of Windy mode vs gradient mode
    - Test responsive layouts at all breakpoints
    - Verify tooltip appearance
    - Compare with Windy.com reference
    - _Requirements: 3.1, 3.2, 5.1_

  - [x] 15.3 Conduct performance testing



    - Measure FPS with various particle counts
    - Test timeline playback smoothness
    - Verify memory usage over time
    - Test on low-end devices
    - _Requirements: 8.1, 8.2, 8.3_



  - [x] 15.4 Perform accessibility audit







    - Test with keyboard-only navigation
    - Test with screen readers (NVDA, JAWS, VoiceOver)
    - Verify WCAG 2.1 Level AA compliance
    - Test color contrast ratios      
    - _Requirements: 10.1, 10.7, 10.8_



  - [x] 15.5 Cross-browser testing


    - Test on Chrome, Firefox, Safari, Edge
    - Test on iOS Safari and Chrome Android
    - Verify canvas rendering consistency
    - Test touch interactions on mobile
    - _Requirements: 9.1, 9.2, 9.5_



  - [x] 15.6 Bug fixes and refinements






    - Address issues found in testing
    - Optimize performance bottlenecks
    - Fix visual inconsistencies
    - Improve error handling
    - _Requirements: All_
