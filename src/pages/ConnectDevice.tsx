
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import { Card, CardContent } from '@/components/ui/card';

const ConnectDevice: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handleConnectAppleHealth = () => {
    // TODO: Implement Apple Health connection logic
    console.log('Connecting to Apple Health...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Track Distance" 
        onBack={handleBack}
      />
      <div className="container-mobile pt-20 pb-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Track Your Distance Automatically</h2>
          <p className="text-gray-600 text-sm">
            Connect to Apple Health to automatically sync your running distance with Versus
          </p>
        </div>
        
        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <button 
              onClick={handleConnectAppleHealth}
              className="w-full p-6 text-left"
            >
              <div>
                <h3 className="font-medium text-base mb-1">Apple Health</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Automatically sync your running workouts and distance data
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>• Works with iPhone and Apple Watch</div>
                  <div>• Tracks distance, pace, and workout duration</div>
                  <div>• Secure and private data sharing</div>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
        
        {/* Apple Health Badge - positioned below the card */}
        <div className="flex justify-center mt-4">
          <img 
            src="/lovable-uploads/f7254a58-4feb-4599-a07c-7544057d149e.png" 
            alt="Works with Apple Health" 
            className="h-16 object-contain"
          />
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Connect your Apple Health account</li>
            <li>• Run with your iPhone or Apple Watch</li>
            <li>• Distance automatically syncs to Versus</li>
            <li>• Contribute to your club's weekly matches</li>
          </ul>
        </div>
        
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">Coming Soon</h4>
          <p className="text-sm text-gray-600">
            Support for other wearables and fitness devices will be available soon, including Garmin, Fitbit, Strava, and more.
          </p>
        </div>
        
        <p className="mt-6 text-xs text-gray-500 text-center">
          Apple Health integration will automatically sync your runs with Versus
        </p>
      </div>
    </div>
  );
};

export default ConnectDevice;
