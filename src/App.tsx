import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DiscoverBarbers from "./pages/DiscoverBarbers";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import BecomeBarber from "./pages/BecomeBarber";
import BookingPage from "./pages/BookingPage";

import BarberDashboard from "./pages/barber/BarberDashboard";
import MyShop from "./pages/barber/MyShop";
import Services from "./pages/barber/Services";
import BarberBookings from "./pages/barber/BarberBookings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import BarberRequests from "./pages/admin/BarberRequests";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBarbers from "./pages/admin/AdminBarbers";

import NotFound from "./pages/NotFound";

// Create QueryClient outside component to prevent recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/discover" element={<DiscoverBarbers />} />
                <Route path="/bookings" element={<MyBookings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/become-barber" element={<BecomeBarber />} />
                <Route path="/book/:shopId" element={<BookingPage />} />
                
                {/* Barber Routes */}
                <Route path="/barber/dashboard" element={<BarberDashboard />} />
                <Route path="/barber/shop" element={<MyShop />} />
                <Route path="/barber/services" element={<Services />} />
                <Route path="/barber/bookings" element={<BarberBookings />} />
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/requests" element={<BarberRequests />} />
                <Route path="/admin/barbers" element={<AdminBarbers />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
