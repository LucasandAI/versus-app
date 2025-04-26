
import React, { useState } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatLeagueWithTier } from '@/lib/format';
import UserAvatar from '../shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';

interface SearchClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: any[];
  onRequestJoin: (clubId: string, clubName: string) => void;
}

const SearchClubDialog: React.FC<SearchClubDialogProps> = ({
  open,
  onOpenChange,
  clubs,
  onRequestJoin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { navigateToClubDetail } = useNavigation();
  
  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClubClick = (club: any) => {
    navigateToClubDetail(club.id, {
      id: club.id,
      name: club.name,
      division: club.division,
      tier: club.tier,
      members: [],
      logo: club.logo || '/placeholder.svg',
      matchHistory: []
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => handleClubClick(club)}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={club.name}
                        image={club.logo}
                        size="sm"
                        className="h-10 w-10"
                      />
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestJoin(club.id, club.name);
                        onOpenChange(false);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
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
  );
};

export default SearchClubDialog;
