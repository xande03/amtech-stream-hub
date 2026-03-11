import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import AppLayout from "@/components/AppLayout";
import Home from "@/pages/Home";
import LiveTV from "@/pages/LiveTV";
import Movies from "@/pages/Movies";
import SeriesPage from "@/pages/SeriesPage";
import MovieDetail from "@/pages/MovieDetail";
import SeriesDetail from "@/pages/SeriesDetail";
import PlayerPage from "@/pages/PlayerPage";
import Favorites from "@/pages/Favorites";
import History from "@/pages/History";
import SettingsPage from "@/pages/SettingsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <Routes>
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
        <Route path="*" element={<Navigate to="/settings" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/player/:type/:id/:ext?" element={<PlayerPage />} />
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/live" element={<AppLayout><LiveTV /></AppLayout>} />
      <Route path="/movies" element={<AppLayout><Movies /></AppLayout>} />
      <Route path="/movies/:id" element={<AppLayout><MovieDetail /></AppLayout>} />
      <Route path="/series" element={<AppLayout><SeriesPage /></AppLayout>} />
      <Route path="/series/:id" element={<AppLayout><SeriesDetail /></AppLayout>} />
      <Route path="/favorites" element={<AppLayout><Favorites /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
