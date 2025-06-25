
import React, { useEffect } from 'react';
import LoginForm from './auth/LoginForm';
import { clearAllAuthData } from '@/integrations/supabase/safeClient';
import { Button } from './ui/button';
import { useApp } from '@/context/AppContext';

const ConnectScreen: React.FC = () => {
  const { needsProfileCompletion } = useApp();
  
  // Force logout when this component mounts to ensure clean testing state
  useEffect(() => {
    // Check if there's a force logout parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      clearAllAuthData().then(() => {
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, []);

  const handleForceLogout = async () => {
    await clearAllAuthData();
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen px-4 py-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-100">
      <div className="flex-1 flex flex-col items-center justify-between max-w-md mx-auto w-full">
        {/* Top section with logo and tagline */}
        <div className="flex-shrink-0 space-y-2 text-center pt-4">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/97b51fd2-4445-4dab-9274-d2fd2e0b8bec.png" 
              alt="Versus Logo" 
              className="w-32 sm:w-40 h-auto object-contain"
            />
          </div>
          <div className="flex justify-center">
            <div className="w-12 h-0.5 bg-primary rounded-full"></div>
          </div>
          <h2 className="font-medium text-gray-700 mx-auto whitespace-nowrap text-sm sm:text-base">
            The Competitive League for Runners
          </h2>
        </div>

        {/* Middle section with content */}
        <div className="flex-1 flex flex-col justify-center space-y-4 w-full">
          {/* Only show app info box if not in profile completion mode */}
          {!needsProfileCompletion && (
            <div className="bg-white shadow-md rounded-lg p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {[
                  { 
                    number: 1, 
                    title: "Create Your Club", 
                    description: "Build a team of competitive runners" 
                  },
                  { 
                    number: 2, 
                    title: "Compete", 
                    description: "Challenge other clubs in 7-day matches" 
                  },
                  { 
                    number: 3, 
                    title: "Climb the Ranks", 
                    description: "Win matches to ascend through leagues" 
                  }
                ].map((feature) => (
                  <div key={feature.number} className="flex items-center space-x-3">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm">
                      {feature.number}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <LoginForm />
        </div>
        
        {/* Bottom section with clear session button */}
        <div className="flex-shrink-0 pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleForceLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectScreen;
