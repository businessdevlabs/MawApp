
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import MyBookings from "./pages/MyBookings";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderProfile from "./pages/provider/ProviderProfile";
import ProviderBookings from "./pages/provider/ProviderBookings";
import ProviderSchedule from "./pages/provider/ProviderSchedule";
import ProviderServices from "./pages/provider/ProviderServices";
import ProviderPayments from "./pages/provider/ProviderPayments";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route 
                path="/" 
                element={
                  <ProtectedRoute redirectProvidersTo="/provider/dashboard">
                    <Home />
                  </ProtectedRoute>
                } 
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute redirectProvidersTo="/provider/dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/services" 
                element={
                  <ProtectedRoute redirectProvidersTo="/provider/dashboard">
                    <Services />
                  </ProtectedRoute>
                } 
              />
              <Route path="/service/:serviceId" element={<ServiceDetail />} />
              <Route path="/bookings" element={<MyBookings />} />
              
              {/* Provider Routes */}
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/provider/profile" element={<ProviderProfile />} />
              <Route path="/provider/bookings" element={<ProviderBookings />} />
              <Route path="/provider/schedule" element={<ProviderSchedule />} />
              <Route path="/provider/services" element={<ProviderServices />} />
              <Route path="/provider/payments" element={<ProviderPayments />} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
