
export const formatLeagueWithTier = (division: string, tier?: number) => {
  if (division === 'Elite') return 'Elite League';
  return tier ? `${division} ${tier}` : division;
};
