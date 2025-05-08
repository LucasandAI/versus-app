import React, { useState, useEffect, Suspense } from 'react';
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { Loader2 } from "lucide-react"
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AppContent } from './components/AppContent';
import { NetworkStatus } from './components/NetworkStatus';
import { DirectConversationsProvider } from './context/DirectConversationsContext';
import { ChatDrawerProvider as ChatDrawerContextProvider } from './context/ChatDrawerContext';
import { ChatProvider } from './context/ChatContext';

function App() {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const {
    currentUser,
    currentView,
    selectedClub,
		selectedUser,
    setCurrentUser,
    setCurrentView,
    setSelectedClub,
		setSelectedUser,
    signIn,
    signOut,
    createClub,
    refreshCurrentUser
  } = useApp();

  useEffect(() => {
    const checkSession = async () => {
      // Check if the user is logged in
      if (currentUser) {
        setIsSessionReady(true);
      } else {
        setIsSessionReady(false);
      }
    };

    checkSession();
  }, [currentUser]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <div className="flex flex-col min-h-screen">
          {/* Only show app UI when session is ready */}
          {isSessionReady ? (
            <AppProvider 
              currentUser={currentUser} 
              currentView={currentView} 
              selectedClub={selectedClub}
              selectedUser={selectedUser}
              isSessionReady={isSessionReady}
              needsProfileCompletion={needsProfileCompletion}
              setCurrentUser={setCurrentUser}
              setCurrentView={setCurrentView}
              setSelectedClub={setSelectedClub} 
              setSelectedUser={setSelectedUser}
              signIn={signIn}
              signOut={signOut} 
              createClub={createClub} 
              refreshCurrentUser={refreshCurrentUser}
              setNeedsProfileCompletion={setNeedsProfileCompletion}
            >
              <ChatProvider>
                <DirectConversationsProvider>
                  <UnreadMessagesProvider>
                    <ChatDrawerContextProvider>
                      <Header />
                      <main className="flex-1 flex flex-col">
                        <Suspense fallback={<div className="flex-1 flex justify-center items-center"><Loader2 className="h-10 w-10 animate-spin" /></div>}>
                          <AppContent />
                        </Suspense>
                      </main>
                      <NetworkStatus />
                    </ChatDrawerContextProvider>
                  </UnreadMessagesProvider>
                </DirectConversationsProvider>
              </ChatProvider>
            </AppProvider>
          ) : (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="h-16 w-16 animate-spin" />
            </div>
          )}
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
