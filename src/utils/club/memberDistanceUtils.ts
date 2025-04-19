
import { ClubMember } from '@/types';

export const generateMemberDistances = (memberCount: number | ClubMember[], totalDistance: number): ClubMember[] => {
  // Handle case when memberCount is an array of ClubMembers
  if (Array.isArray(memberCount)) {
    let remaining = totalDistance;
    return memberCount.map((member, index) => {
      if (index === memberCount.length - 1) {
        return { ...member, distanceContribution: parseFloat(remaining.toFixed(1)) };
      }
      
      const contribution = parseFloat((Math.random() * (remaining * 0.6)).toFixed(1));
      remaining -= contribution;
      return { ...member, distanceContribution: contribution };
    });
  }
  
  // Handle case when memberCount is a number
  const count = memberCount;
  const members: ClubMember[] = [];
  
  for (let i = 0; i < count; i++) {
    members.push({
      id: `generated-member-${i}`,
      name: `Member ${i + 1}`,
      avatar: '/placeholder.svg',
      isAdmin: i === 0, // First member is admin
    });
  }
  
  // Distribute distances
  let remaining = totalDistance;
  return members.map((member, index) => {
    if (index === members.length - 1) {
      return { ...member, distanceContribution: parseFloat(remaining.toFixed(1)) };
    }
    
    const contribution = parseFloat((Math.random() * (remaining * 0.6)).toFixed(1));
    remaining -= contribution;
    return { ...member, distanceContribution: contribution };
  });
};

export const generateOpponentMembers = (
  count: number,
  totalDistance: number,
  opponentName: string = 'Opponent'
): ClubMember[] => {
  const opponentMembers: ClubMember[] = [];
  let remainingDistance = totalDistance;

  // Add star performer (30-40% of total)
  const starPerformerPercent = 0.3 + Math.random() * 0.1;
  const starDistance = parseFloat((totalDistance * starPerformerPercent).toFixed(1));
  remainingDistance -= starDistance;

  opponentMembers.push({
    id: `opponent-star-${Date.now()}`,
    name: `${opponentName} Captain`,
    avatar: '/placeholder.svg',
    isAdmin: true,
    distanceContribution: starDistance
  });

  // Add middle performers
  const midPerformerCount = Math.min(count - 2, Math.floor(Math.random() * 3) + 2); // 2-4 middle performers
  for (let i = 0; i < midPerformerCount; i++) {
    const midPerformerPercent = (0.15 + Math.random() * 0.1);
    const midDistance = parseFloat((remainingDistance * midPerformerPercent).toFixed(1));
    remainingDistance -= midDistance;

    opponentMembers.push({
      id: `opponent-mid-${Date.now()}-${i}`,
      name: `${opponentName} Runner ${i + 1}`,
      avatar: '/placeholder.svg',
      isAdmin: false,
      distanceContribution: midDistance
    });
  }

  // Add one low performer with remaining distance
  opponentMembers.push({
    id: `opponent-low-${Date.now()}`,
    name: `${opponentName} Newcomer`,
    avatar: '/placeholder.svg',
    isAdmin: false,
    distanceContribution: parseFloat(remainingDistance.toFixed(1))
  });

  return opponentMembers;
};
