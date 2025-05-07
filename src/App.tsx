import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatDrawerProvider } from "./context/ChatDrawerContext";
import { UnreadMessagesProvider } from "./context/UnreadMessagesContext";
import { DirectConversationsProvider } from "./context/DirectConversationsContext";
import { AppProvider } from "./context/AppContext";
import AppContent from "./components/AppContent";
import Index from "./pages/Index";
import ConnectDevice from "./pages/ConnectDevice";
import NotFound from "./pages/NotFound";

// Import the fetchActivityData function
import { fetchActivityData } from './healthkitService';  // Adjust the path as needed

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Simulating the user logging in (replace with actual login logic)
    const userId = 'user-uuid'; // Replace this with the actual logged-in user’s ID

    // Call fetchActivityData to fetch and sync the user's activity data from HealthKit to Supabase
    fetchActivityData(userId);
  }, []);  // Empty dependency array makes this run once when the component mounts

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <UnreadMessagesProvider>
            <DirectConversationsProvider>
              <ChatDrawerProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<AppContent><Index /></AppContent>} />
                    <Route path="/connect-device" element={<AppContent><ConnectDevice /></AppContent>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<AppContent><NotFound /></AppContent>} />
                  </Routes>
                </BrowserRouter>
              </ChatDrawerProvider>
            </DirectConversationsProvider>
          </UnreadMessagesProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
