import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import LiveTV from "@/pages/LiveTV";
import Movies from "@/pages/Movies";
import SeriesPage from "@/pages/SeriesPage";
import MovieDetail from "@/pages/MovieDetail";
import SeriesDetail from "@/pages/SeriesDetail";
import PlayerPage from "@/pages/PlayerPage";
import Favorites from "@/pages/Favorites";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/player/:type/:id/:ext?" element={
        <ProtectedRoute><PlayerPage /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><Home /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/live" element={
        <ProtectedRoute>
          <AppLayout><LiveTV /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/movies" element={
        <ProtectedRoute>
          <AppLayout><Movies /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/movies/:id" element={
        <ProtectedRoute>
          <AppLayout><MovieDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/series" element={
        <ProtectedRoute>
          <AppLayout><SeriesPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/series/:id" element={
        <ProtectedRoute>
          <AppLayout><SeriesDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/favorites" element={
        <ProtectedRoute>
          <AppLayout><Favorites /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout><SettingsPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
