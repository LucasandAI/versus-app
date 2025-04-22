
import React from 'react';
import { JoinRequest } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import JoinRequestButtons from './JoinRequestButtons';

interface JoinRequestItemProps {
  request: JoinRequest;
  onApprove: () => void;
  onDeny: () => void;
  isClubFull: boolean;
}

const JoinRequestItem: React.FC<JoinRequestItemProps> = ({
  request,
  onApprove,
  onDeny,
  isClubFull
}) => {
  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <UserAvatar name={request.userName} image={request.userAvatar} size="sm" />
        <div>
          <p className="font-medium">{request.userName}</p>
          <p className="text-xs text-gray-500">
            Requested {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <JoinRequestButtons
        request={request}
        onApprove={onApprove}
        onDeny={onDeny}
        isClubFull={isClubFull}
      />
    </div>
  );
};

export default JoinRequestItem;
