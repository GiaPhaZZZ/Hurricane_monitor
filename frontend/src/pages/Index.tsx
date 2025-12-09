import { useEffect, useState } from 'react';
import { CloudRain, Satellite, AlertTriangle, X, Eye, ArrowLeft } from 'lucide-react';
import { type Storm, type PredictionResult } from '../lib/stormData';
import StormTracker from '../components/StormTracker';
import { Card, CardContent } from '../components/ui/card';
import WeatherMap from '../components/WeatherMap';
import StormInfo from '../components/StormInfo';
import { ThemeToggle } from '../components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { StormPredictionForm } from "../components/StormPredictionForm";

import { latLngBounds, type LatLngBounds } from 'leaflet';
import { useTimelineState } from '../hooks/useTimelineState';


export default function Index() {
  const [selectedStorm, setSelectedStorm] = useState<Storm | undefined>(undefined);
  const [storms, setStorms] = useState<Storm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const [customPrediction, setCustomPrediction] = useState<PredictionResult | null>(null);
  const [mapFocusBounds, setMapFocusBounds] = useState<LatLngBounds | null>(null);

  // Timeline state management with global state sync
  // Requirements: 2.3 - Ensure timeline and storm positions stay in sync

  useTimelineState(storms);

  // ✅ TẢI DỮ LIỆU
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Use environment variable for CloudFront URL
    // In development: uses Vite proxy (/api/cloudfront)
    // In production: uses direct CloudFront URL
    const CLOUDFRONT_URL = import.meta.env.VITE_CLOUDFRONT_URL || "https://d3lj47ilp0fgxy.cloudfront.net";

    // Add timestamp to prevent browser caching
    const FETCH_URL = `${CLOUDFRONT_URL}/recent_storms.json?t=${new Date().getTime()}`;

    console.log("🚀 Loading storm data from:", FETCH_URL);

    fetch(FETCH_URL)
      .then((res: Response) => {
        // Check if S3 returns an error (e.g., 403 Forbidden or 404 Not Found)
        if (!res.ok) {
          throw new Error(`Failed to load file (${res.status}). The data file may not be available yet.`);
        }
        return res.json();
      })
      .then((data: Storm[]) => {
        console.log("✅ Successfully loaded data from S3:", data);
        console.log("✅ Number of storms:", data?.length);

        // Data validation
        if (!Array.isArray(data)) {
          console.error("❌ Data is not an array:", data);
          setStorms([]);
        } else {
          setStorms(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching data:", err);
        setError(err.message || "Unable to load storm data.");
        setLoading(false);
      });
  }, []);

  // DỰ ĐOÁN
  const handlePredictionResult = (result: PredictionResult) => {
    setCustomPrediction(result);

    // Use forecast array from API response
    const points = result.forecast || result.path || [];
    if (points.length > 0) {
      const bounds = latLngBounds(points.map((p: { lat: number; lng: number }) => [p.lat, p.lng]));
      setMapFocusBounds(bounds);
    }

    setShowSidebar(false);
  };

  // GIAO DIỆN
  const handleStormSelect = (storm: Storm) => {
    setSelectedStorm(storm);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSelectedStorm(undefined);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
    if (showSidebar) setSelectedStorm(undefined);
  };

  const handleBackToList = () => setSelectedStorm(undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-xl font-semibold">Loading storm data from server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Skip Links for Keyboard Navigation - WCAG 2.1 Level AA */}
      <a
        href="#main-content"
        className="absolute left-[-9999px] top-0 z-[2000] bg-blue-600 text-white px-4 py-2 rounded shadow-lg focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <a
        href="#storm-tracker-section"
        className="absolute left-[-9999px] top-0 z-[2000] bg-blue-600 text-white px-4 py-2 rounded shadow-lg focus:left-48 focus:top-4"
      >
        Skip to storm tracker
      </a>
      <a
        href="#timeline-controls"
        className="absolute left-[-9999px] top-0 z-[2000] bg-blue-600 text-white px-4 py-2 rounded shadow-lg focus:left-96 focus:top-4"
      >
        Skip to timeline controls
      </a>

      {/* HEADER */}
      <header
        id="main-header"
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-[100] dark:bg-gray-950/80 dark:border-gray-800"
        role="banner"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CloudRain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Hurricane Monitor West Pacific Region
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track and forecast hurricane trajectories across the Western Pacific Ocean
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                aria-label={showSidebar ? "Close storm tracker sidebar" : "Open storm tracker sidebar"}
                aria-expanded={showSidebar}
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Track Storm</span>
              </button>
              <ThemeToggle />
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Satellite className="h-4 w-4" />
                <span>Updated: {new Date().toLocaleString('en-US')}</span>
              </div>
              {storms.some(s => s.status === 'active') && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm dark:bg-red-900 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Storm Warning</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* BẢN ĐỒ */}
      <main
        id="main-content"
        className="relative h-[calc(100vh-120px)] overflow-hidden"
        role="main"
        aria-label="Storm tracking map"
      >
        <div className="absolute inset-0 z-10">
          <Card className="h-full border-0 rounded-none dark:bg-gray-900">
            <CardContent className="p-0 h-full relative">
              <WeatherMap
                storms={storms}
                selectedStorm={selectedStorm}
                customPrediction={customPrediction}
                mapFocusBounds={mapFocusBounds}
                onMapFocusComplete={() => setMapFocusBounds(null)}
              />
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        {showSidebar && (
          <div
            id="storm-tracker-section"
            className="absolute top-0 right-0 w-96 h-full bg-white dark:bg-gray-900 shadow-2xl z-[1001] overflow-hidden flex flex-col"
            role="complementary"
            aria-label="Storm tracker sidebar"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold dark:text-gray-100" id="sidebar-heading">
                {selectedStorm ? 'Storm Details' : 'Storm List'}
              </h2>
              <button
                onClick={closeSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                aria-label="Close storm tracker sidebar"
              >
                <X className="h-5 w-5 dark:text-gray-400" />
              </button>
            </div>

            {/* TABS - min-h-0 rất quan trọng để flex + scroll hoạt động */}
            <Tabs defaultValue="storms" className="flex-1 flex flex-col min-h-0">

              {/* Tabs header */}
              <TabsList className="grid w-full grid-cols-2 mx-4 mt-2 mb-2 flex-shrink-0">
                <TabsTrigger value="storms">Current Storms</TabsTrigger>
                <TabsTrigger value="predict">Predict Storm</TabsTrigger>
              </TabsList>

              {/* TAB: STORMS */}
              <TabsContent value="storms" className="mt-0 flex-col min-h-0 m-0 data-[state=active]:flex flex-1">

                {selectedStorm ? (
                  <div className="flex-1 flex flex-col min-h-0">

                    {/* Nút Back */}
                    <button
                      onClick={handleBackToList}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 flex-shrink-0"
                      aria-label="Back to storm list"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to List
                    </button>

                    {/* Scroll duy nhất cho storm info */}
                    <div className="flex-1 overflow-auto min-h-0">
                      <StormInfo storm={selectedStorm} />
                    </div>

                  </div>
                ) : (
                  // Scroll duy nhất cho danh sách storms
                  <div className="flex-1 overflow-auto min-h-0">
                    <StormTracker
                      storms={storms}
                      onStormSelect={handleStormSelect}
                    />
                  </div>
                )}

              </TabsContent>

              {/* TAB: PREDICT */}
              <TabsContent
                value="predict"
                className="flex-1 m-0 flex-col min-h-0 !p-0 data-[state=active]:flex"
              >
                {/* Scroll duy nhất trong tab Predict */}
                <div className="flex-1 overflow-auto p-4 min-h-0">
                  <StormPredictionForm
                    onPredictionResult={handlePredictionResult}
                    setIsLoading={setLoading}
                  />
                </div>
              </TabsContent>

            </Tabs>

          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer
        className="bg-white/80 backdrop-blur-sm border-t border-gray-200 relative z-10 dark:bg-gray-950/80 dark:border-gray-800"
        role="contentinfo"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div><p>© 2025 Hurricane Monitor. Simulation data for demo purposes.</p></div>
            <div className="flex items-center gap-4">
              <span>Data Source: NCICS (Live)</span>
              <span>Update: {new Date().toLocaleTimeString('en-US')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}