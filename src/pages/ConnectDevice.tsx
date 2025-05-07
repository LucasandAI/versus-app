
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Watch } from 'lucide-react';
import AppHeader from '@/components/shared/AppHeader';
import { Card, CardContent } from '@/components/ui/card';

const ConnectDevice: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const deviceOptions = [
    {
      id: 'apple-watch',
      name: 'Apple Watch',
      description: 'Connect your Apple Watch to track runs automatically',
      logo: '/lovable-uploads/c9f15dff-1812-49ea-9464-3969ddee6e5a.png'
    },
    {
      id: 'garmin',
      name: 'Garmin Watch',
      description: 'Connect your Garmin device for accurate tracking',
      logo: '/lovable-uploads/f8b9b002-af8f-4f3f-b2b3-0a95d21fe7d4.png'
    },
    {
      id: 'other',
      name: 'Other Devices',
      description: 'Connect other smartwatches like Fitbit, Suunto, etc.',
      icon: Watch
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Connect a Device" 
        onBack={handleBack}
      />
      <div className="container-mobile py-8">
        <h2 className="text-xl font-semibold mb-6">Choose your device</h2>
        
        <div className="space-y-4">
          {deviceOptions.map(device => (
            <Card key={device.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-0">
                <button className="w-full p-4 text-left flex items-center">
                  <div className="flex-shrink-0 mr-4 w-12 h-12 flex items-center justify-center">
                    {device.logo ? (
                      <img 
                        src={device.logo} 
                        alt={`${device.name} logo`} 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : device.icon ? (
                      <device.icon className="h-8 w-8 text-primary" />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-medium text-base">{device.name}</h3>
                    <p className="text-sm text-gray-500">{device.description}</p>
                  </div>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <p className="mt-8 text-sm text-gray-500 text-center">
          Connected devices will automatically sync your runs with Versus
        </p>
      </div>
    </div>
  );
};

export default ConnectDevice;
