
import React from 'react';
import { UserX } from 'lucide-react';

const EmptyRequests: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <UserX className="h-12 w-12 text-gray-400 mb-3" />
      <h3 className="font-medium text-gray-900">No requests</h3>
      <p className="text-sm text-gray-500 mt-1">
        There are no pending join requests at the moment.
      </p>
    </div>
  );
};

export default EmptyRequests;
