
import React, { useEffect, useState } from 'react';
import LoginForm from './auth/LoginForm';
import { clearAllAuthData } from '@/integrations/supabase/safeClient';
import { Button } from './ui/button';
import { useApp } from '@/context/AppContext';

const ConnectScreen: React.FC = () => {
  const { needsProfileCompletion } = useApp();
  const [logoLoaded, setLogoLoaded] = useState(false);
  
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
    <div className="flex flex-col min-h-screen px-4 py-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-100">
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full min-h-0">
        {/* Top section with logo and tagline */}
        <div className="flex-shrink-0 space-y-2 text-center pt-2">
          <div className="flex justify-center">
            {!logoLoaded && (
              <div className="w-24 sm:w-28 h-24 sm:h-28 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                <div className="text-xs text-gray-400">Loading...</div>
              </div>
            )}
            <img 
              src="/lovable-uploads/97b51fd2-4445-4dab-9274-d2fd2e0b8bec.png" 
              alt="Versus Logo" 
              className={`w-24 sm:w-28 h-auto object-contain transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              loading="eager"
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)}
            />
          </div>
          <div className="flex justify-center">
            <div className="w-10 h-0.5 bg-primary rounded-full"></div>
          </div>
          <h2 className="font-medium text-gray-700 mx-auto whitespace-nowrap text-sm">
            The Competitive League for Runners
          </h2>
        </div>

        {/* Middle section with content */}
        <div className="flex-1 flex flex-col justify-center space-y-3 w-full min-h-0 py-4">
          {/* Only show app info box if not in profile completion mode */}
          {!needsProfileCompletion && (
            <div className="bg-white shadow-md rounded-lg p-3">
              <div className="space-y-2">
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
                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">
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
        <div className="flex-shrink-0 pb-2">
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
