
import React from 'react';
import Button from './shared/Button';
import { useApp } from '@/context/AppContext';
import StravaConnectLogo from '@/assets/strava-connect-logo.png';
import StravaPoweredByLogo from '@/assets/strava-powered-by-logo.png';

const ConnectScreen: React.FC = () => {
  const { connectToStrava } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Versus</h1>
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-strava rounded-full"></div>
          </div>
          <h2 className="text-xl font-medium text-gray-700 mx-auto whitespace-nowrap">
            The Competitive Running League for Strava Athletes
          </h2>
        </div>

        <div className="py-8">
          <div className="space-y-6 text-left">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-strava flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Create Your Club</h3>
                <p className="mt-1 text-gray-500">
                  Build a team of runners who share your competitive spirit
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-strava flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Compete Weekly</h3>
                <p className="mt-1 text-gray-500">
                  Get matched against similar clubs every Monday
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-strava flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Climb the Ranks</h3>
                <p className="mt-1 text-gray-500">
                  Win matches to ascend through leagues
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            variant="strava" 
            size="lg" 
            fullWidth 
            onClick={connectToStrava}
            className="p-0 bg-transparent hover:bg-transparent"
          >
            <img 
              src={StravaConnectLogo} 
              alt="Connect with Strava" 
              className="w-full max-w-full h-auto object-contain" 
              onError={(e) => {
                console.error('Strava Connect Logo failed to load', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          </Button>
          <p className="text-xs text-gray-500">
            We'll sync your running activities automatically
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <img 
            src={StravaPoweredByLogo} 
            alt="Powered by Strava" 
            className="h-8 w-auto object-contain" 
            onError={(e) => {
              console.error('Powered by Strava Logo failed to load', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ConnectScreen;

