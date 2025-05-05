
import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCycleInfo, MATCH_DURATION_MS } from "@/utils/date/matchTiming";

// This is a backup route to create matches if the automatic scheduler fails
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify if the client is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if we're in match phase
    const cycleInfo = getCurrentCycleInfo();
    if (!cycleInfo.isInMatchPhase) {
      return res.status(400).json({ 
        error: 'Cannot create matches during cooldown phase',
        message: 'Matches can only be created during the match phase' 
      });
    }

    // Call the database function to create matches
    const { data, error } = await supabase.rpc('create_weekly_matches');
    
    if (error) throw error;
    
    return res.status(200).json({ 
      success: true, 
      matchesCreated: data || 0,
      message: `Created ${data || 0} new matches`
    });
  } catch (error) {
    console.error('[API] Error creating matches:', error);
    return res.status(500).json({ 
      error: 'Failed to create matches',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
