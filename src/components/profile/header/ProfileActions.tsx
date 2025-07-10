
import React, { useState } from 'react';
import { Settings, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import SocialLinksDropdown from '../social/SocialLinksDropdown';
import { User } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import SettingsDialog from '@/components/settings/SettingsDialog';

interface ProfileActionsProps {
  user: User;
  isCurrentUserProfile: boolean;
  onEditProfile: () => void;
  onLogoutClick: () => void;
  onShareProfile: () => void;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  user,
  isCurrentUserProfile,
  onEditProfile,
  onLogoutClick,
  onShareProfile
}) => {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div className="flex justify-center space-x-4">
      {isCurrentUserProfile ? (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('common.settings')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <SocialLinksDropdown user={user} onShareProfile={onShareProfile} />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full" 
                  onClick={onLogoutClick}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('profile.logout')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : (
        <SocialLinksDropdown user={user} onShareProfile={onShareProfile} />
      )}
      
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </div>
  );
};

export default ProfileActions;
