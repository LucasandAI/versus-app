
import React from 'react';
import { Club } from '@/types';
import MemberActions from './MemberActions';

interface MembersManagementProps {
  club: Club;
  onMakeAdmin: (memberId: string, memberName: string) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

const MembersManagement: React.FC<MembersManagementProps> = ({
  club,
  onMakeAdmin,
  onRemoveMember
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-2">Manage Members</h3>
      <div className="space-y-2">
        {club.members.filter(member => !member.isAdmin).map(member => (
          <div key={member.id} className="flex items-center justify-between">
            <span className="text-sm">{member.name}</span>
            <MemberActions 
              memberId={member.id}
              memberName={member.name}
              onMakeAdmin={onMakeAdmin}
              onRemove={onRemoveMember}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersManagement;
