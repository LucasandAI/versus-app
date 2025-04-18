import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { SupportTicket } from '@/types/chat';
import { toast } from "@/hooks/use-toast";
import { X, Search, UserPlus } from 'lucide-react';
import ChatDrawer from './chat/ChatDrawer';
import SupportPopover from './shared/SupportPopover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CreateClubDialog from './club/CreateClubDialog';
import NotificationHandler from './home/NotificationHandler';
import HomeHeader from './home/HomeHeader';
import ClubList from './home/ClubList';
import FindClubsSection from './home/FindClubsSection';
import { formatLeagueWithTier } from '@/lib/format';
import Button from './shared/Button';
import AvailableClubs from './club/AvailableClubs';
import SearchClubDialog from './club/SearchClubDialog';

const MAX_CLUBS_PER_USER = 3;

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

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser, setCurrentUser } = useApp();
  const [unreadMessages, setUnreadMessages] = useState(chatNotifications);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createClubDialogOpen, setCreateClubDialogOpen] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

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
    const userClubs = currentUser?.clubs || [];
    const isAtClubCapacity = userClubs.length >= MAX_CLUBS_PER_USER;
    
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
    const userClubs = currentUser?.clubs || [];
    const isAtClubCapacity = userClubs.length >= MAX_CLUBS_PER_USER;
    
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
    const userClubs = currentUser?.clubs || [];
    const isAtClubCapacity = userClubs.length >= MAX_CLUBS_PER_USER;
    
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

  const userClubs = currentUser?.clubs || [];
  const isAtClubCapacity = userClubs.length >= MAX_CLUBS_PER_USER;
  const filteredClubs = availableClubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-20 pt-6">
      <div className="container-mobile">
        <NotificationHandler 
          setChatNotifications={setUnreadMessages}
          setNotifications={setNotifications}
        />
        
        <HomeHeader 
          notifications={notifications}
          unreadMessages={unreadMessages}
          onMarkAsRead={handleMarkNotificationAsRead}
          onClearAll={handleClearAllNotifications}
          onUserClick={handleSelectUser}
          onJoinClub={handleJoinClub}
          onDeclineInvite={handleDeclineInvite}
          onOpenChat={handleOpenChat}
        />

        <ClubList 
          userClubs={userClubs}
          onSelectClub={handleSelectClub}
          onSelectUser={handleSelectUser}
          onCreateClub={handleCreateClub}
        />

        {!isAtClubCapacity && (
          <FindClubsSection 
            clubs={availableClubs}
            onRequestJoin={handleRequestToJoin}
            onSearchClick={() => setSearchDialogOpen(true)}
            onCreateClick={handleCreateClub}
          />
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

      <SearchClubDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        clubs={availableClubs}
        onRequestJoin={handleRequestToJoin}
      />

      <CreateClubDialog
        open={createClubDialogOpen}
        onOpenChange={setCreateClubDialogOpen}
      />
      
      <SupportPopover onCreateSupportChat={handleCreateSupportTicket} />
    </div>
  );
};

export default HomeView;
