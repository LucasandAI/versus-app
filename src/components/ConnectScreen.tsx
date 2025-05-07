
import React, { useEffect } from 'react';
import LoginForm from './auth/LoginForm';
import { clearAllAuthData } from '@/integrations/supabase/safeClient';
import { Button } from './ui/button';

const ConnectScreen: React.FC = () => {
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Versus</h1>
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-primary rounded-full"></div>
          </div>
          <h2 className="font-medium text-gray-700 mx-auto whitespace-nowrap text-lg">
            The Competitive League for Runners
          </h2>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="space-y-4">
            {[
              { 
                number: 1, 
                title: "Create Your Club", 
                description: "Build a team of runners who share your competitive spirit" 
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
              <div key={feature.number} className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                  {feature.number}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <LoginForm />
        
        <div className="pt-4 text-sm text-gray-500">
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
