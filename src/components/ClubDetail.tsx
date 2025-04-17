
import React from 'react';
import { ArrowLeft, MessageCircle, Info, User as UserIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import MatchProgressBar from './shared/MatchProgressBar';
import UserAvatar from './shared/UserAvatar';
import { ClubMember } from '@/types';
import Button from './shared/Button';

const ClubDetail: React.FC = () => {
  const { selectedClub, setCurrentView } = useApp();
  
  if (!selectedClub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>No club selected</p>
        <button 
          onClick={() => setCurrentView('home')}
          className="mt-4 text-primary hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  const currentMatch = selectedClub.currentMatch;
  
  return (
    <div className="pb-20 relative">
      <div className="bg-primary/95 text-white p-4 sticky top-0 z-10">
        <div className="container-mobile">
          <div className="flex items-center">
            <button onClick={() => setCurrentView('home')} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">{selectedClub.name}</h1>
          </div>
        </div>
      </div>

      <div className="container-mobile pt-4">
        {currentMatch && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Current Match</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Ends in 3 days
              </span>
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="text-center">
                <div className="bg-gray-200 h-14 w-14 mx-auto rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm">{currentMatch.homeClub.name.substring(0, 2)}</span>
                </div>
                <h3 className="mt-1 font-medium text-sm">{currentMatch.homeClub.name}</h3>
                <p className="font-bold text-lg">{currentMatch.homeClub.totalDistance.toFixed(1)} km</p>
              </div>

              <div className="text-center px-2">
                <span className="text-xs font-medium text-gray-500 uppercase">VS</span>
              </div>

              <div className="text-center">
                <div className="bg-gray-200 h-14 w-14 mx-auto rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm">{currentMatch.awayClub.name.substring(0, 2)}</span>
                </div>
                <h3 className="mt-1 font-medium text-sm">{currentMatch.awayClub.name}</h3>
                <p className="font-bold text-lg">{currentMatch.awayClub.totalDistance.toFixed(1)} km</p>
              </div>
            </div>

            <MatchProgressBar
              homeDistance={currentMatch.homeClub.totalDistance}
              awayDistance={currentMatch.awayClub.totalDistance}
              className="mb-4"
            />

            <div className="space-y-3 mt-6">
              <h3 className="font-medium text-sm border-b pb-2">Your Team's Contributions</h3>
              {currentMatch.homeClub.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={member.name} image={member.avatar} size="sm" />
                    <span className="text-sm">{member.name}</span>
                  </div>
                  <span className="font-medium text-sm">
                    {member.distanceContribution?.toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Members</h2>
            <span className="text-xs text-gray-500">
              {selectedClub.members.length}/5 members
            </span>
          </div>

          <div className="space-y-3">
            {selectedClub.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar name={member.name} image={member.avatar} size="sm" />
                  <span>{member.name}</span>
                </div>
                {member.isAdmin && (
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>

          {selectedClub.members.length < 5 && (
            <Button variant="outline" size="sm" fullWidth className="mt-4">
              Invite Friend
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="font-bold mb-2">Club Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Division</p>
              <p className="font-medium">{selectedClub.division}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Match Record</p>
              <p className="font-medium">3W - 1L</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Total Distance</p>
              <p className="font-medium">243.7 km</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Avg. Per Member</p>
              <p className="font-medium">81.2 km</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6 mb-8">
          <Button variant="outline" size="sm" className="flex-1 mr-2" icon={<MessageCircle className="h-4 w-4" />}>
            Chat
          </Button>
          <Button variant="outline" size="sm" className="flex-1" icon={<Info className="h-4 w-4" />}>
            Club Info
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;
