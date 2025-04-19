
import { ClubMember } from '@/types';

export const generateMemberDistances = (members: ClubMember[], totalDistance: number): ClubMember[] => {
  if (!members.length) {
    return [];
  }
  
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
  opponentName: string,
  matchIndex: number,
  totalDistance: number
): ClubMember[] => {
  const opponentMembers: ClubMember[] = [];
  let remainingDistance = totalDistance;

  // Add star performer (30-40% of total)
  const starPerformerPercent = 0.3 + Math.random() * 0.1;
  const starDistance = parseFloat((totalDistance * starPerformerPercent).toFixed(1));
  remainingDistance -= starDistance;

  opponentMembers.push({
    id: `opponent-${matchIndex}-star`,
    name: `${opponentName} Captain`,
    avatar: '/placeholder.svg',
    isAdmin: true,
    distanceContribution: starDistance
  });

  // Add middle performers
  const midPerformerCount = Math.floor(Math.random() * 3) + 2; // 2-4 middle performers
  for (let i = 0; i < midPerformerCount; i++) {
    const midPerformerPercent = (0.15 + Math.random() * 0.1);
    const midDistance = parseFloat((remainingDistance * midPerformerPercent).toFixed(1));
    remainingDistance -= midDistance;

    opponentMembers.push({
      id: `opponent-${matchIndex}-mid-${i}`,
      name: `${opponentName} Runner ${i + 1}`,
      avatar: '/placeholder.svg',
      isAdmin: false,
      distanceContribution: midDistance
    });
  }

  // Add one low performer with remaining distance
  opponentMembers.push({
    id: `opponent-${matchIndex}-low`,
    name: `${opponentName} Newcomer`,
    avatar: '/placeholder.svg',
    isAdmin: false,
    distanceContribution: parseFloat(remainingDistance.toFixed(1))
  });

  return opponentMembers;
};

