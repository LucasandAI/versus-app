
import React from 'react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from '@/hooks/use-mobile';
import { LogOut, Settings, Share2 } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { selectedUser, setCurrentView, setSelectedClub } = useApp();
  const isMobile = useIsMobile();
  const [loading, setLoading] = React.useState(false);

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
            
            <button 
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <Separator />

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Social</h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedUser.instagram && (
                <a href={`https://instagram.com/${selectedUser.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="font-medium">Instagram</span>
                </a>
              )}
              {selectedUser.twitter && (
                <a href={`https://twitter.com/${selectedUser.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="font-medium">Twitter</span>
                </a>
              )}
              {selectedUser.facebook && (
                <a href={`https://facebook.com/${selectedUser.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="font-medium">Facebook</span>
                </a>
              )}
              {selectedUser.linkedin && (
                <a href={`https://linkedin.com/in/${selectedUser.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="font-medium">LinkedIn</span>
                </a>
              )}
              {selectedUser.website && (
                <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="font-medium">Website</span>
                </a>
              )}
              {selectedUser.tiktok && (
                <a href={`https://tiktok.com/@${selectedUser.tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                  <span className="font-medium">TikTok</span>
                </a>
              )}
            </div>
          </div>

          <Separator />

          {/* Best League */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Best League</h3>
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Current League</p>
                <p className="text-lg font-bold">Diamond</p>
              </div>
              <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">D</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Achievements */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Achievements</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-1">
                  <span className="text-amber-600 text-xl font-bold">🏅</span>
                </div>
                <span className="text-xs text-center">Top Runner</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                  <span className="text-emerald-600 text-xl font-bold">⚡</span>
                </div>
                <span className="text-xs text-center">Streak 30+</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                  <span className="text-blue-600 text-xl font-bold">🌟</span>
                </div>
                <span className="text-xs text-center">Founder</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Clubs */}
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

          <Separator />
          
          {/* Log Out & Share buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button className="flex items-center justify-center gap-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm font-medium">
              <Share2 className="h-4 w-4" />
              <span>Share Profile</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm font-medium text-red-500">
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
