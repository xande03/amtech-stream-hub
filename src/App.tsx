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
import MovieFinder from "@/pages/MovieFinder";
import History from "@/pages/History";
import Downloads from "@/pages/Downloads";
import SharedPlayer from "@/pages/SharedPlayer";

import SettingsPage from "@/pages/SettingsPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "./components/ThemeProvider";
import { CustomColorsProvider } from "./contexts/CustomColorsContext";

const queryClient = new QueryClient();

import { useLocation } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import PageTransition from "@/components/PageTransition";

function AppRoutes() {
  const { isConfigured } = useAuth();
  const location = useLocation();

  const sharedRoutes = (
    <Route path="/view/:type/:id/:name?" element={<SharedPlayer />} />
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split('/')[1]}>
        {!isConfigured ? (
          <>
            {sharedRoutes}
            <Route path="/settings" element={<AppLayout><PageTransition><SettingsPage /></PageTransition></AppLayout>} />
            <Route path="*" element={<Navigate to="/settings" replace />} />
          </>
        ) : (
          <>
            <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
            <Route path="/player/:type/:id/:ext?" element={<PlayerPage />} />
            {sharedRoutes}
            <Route path="/" element={<AppLayout><PageTransition><Home /></PageTransition></AppLayout>} />
            <Route path="/live" element={<AppLayout><PageTransition><LiveTV /></PageTransition></AppLayout>} />
            <Route path="/movies" element={<AppLayout><PageTransition><Movies /></PageTransition></AppLayout>} />
            <Route path="/movies/:id" element={<AppLayout><PageTransition><MovieDetail /></PageTransition></AppLayout>} />
            <Route path="/series" element={<AppLayout><PageTransition><SeriesPage /></PageTransition></AppLayout>} />
            <Route path="/series/:id" element={<AppLayout><PageTransition><SeriesDetail /></PageTransition></AppLayout>} />
            <Route path="/favorites" element={<AppLayout><PageTransition><Favorites /></PageTransition></AppLayout>} />
            <Route path="/finder" element={<AppLayout><PageTransition><MovieFinder /></PageTransition></AppLayout>} />
            <Route path="/history" element={<AppLayout><PageTransition><History /></PageTransition></AppLayout>} />
            <Route path="/downloads" element={<AppLayout><PageTransition><Downloads /></PageTransition></AppLayout>} />
            <Route path="/settings" element={<AppLayout><PageTransition><SettingsPage /></PageTransition></AppLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </AnimatePresence>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <CustomColorsProvider>
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
      </CustomColorsProvider>
    </ThemeProvider>
  );
};

export default App;
