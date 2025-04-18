import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Search, UserPlus, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from './shared/UserAvatar';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { toast } from "@/hooks/use-toast";
import ChatDrawer from './chat/ChatDrawer';
import SupportPopover from './shared/SupportPopover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Button from './shared/Button';
import ClubCard from './club/ClubCard';
import AvailableClubs from './club/AvailableClubs';
import CreateClubDialog from './club/CreateClubDialog';
import { formatLeagueWithTier } from '@/lib/format';
import NotificationPopover from './shared/NotificationPopover';

const mockClubs: Club[] = [
  {
    id: '1',
    name: 'Weekend Warriors',
    logo: '/placeholder.svg',
    division: 'Silver',
    tier: 2,
    members: [
      { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
      { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false },
      { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false },
      { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false },
      { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false },
    ],
    currentMatch: {
      id: 'm1',
      homeClub: {
        id: '1',
        name: 'Weekend Warriors',
        logo: '/placeholder.svg',
        totalDistance: 62.5,
        members: [
          { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 15.3 },
          { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.7 },
          { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.5 },
          { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.2 },
          { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.8 },
        ]
      },
      awayClub: {
        id: '3',
        name: 'Running Rebels',
        logo: '/placeholder.svg',
        totalDistance: 57.2,
        members: [
          { id: '6', name: 'Sarah Swift', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 12.8 },
          { id: '7', name: 'Mike Miler', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.4 },
          { id: '8', name: 'Lisa Long', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.0 },
          { id: '9', name: 'David Dash', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.5 },
          { id: '10', name: 'Kate Speed', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.5 },
        ]
      },
      startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    },
    matchHistory: []
  },
  {
    id: '2',
    name: 'Road Runners',
    logo: '/placeholder.svg',
    division: 'Gold',
    tier: 1,
    members: [
      { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true },
      { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false },
      { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false },
      { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false },
      { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false },
    ],
    currentMatch: {
      id: 'm2',
      homeClub: {
        id: '2',
        name: 'Road Runners',
        logo: '/placeholder.svg',
        totalDistance: 78.3,
        members: [
          { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.1 },
          { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 15.4 },
          { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
          { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 14.2 },
          { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 13.8 },
        ]
      },
      awayClub: {
        id: '4',
        name: 'Trail Blazers',
        logo: '/placeholder.svg',
        totalDistance: 85.1,
        members: [
          { id: '13', name: 'Mark Move', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.3 },
          { id: '14', name: 'Eva Exercise', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.5 },
          { id: '15', name: 'Tom Track', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 17.3 },
          { id: '16', name: 'Susan Step', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.2 },
          { id: '17', name: 'Robert Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
        ]
      },
      startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    },
    matchHistory: []
  }
];

const availableClubs = [
  {
    id: 'ac1',
    name: 'Morning Joggers',
    division: 'Silver',
    tier: 3,
    members: 3
  },
  {
    id: 'ac2',
    name: 'Hill Climbers',
    division: 'Gold',
    tier: 2,
    members: 4
  },
  {
    id: 'ac3',
    name: 'Urban Pacers',
    division: 'Bronze',
    tier: 5,
    members: 2
  }
];

const MAX_CLUBS_PER_USER = 3;

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser, setCurrentUser } = useApp();
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createClubDialogOpen, setCreateClubDialogOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(chatNotifications);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  
  useEffect(() => {
    const loadNotificationsFromStorage = () => {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        try {
          const parsedNotifications = JSON.parse(storedNotifications);
          setNotifications(parsedNotifications);
        } catch (error) {
          console.error("Error parsing notifications:", error);
          initializeDefaultNotifications();
        }
      } else {
        initializeDefaultNotifications();
      }
    };
    
    const initializeDefaultNotifications = () => {
      const defaultNotifications = [
        {
          id: '1',
          userId: '2',
          userName: 'Jane Sprinter',
          userAvatar: '/placeholder.svg',
          clubId: '1',
          clubName: 'Weekend Warriors',
          distance: 5.2,
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: '2',
          userId: '3',
          userName: 'Bob Marathon',
          userAvatar: '/placeholder.svg',
          clubId: '1',
          clubName: 'Weekend Warriors',
          distance: 10.7,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: '3',
          userId: '7',
          userName: 'Alice Sprint',
          userAvatar: '/placeholder.svg',
          clubId: '2',
          clubName: 'Road Runners',
          distance: 8.3,
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ];
      setNotifications(defaultNotifications);
      localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
    };
    
    loadNotificationsFromStorage();
    
    const handleFocus = () => {
      loadNotificationsFromStorage();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  useEffect(() => {
    setUnreadMessages(chatNotifications);
    
    const savedTickets = localStorage.getItem('supportTickets');
    if (savedTickets) {
      setSupportTickets(JSON.parse(savedTickets));
    }
    
    const handleUnreadMessagesUpdated = () => {
      const savedUnread = localStorage.getItem('unreadMessages');
      if (savedUnread) {
        try {
          const unreadMap = JSON.parse(savedUnread);
          const totalUnread = Object.values(unreadMap).reduce(
            (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0), 
            0
          );
          setUnreadMessages(Number(totalUnread));
        } catch (error) {
          console.error("Error parsing unread messages:", error);
        }
      } else {
        setUnreadMessages(0);
      }
    };
    
    window.addEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    
    return () => {
      window.removeEventListener('unreadMessagesUpdated', handleUnreadMessagesUpdated);
    };
  }, [chatNotifications]);
  
  useEffect(() => {
    localStorage.setItem('supportTickets', JSON.stringify(supportTickets));
  }, [supportTickets]);
  
  const userClubs = currentUser?.clubs || [];
  const isAtClubCapacity = userClubs.length >= MAX_CLUBS_PER_USER;

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: '/placeholder.svg',
      stravaConnected: true,
      clubs: []
    });
    setCurrentView('profile');
  };

  const handleRequestToJoin = (clubId: string, clubName: string) => {
    if (isAtClubCapacity) {
      toast({
        title: "Club Limit Reached",
        description: `You can join a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Request Sent",
      description: `Your request to join ${clubName} has been sent.`,
    });
  };

  const handleOpenChat = () => {
    setChatDrawerOpen(true);
  };

  const handleOpenSearch = () => {
    if (isAtClubCapacity) {
      toast({
        title: "Club Limit Reached",
        description: `You can join a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return;
    }
    setSearchDialogOpen(true);
  };

  const handleCreateClub = () => {
    if (isAtClubCapacity) {
      toast({
        title: "Club Limit Reached",
        description: `You can create a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return;
    }
    setCreateClubDialogOpen(true);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  };

  const handleJoinClub = (clubId: string, clubName: string) => {
    if (!currentUser) return;
    
    if (currentUser.clubs.length >= MAX_CLUBS_PER_USER) {
      toast({
        title: "Club Limit Reached",
        description: `You can join a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return;
    }
    
    const allClubs = localStorage.getItem('clubs') || '[]';
    const clubs = JSON.parse(allClubs);
    
    let clubToJoin = clubs.find((club: any) => club.id === clubId);
    
    if (!clubToJoin) {
      const mockClub = availableClubs.find(club => club.id === clubId);
      
      if (mockClub) {
        clubToJoin = {
          id: mockClub.id,
          name: mockClub.name,
          logo: '/placeholder.svg',
          division: mockClub.division,
          tier: mockClub.tier,
          members: [],
          currentMatch: null,
          matchHistory: []
        };
        
        clubs.push(clubToJoin);
      } else {
        clubToJoin = {
          id: clubId,
          name: clubName,
          logo: '/placeholder.svg',
          division: 'Bronze',
          tier: 3,
          members: [],
          currentMatch: null,
          matchHistory: []
        };
        
        clubs.push(clubToJoin);
      }
    }
    
    if (clubToJoin && !clubToJoin.members.some((member: any) => member.id === currentUser.id)) {
      clubToJoin.members.push({
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar || '/placeholder.svg',
        isAdmin: false
      });
      
      localStorage.setItem('clubs', JSON.stringify(clubs));
      
      const updatedUser = {
        ...currentUser,
        clubs: [...currentUser.clubs, clubToJoin]
      };
      
      setCurrentUser(updatedUser);
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      toast({
        title: "Club Joined",
        description: `You have successfully joined ${clubName}!`
      });
    } else {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubName}.`,
        variant: "destructive"
      });
    }
  };

  const handleDeclineInvite = (notificationId: string) => {
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    setNotifications(updatedNotifications);
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    toast({
      title: "Invitation Declined",
      description: "You have declined the club invitation."
    });
  };

  const handleCreateSupportTicket = (ticketId: string, subject: string, message: string) => {
    if (!currentUser) return;
    
    const newTicket: SupportTicket = {
      id: ticketId,
      subject,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: Date.now().toString(),
          text: message,
          sender: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar || '/placeholder.svg'
          },
          timestamp: new Date().toISOString(),
          isSupport: false
        },
        {
          id: 'support-' + Date.now() + '-response',
          text: `Thank you for contacting support about "${subject}". A support agent will review your request and respond shortly.`,
          sender: {
            id: 'support',
            name: 'Support Team',
            avatar: '/placeholder.svg'
          },
          timestamp: new Date(Date.now() + 10000).toISOString(),
          isSupport: true
        }
      ]
    };
    
    setSupportTickets(prev => [...prev, newTicket]);
    
    setChatDrawerOpen(true);
  };

  const filteredClubs = availableClubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-20 pt-6">
      <div className="container-mobile">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Clubs</h1>
          <div className="flex items-center gap-2">
            <NotificationPopover 
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onClearAll={handleClearAllNotifications}
              onUserClick={handleSelectUser}
              onJoinClub={handleJoinClub}
              onDeclineInvite={handleDeclineInvite}
            />
            <Button 
              variant="link"
              onClick={handleOpenChat}
              className="text-primary hover:bg-gray-100 rounded-full p-2"
              icon={<MessageCircle className="h-5 w-5" />}
              badge={unreadMessages}
            />
            <UserAvatar 
              name={currentUser?.name || "User"} 
              image={currentUser?.avatar} 
              size="sm"
              onClick={() => setCurrentView('profile')}
            />
          </div>
        </div>

        <div className="space-y-6">
          {userClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onSelectClub={handleSelectClub}
              onSelectUser={handleSelectUser}
            />
          ))}

          {userClubs.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="font-medium mb-2">No clubs yet</h3>
              <p className="text-gray-500 text-sm mb-4">
                Create or join a club to start competing
              </p>
              <Button 
                variant="primary" 
                size="sm"
                onClick={handleCreateClub}
              >
                Create Club
              </Button>
            </div>
          )}
        </div>

        {!isAtClubCapacity && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Find Clubs</h2>
              <button 
                className="text-primary flex items-center gap-1"
                onClick={handleOpenSearch}
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
              </button>
            </div>

            <AvailableClubs 
              clubs={availableClubs}
              onRequestJoin={handleRequestToJoin}
            />

            <div className="mt-6 text-center">
              <Button 
                variant="primary" 
                size="md"
                onClick={handleCreateClub}
              >
                Create Club
              </Button>
            </div>
          </div>
        )}

        {isAtClubCapacity && (
          <div className="mt-10 bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="font-medium mb-2">Club Limit Reached</h3>
            <p className="text-gray-500 text-sm mb-4">
              You have reached the maximum of {MAX_CLUBS_PER_USER} clubs.
            </p>
          </div>
        )}
      </div>

      <ChatDrawer 
        open={chatDrawerOpen} 
        onOpenChange={(open) => {
          setChatDrawerOpen(open);
          if (!open) {
            const event = new CustomEvent('chatDrawerClosed');
            window.dispatchEvent(event);
          }
        }} 
        clubs={userClubs}
        onNewMessage={(count) => setUnreadMessages(count)} 
        supportTickets={supportTickets}
      />

      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Clubs</DialogTitle>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for clubs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Results</h3>
              
              {filteredClubs.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredClubs.map((club) => (
                    <div 
                      key={club.id} 
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-200 h-10 w-10 rounded-full flex items-center justify-center">
                          <span className="font-bold text-xs text-gray-700">{club.name.substring(0, 2)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{club.name}</h4>
                          <span className="text-xs text-gray-500">
                            {formatLeagueWithTier(club.division, club.tier)} • {club.members}/5 members
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        icon={<UserPlus className="h-4 w-4" />}
                        onClick={() => {
                          handleRequestToJoin(club.id, club.name);
                          setSearchDialogOpen(false);
                        }}
                      >
                        Request
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  No clubs found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateClubDialog
        open={createClubDialogOpen}
        onOpenChange={setCreateClubDialogOpen}
      />
      
      <SupportPopover onCreateSupportChat={handleCreateSupportTicket} />
    </div>
  );
};

export default HomeView;
