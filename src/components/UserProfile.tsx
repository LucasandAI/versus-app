import React from 'react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useMediaQuery } from '@/hooks/use-media-query';

const UserProfile: React.FC = () => {
  const { selectedUser, setCurrentView, setSelectedClub, loading } = useApp();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className={`w-full ${isMobile ? 'mx-4' : 'max-w-md mx-auto'} mt-4 p-6 rounded-lg`}>
        <div className="flex flex-col space-y-4 w-full">
          <div className="flex items-center gap-6">
            {loading ? (
              <div className="h-24 w-24 rounded-full flex-shrink-0">
                <Skeleton className="h-full w-full rounded-full" />
              </div>
            ) : (
              <UserAvatar 
                name={selectedUser.name} 
                image={selectedUser.avatar} 
                size="lg" 
                className="h-24 w-24 flex-shrink-0"
              />
            )}
            
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {loading ? <Skeleton className="h-6 w-32" /> : selectedUser.name}
              </h2>
              <p className="text-gray-500">
                {loading ? <Skeleton className="h-4 w-24" /> : selectedUser.bio || 'Strava Athlete'}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Clubs</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : selectedUser.clubs.length > 0 ? (
              <div className="space-y-2">
                {selectedUser.clubs.map(club => (
                  <button 
                    key={club.id} 
                    className="flex items-center gap-4 p-3 rounded-md hover:bg-gray-100 w-full text-left"
                    onClick={() => {
                      setSelectedClub(club);
                      setCurrentView('clubDetail');
                    }}
                  >
                    <UserAvatar name={club.name} image={club.logo || ''} size="sm" />
                    <span className="font-medium">{club.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No clubs joined yet.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
