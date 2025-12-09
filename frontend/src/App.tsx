import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from './components/ui/toaster';
import { WindyStateProvider } from './contexts/WindyStateContext';
import './index.css';
import { useTheme } from './hooks/use-theme';

const queryClient = new QueryClient();

const App = () => {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <WindyStateProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WindyStateProvider>
    </QueryClientProvider>
  );
};
  
export default App;