
import { ClubMember } from '@/types';

const RUNNER_FIRST_NAMES = [
  'John', 'Alice', 'Charlie', 'Olivia', 'Paul', 
  'Emma', 'David', 'Sarah', 'Mike', 'Rachel',
  'Tom', 'Lisa', 'Chris', 'Anna', 'Mark'
];

const RUNNER_LAST_NAMES = [
  'Runner', 'Sprint', 'Run', 'Pace', 'Path',
  'Swift', 'Miles', 'Track', 'Dash', 'Stride',
  'Marathon', 'Race', 'Speed', 'Distance', 'Endure'
];

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
    const firstName = RUNNER_FIRST_NAMES[Math.floor(Math.random() * RUNNER_FIRST_NAMES.length)];
    const lastName = RUNNER_LAST_NAMES[Math.floor(Math.random() * RUNNER_LAST_NAMES.length)];
    
    members.push({
      id: `generated-member-${i}`,
      name: `${firstName} ${lastName}`,
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

  const starFirstName = RUNNER_FIRST_NAMES[Math.floor(Math.random() * RUNNER_FIRST_NAMES.length)];
  const starLastName = RUNNER_LAST_NAMES[Math.floor(Math.random() * RUNNER_LAST_NAMES.length)];

  opponentMembers.push({
    id: `opponent-star-${Date.now()}`,
    name: `${starFirstName} ${starLastName}`,
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

    const midFirstName = RUNNER_FIRST_NAMES[Math.floor(Math.random() * RUNNER_FIRST_NAMES.length)];
    const midLastName = RUNNER_LAST_NAMES[Math.floor(Math.random() * RUNNER_LAST_NAMES.length)];

    opponentMembers.push({
      id: `opponent-mid-${Date.now()}-${i}`,
      name: `${midFirstName} ${midLastName}`,
      avatar: '/placeholder.svg',
      isAdmin: false,
      distanceContribution: midDistance
    });
  }

  // Add one low performer with remaining distance
  const lowFirstName = RUNNER_FIRST_NAMES[Math.floor(Math.random() * RUNNER_FIRST_NAMES.length)];
  const lowLastName = RUNNER_LAST_NAMES[Math.floor(Math.random() * RUNNER_LAST_NAMES.length)];

  opponentMembers.push({
    id: `opponent-low-${Date.now()}`,
    name: `${lowFirstName} ${lowLastName}`,
    avatar: '/placeholder.svg',
    isAdmin: false,
    distanceContribution: parseFloat(remainingDistance.toFixed(1))
  });

  return opponentMembers;
};
