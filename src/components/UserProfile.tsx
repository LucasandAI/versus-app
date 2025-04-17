import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, MapPin, CheckCircle2, Link2, User, UserPlus } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import ClubInviteDialog from './admin/ClubInviteDialog';
import { Button } from './ui/button';

const UserProfile: React.FC = () => {
  const { selectedUser, setCurrentView, currentUser } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [selectedUser]);

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>No user selected</p>
        <button
          onClick={() => setCurrentView('home')}
          className="mt-4 text-primary hover:underline"
        >
          Go back home
        </button>
      </div>
    );
  }

  const adminClubs = currentUser?.clubs.filter(club => 
    club.members.some(member => 
      member.id === currentUser.id && member.isAdmin
    )
  ) || [];
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const isCurrentUserProfile = currentUser?.id === selectedUser?.id;
  const showInviteButton = !isCurrentUserProfile && adminClubs.length > 0;

  return (
    <div className="container-mobile py-10">
      <div className="md:flex md:items-start md:justify-between md:space-x-4">
        <div className="md:w-2/3">
          <div className="space-y-4">
            <div className="text-center md:text-left">
              {loading ? (
                <Skeleton className="mx-auto h-[100px] w-[100px] rounded-full" />
              ) : (
                <Avatar className="mx-auto h-[100px] w-[100px] md:mx-0">
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                  <AvatarFallback>{selectedUser.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
              )}
              <h1 className="mt-4 text-2xl font-bold">{loading ? <Skeleton className="h-6 w-48" /> : selectedUser.name}</h1>
              {showInviteButton && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 mt-2"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite to Club
                  </Button>
                  
                  <ClubInviteDialog 
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                    user={selectedUser as any}
                    adminClubs={adminClubs}
                  />
                </>
              )}
              <p className="text-gray-500">{loading ? <Skeleton className="h-4 w-32" /> : 'Runner'}</p>
              <div className="mt-2 flex items-center justify-center space-x-2 md:justify-start">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-12" />
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">
                      <CalendarDays className="mr-1.5 h-4 w-4" />
                      Since 2020
                    </Badge>
                    <Badge variant="secondary">
                      <MapPin className="mr-1.5 h-4 w-4" />
                      New York
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-4">
                  <h3 className="text-xl font-semibold">About</h3>
                  <p className="text-sm text-muted-foreground">
                    {loading ? <Skeleton className="h-4 w-full" /> : 'Passionate runner with a love for marathons and trail running.'}
                  </p>
                </div>
              </div>

              <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-4">
                  <h3 className="text-xl font-semibold">Details</h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-[100px_1fr] gap-4">
                      <div className="text-gray-500">User ID</div>
                      <div>{loading ? <Skeleton className="h-4 w-24" /> : selectedUser.id}</div>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-4">
                      <div className="text-gray-500">Account Status</div>
                      <div className="flex items-center">
                        {loading ? <Skeleton className="h-4 w-16" /> : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Verified
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-4">
                      <div className="text-gray-500">Strava</div>
                      <div>
                        {loading ? <Skeleton className="h-4 w-20" /> : (
                          <a href="#" className="flex items-center text-blue-500 hover:underline">
                            <Link2 className="mr-1 h-4 w-4" />
                            Connected
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-0 md:w-1/3">
          <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-4">
              <h3 className="text-xl font-semibold">Activity</h3>
              <div className="space-y-2">
                {loading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Recent Runs</p>
                        <p className="text-sm text-gray-500">5 runs this week</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Achievements</p>
                        <p className="text-sm text-gray-500">3 new badges</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
