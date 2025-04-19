
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Users } from 'lucide-react';

interface AdminActionButtonsProps {
  onEditClick: () => void;
  onRequestsClick: () => void;
}

const AdminActionButtons: React.FC<AdminActionButtonsProps> = ({
  onEditClick,
  onRequestsClick
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button 
        variant="outline" 
        className="flex items-center gap-2 justify-center"
        onClick={onEditClick}
      >
        <Edit className="h-4 w-4" />
        <span>Edit Club</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center gap-2 justify-center"
        onClick={onRequestsClick}
      >
        <Users className="h-4 w-4" />
        <span>View Requests</span>
      </Button>
    </div>
  );
};

export default AdminActionButtons;
