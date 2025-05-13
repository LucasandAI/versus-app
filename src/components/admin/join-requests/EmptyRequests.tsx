
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react'; // Changed from UserX to User

interface EmptyRequestsProps {
  clubName: string;
}

const EmptyRequests: React.FC<EmptyRequestsProps> = ({ clubName }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <User size={32} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
      <p className="text-gray-500 mb-4 max-w-sm">
        There are no pending join requests for {clubName} at this time.
      </p>
      <Button variant="outline">Invite Members</Button>
    </div>
  );
};

export default EmptyRequests;
