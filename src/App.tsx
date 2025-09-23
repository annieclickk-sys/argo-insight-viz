import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DatabasePage } from "./pages/DatabasePage";
import { GeospatialPage } from "./pages/GeospatialPage";
import { LiveDataPage } from "./pages/LiveDataPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ArgoFloatsPage } from "./pages/ArgoFloatsPage";
import { FloatChatLayout } from "./components/FloatChatLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="dark">
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
              <GeospatialPage />
            </FloatChatLayout>
          } />
          <Route path="/floats" element={
            <FloatChatLayout>
              <ArgoFloatsPage />
            </FloatChatLayout>
          } />
          <Route path="/live" element={
            <FloatChatLayout>
              <LiveDataPage />
            </FloatChatLayout>
          } />
          <Route path="/database" element={
            <FloatChatLayout>
              <DatabasePage />
            </FloatChatLayout>
          } />
          <Route path="/settings" element={
            <FloatChatLayout>
              <SettingsPage />
            </FloatChatLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
