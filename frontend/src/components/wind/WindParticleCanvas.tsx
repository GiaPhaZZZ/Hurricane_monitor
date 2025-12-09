/**
 * WindParticleCanvas Component
 * 
 * Renders animated wind particles on a canvas overlay to visualize wind patterns.
 * Uses ParticleEngine for particle management and WindFieldManager for wind data.
 * 
 * Requirements: 1.1, 1.2, 1.5, 1.7, 8.1, 8.2, 8.3
 */

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { ParticleEngine } from './ParticleEngine';
import { WindFieldManager } from './WindFieldManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { useIsMobile } from '../../hooks/use-mobile';
import type { WindField } from './types';

export interface WindParticleCanvasProps {
  windData?: WindField | null;
  particleCount?: number;
  isVisible: boolean;
  opacity?: number;
  colorScheme?: 'default' | 'monochrome';
}

/**
 * WindParticleCanvas Component
 * 
 * Manages canvas rendering, particle animation, and performance monitoring
 * for wind particle visualization.
 */
export default function WindParticleCanvas({
  windData,
  particleCount = 3000,
  isVisible,
  opacity = 1.0,
  colorScheme = 'default',
}: WindParticleCanvasProps) {
  const map = useMap();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleEngineRef = useRef<ParticleEngine | null>(null);
  const windFieldManagerRef = useRef<WindFieldManager | null>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentOpacity, setCurrentOpacity] = useState(0);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  /**
   * Detect device capabilities and adjust particle count
   * Requirements: 9.4 - Reduce maximum particle count to 1000 on mobile
   */
  const getOptimalParticleCount = (): number => {
    // Mobile devices: cap at 1000 particles
    if (isMobile) {
      return Math.min(particleCount, 1000);
    }

    // Desktop: detect screen size and adjust
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenArea = screenWidth * screenHeight;

    // Adjust based on screen size
    if (screenArea < 1920 * 1080) {
      // Smaller screens: reduce particle count
      return Math.min(particleCount, 2000);
    }

    // Large screens: use full particle count
    return particleCount;
  };

  // Initialize managers
  useEffect(() => {
    windFieldManagerRef.current = new WindFieldManager();
    performanceMonitorRef.current = new PerformanceMonitor();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particleEngineRef.current?.cleanup();
      intersectionObserverRef.current?.disconnect();
    };
  }, []);

  // Monitor visibility to pause animation when not visible
  // Requirements: 8.5, 8.8
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use Intersection Observer to detect visibility
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsMapVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    intersectionObserverRef.current.observe(container);

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, []);

  // Handle canvas resize and orientation changes
  // Requirements: 9.8 - Recalculate layout within 300ms of orientation change
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      // Reinitialize particle engine with new dimensions
      if (particleEngineRef.current && windFieldManagerRef.current?.getCurrentWindField()) {
        const windField = windFieldManagerRef.current.getCurrentWindField();
        if (windField) {
          particleEngineRef.current.updateViewport(width, height, map.getBounds());
        }
      }
    };

    // Initial resize
    resizeCanvas();

    // Debounced resize handler (250ms for regular resize)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 250);
    };

    // Orientation change handler (300ms as per requirements)
    let orientationTimeout: NodeJS.Timeout;
    const handleOrientationChange = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(() => {
        resizeCanvas();
        // Force map to recalculate its size
        map.invalidateSize();
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    map.on('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      map.off('resize', resizeCanvas);
      clearTimeout(resizeTimeout);
      clearTimeout(orientationTimeout);
    };
  }, [map]);

  // Handle wind data updates
  useEffect(() => {
    if (!windData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update wind field manager
    windFieldManagerRef.current?.setWindField(windData);

    // Get optimal particle count based on device capabilities
    const optimalCount = getOptimalParticleCount();

    // Initialize or update particle engine
    const performanceMonitor = performanceMonitorRef.current!;
    const adaptiveParticleCount = performanceMonitor.getAdaptiveParticleCount(optimalCount);

    if (!particleEngineRef.current) {
      particleEngineRef.current = new ParticleEngine(
        canvas.width,
        canvas.height,
        windData,
        adaptiveParticleCount,
        map.getBounds()
      );
    } else {
      particleEngineRef.current.updateWindField(windData);
      particleEngineRef.current.updateParticleCount(adaptiveParticleCount);
    }
  }, [windData, particleCount, map, isMobile]);

  // Handle visibility and fade transitions
  // Requirements: 1.7 - Fade particles in over 500ms using ease-out easing
  useEffect(() => {
    if (isVisible) {
      // Fade in over 500ms with smooth ease-out easing
      const startTime = Date.now();
      const fadeIn = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 500, 1);
        // Cubic ease-out easing for smooth, natural fade-in
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setCurrentOpacity(easedProgress * opacity);

        if (progress < 1) {
          requestAnimationFrame(fadeIn);
        }
      };
      fadeIn();
    } else {
      // Fade out over 300ms for quick but smooth exit
      const startTime = Date.now();
      const startOpacity = currentOpacity;
      const fadeOut = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / 300, 1);
        // Ease-in for fade-out
        const easedProgress = Math.pow(progress, 2);
        setCurrentOpacity(startOpacity * (1 - easedProgress));

        if (progress < 1) {
          requestAnimationFrame(fadeOut);
        } else {
          setCurrentOpacity(0);
        }
      };
      fadeOut();
    }
  }, [isVisible, opacity]);

  // Animation loop
  useEffect(() => {
    // Pause animation when not visible or not enabled
    // Requirements: 8.5, 8.8
    if (!isVisible || !isMapVisible || !particleEngineRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particleEngine = particleEngineRef.current;
    const performanceMonitor = performanceMonitorRef.current!;

    let lastFrameTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime;
      lastFrameTime = now;

      // Update performance monitor
      performanceMonitor.recordFrame(deltaTime);

      // Check if we need to adjust particle count
      const currentFPS = performanceMonitor.getCurrentFPS();
      const optimalCount = getOptimalParticleCount();
      
      if (currentFPS < 30 && performanceMonitor.shouldReduceParticles()) {
        const newCount = Math.floor(particleEngine.getParticleCount() * 0.75);
        particleEngine.updateParticleCount(newCount);
      } else if (currentFPS > 50 && performanceMonitor.shouldIncreaseParticles()) {
        const newCount = Math.floor(particleEngine.getParticleCount() * 1.1);
        // Cap at optimal count based on device
        particleEngine.updateParticleCount(Math.min(newCount, optimalCount));
      }

      // Clear canvas with compositing mode
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set compositing mode for particle rendering
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = currentOpacity;

      // Update and render particles
      particleEngine.update(map.getBounds());
      particleEngine.render(ctx, colorScheme);

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, isMapVisible, currentOpacity, colorScheme, map, particleCount]);

  // Handle map movement and zoom (including pinch-to-zoom on mobile)
  // Requirements: 9.5 - Update particle field on zoom level changes
  useEffect(() => {
    const handleMapMove = () => {
      if (particleEngineRef.current && canvasRef.current) {
        particleEngineRef.current.updateViewport(
          canvasRef.current.width,
          canvasRef.current.height,
          map.getBounds()
        );
      }
    };

    const handleZoom = () => {
      if (particleEngineRef.current && canvasRef.current && windFieldManagerRef.current) {
        // Update viewport and recalculate wind vectors for new zoom level
        particleEngineRef.current.updateViewport(
          canvasRef.current.width,
          canvasRef.current.height,
          map.getBounds()
        );

        // Recalculate wind field for new viewport
        const windField = windFieldManagerRef.current.getCurrentWindField();
        if (windField) {
          particleEngineRef.current.updateWindField(windField);
        }
      }
    };

    // Listen to both move and zoom events
    map.on('moveend', handleMapMove);
    map.on('zoomend', handleZoom);
    
    // Also listen to zoom animation for smooth updates during pinch-to-zoom
    map.on('zoom', handleMapMove);

    return () => {
      map.off('moveend', handleMapMove);
      map.off('zoomend', handleZoom);
      map.off('zoom', handleMapMove);
    };
  }, [map]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 500,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: isVisible ? 'block' : 'none',
        }}
      />
    </div>
  );
}
