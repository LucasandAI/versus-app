
import React from 'react';
import { CircleUser } from 'lucide-react';

export interface EmptyRequestsProps {
  clubName: string;
}

export const EmptyRequests: React.FC<EmptyRequestsProps> = ({ clubName }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <CircleUser className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Join Requests</h3>
      <p className="text-gray-500">
        {clubName} doesn't have any pending join requests at the moment.
      </p>
    </div>
  );
};
