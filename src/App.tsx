import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { VoiceAssistant } from "@/components/voice";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import BecomeProvider from "./pages/BecomeProvider";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminTransactions from "./pages/admin/AdminTransactions";

// Provider pages
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderProducts from "./pages/provider/ProviderProducts";
import ProviderProductNew from "./pages/provider/ProviderProductNew";
import ProviderOrders from "./pages/provider/ProviderOrders";
import ProviderSettings from "./pages/provider/ProviderSettings";
import ProviderPublicProfile from "./pages/provider/ProviderPublicProfile";

// Client pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientCatalog from "./pages/client/ClientCatalog";
import ClientOrders from "./pages/client/ClientOrders";
import ProductDetail from "./pages/client/ProductDetail";
import ClientFavorites from "./pages/client/ClientFavorites";
import ClientSettings from "./pages/client/ClientSettings";
import ClientEventPlanner from "./pages/client/ClientEventPlanner";

// Team pages
import { AccountantDashboard, SupervisorDashboard, ModeratorDashboard, SupportDashboard } from "./pages/team";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/comment-ca-marche" element={<HowItWorks />} />
            <Route path="/devenir-prestataire" element={<BecomeProvider />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/team" element={<AdminTeam />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/providers" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            
            {/* Provider Routes */}
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/provider/products" element={<ProviderProducts />} />
            <Route path="/provider/products/new" element={<ProviderProductNew />} />
            <Route path="/provider/orders" element={<ProviderOrders />} />
            <Route path="/provider/settings" element={<ProviderSettings />} />
            <Route path="/provider/:id" element={<ProviderPublicProfile />} />
            
            {/* Client Routes */}
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/client/event-planner" element={<ClientEventPlanner />} />
            <Route path="/client/catalog" element={<ClientCatalog />} />
            <Route path="/client/orders" element={<ClientOrders />} />
            <Route path="/client/product/:id" element={<ProductDetail />} />
            <Route path="/client/favorites" element={<ClientFavorites />} />
            <Route path="/client/settings" element={<ClientSettings />} />
            
            {/* Team Routes */}
            <Route path="/team/accountant" element={<AccountantDashboard />} />
            <Route path="/team/supervisor" element={<SupervisorDashboard />} />
            <Route path="/team/moderator" element={<ModeratorDashboard />} />
            <Route path="/team/support" element={<SupportDashboard />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Voice Assistant - Floating on all pages */}
          <VoiceAssistant />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
