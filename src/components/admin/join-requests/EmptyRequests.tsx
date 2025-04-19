
import React from 'react';
import { UserRound } from 'lucide-react';

const EmptyRequests: React.FC = () => {
  return (
    <div className="text-center p-4">
      <UserRound className="h-12 w-12 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500">No pending join requests</p>
    </div>
  );
};

export default EmptyRequests;
