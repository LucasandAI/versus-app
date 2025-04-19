
import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';
import JoinRequestButtons from './JoinRequestButtons';

interface JoinRequest {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  requestDate: string;
}

interface JoinRequestItemProps {
  request: JoinRequest;
  onApprove: (request: JoinRequest) => void;
  onDeny: (request: JoinRequest) => void;
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
        <UserAvatar name={request.name} image={request.avatar} size="sm" />
        <div>
          <p className="font-medium">{request.name}</p>
          <p className="text-xs text-gray-500">
            Requested {new Date(request.requestDate).toLocaleDateString()}
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
