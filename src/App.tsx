import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Growth from "./pages/Growth";
import Presence from "./pages/Presence";
import Customers from "./pages/Customers";
import CustomersDatabase from "./pages/CustomersDatabase";
import CustomerDetail from "./pages/CustomerDetail";
import RaioX from "./pages/RaioX";
import ActionRegistry from "./pages/ActionRegistry";
import NewAction from "./pages/NewAction";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import UnlinkedTickets from "./pages/UnlinkedTickets";
import { GlobalSearch, useGlobalSearch } from "./components/search/GlobalSearch";
import { useNewActionShortcut } from "./hooks/useNewActionShortcut";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { open, setOpen } = useGlobalSearch();
  useNewActionShortcut();

  return (
    <>
      <GlobalSearch open={open} onOpenChange={setOpen} />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/pipeline" element={<ProtectedRoute><Growth /></ProtectedRoute>} />
        <Route path="/growth" element={<ProtectedRoute><Presence /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/cdb" element={<ProtectedRoute><CustomersDatabase /></ProtectedRoute>} />
        <Route path="/raio-x" element={<ProtectedRoute><RaioX /></ProtectedRoute>} />
        <Route path="/customer/:customerId" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
        <Route path="/customer-detail" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
        <Route path="/actions" element={<ProtectedRoute><ActionRegistry /></ProtectedRoute>} />
        <Route path="/actions/new" element={<ProtectedRoute><NewAction /></ProtectedRoute>} />
        <Route path="/actions/:id" element={<ProtectedRoute><NewAction /></ProtectedRoute>} />
        <Route path="/tickets/unlinked" element={<ProtectedRoute><UnlinkedTickets /></ProtectedRoute>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
