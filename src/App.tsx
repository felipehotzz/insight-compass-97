import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Growth from "./pages/Growth";
import Presence from "./pages/Presence";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import ActionRegistry from "./pages/ActionRegistry";
import NewAction from "./pages/NewAction";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/presence" element={<Presence />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customer-detail" element={<CustomerDetail />} />
          <Route path="/actions" element={<ActionRegistry />} />
          <Route path="/actions/new" element={<NewAction />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
