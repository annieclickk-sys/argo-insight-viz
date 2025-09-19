import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FloatChatLayout } from "./components/FloatChatLayout";
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
          <Route path="/chat" element={
            <FloatChatLayout>
              <ChatPage />
            </FloatChatLayout>
          } />
          <Route path="/dashboard" element={
            <FloatChatLayout>
              <DashboardPage />
            </FloatChatLayout>
          } />
          {/* Placeholder routes for other navigation items */}
          <Route path="/map" element={
            <FloatChatLayout>
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground">Geospatial Map</h1>
                <p className="text-muted-foreground">Interactive ocean mapping coming soon...</p>
              </div>
            </FloatChatLayout>
          } />
          <Route path="/floats" element={
            <FloatChatLayout>
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground">ARGO Floats</h1>
                <p className="text-muted-foreground">Float management interface coming soon...</p>
              </div>
            </FloatChatLayout>
          } />
          <Route path="/live" element={
            <FloatChatLayout>
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground">Live Data</h1>
                <p className="text-muted-foreground">Real-time data streams coming soon...</p>
              </div>
            </FloatChatLayout>
          } />
          <Route path="/database" element={
            <FloatChatLayout>
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground">Database</h1>
                <p className="text-muted-foreground">Database management interface coming soon...</p>
              </div>
            </FloatChatLayout>
          } />
          <Route path="/settings" element={
            <FloatChatLayout>
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">System configuration coming soon...</p>
              </div>
            </FloatChatLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
