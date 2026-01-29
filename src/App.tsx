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

// Accountant pages
import AccountantDashboard from "./pages/accountant/AccountantDashboard";
import AccountantTransactions from "./pages/accountant/AccountantTransactions";
import AccountantWithdrawals from "./pages/accountant/AccountantWithdrawals";
import AccountantReports from "./pages/accountant/AccountantReports";

// Supervisor pages
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorOrders from "./pages/supervisor/SupervisorOrders";

// Moderator pages
import ModeratorDashboard from "./pages/moderator/ModeratorDashboard";
import ModeratorProducts from "./pages/moderator/ModeratorProducts";
import ModeratorReports from "./pages/moderator/ModeratorReports";
import ModeratorProviders from "./pages/moderator/ModeratorProviders";
import ModeratorAccounts from "./pages/moderator/ModeratorAccounts";

// Support pages
import SupportDashboard from "./pages/support/SupportDashboard";
import SupportTickets from "./pages/support/SupportTickets";
import SupportUsers from "./pages/support/SupportUsers";
import SupportFAQ from "./pages/support/SupportFAQ";

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
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/providers" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/team" element={<AdminTeam />} />
            
            {/* Accountant Routes */}
            <Route path="/accountant" element={<AccountantDashboard />} />
            <Route path="/accountant/transactions" element={<AccountantTransactions />} />
            <Route path="/accountant/withdrawals" element={<AccountantWithdrawals />} />
            <Route path="/accountant/reports" element={<AccountantReports />} />
            
            {/* Supervisor Routes */}
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="/supervisor/orders" element={<SupervisorOrders />} />
            
            {/* Moderator Routes */}
            <Route path="/moderator" element={<ModeratorDashboard />} />
            <Route path="/moderator/products" element={<ModeratorProducts />} />
            <Route path="/moderator/reports" element={<ModeratorReports />} />
            <Route path="/moderator/providers" element={<ModeratorProviders />} />
            <Route path="/moderator/accounts" element={<ModeratorAccounts />} />
            
            {/* Support Routes */}
            <Route path="/support" element={<SupportDashboard />} />
            <Route path="/support/tickets" element={<SupportTickets />} />
            <Route path="/support/users" element={<SupportUsers />} />
            <Route path="/support/faq" element={<SupportFAQ />} />
            
            {/* Provider Routes */}
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/provider/products" element={<ProviderProducts />} />
            <Route path="/provider/products/new" element={<ProviderProductNew />} />
            <Route path="/provider/orders" element={<ProviderOrders />} />
            <Route path="/provider/settings" element={<ProviderSettings />} />
            <Route path="/provider/:id" element={<ProviderPublicProfile />} />
            
            {/* Client Routes */}
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/client/catalog" element={<ClientCatalog />} />
            <Route path="/client/orders" element={<ClientOrders />} />
            <Route path="/client/product/:id" element={<ProductDetail />} />
            <Route path="/client/favorites" element={<ClientFavorites />} />
            <Route path="/client/settings" element={<ClientSettings />} />
            
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
