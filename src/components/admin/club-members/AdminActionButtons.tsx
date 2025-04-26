
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Users } from 'lucide-react';

interface AdminActionButtonsProps {
  onEditClick: () => void;
  onRequestsClick: () => void;
}

const AdminActionButtons: React.FC<AdminActionButtonsProps> = ({ onEditClick, onRequestsClick }) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      <Button 
        variant="secondary" 
        size="sm" 
        className="flex items-center justify-center"
        onClick={onEditClick}
      >
        <Settings className="h-4 w-4 mr-2" />
        Edit Club Details
      </Button>
      
      <Button 
        variant="secondary" 
        size="sm" 
        className="flex items-center justify-center"
        onClick={onRequestsClick}
      >
        <Users className="h-4 w-4 mr-2" />
        View Join Requests
      </Button>
    </div>
  );
};

export default AdminActionButtons;
