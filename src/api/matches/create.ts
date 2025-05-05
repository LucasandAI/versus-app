
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCycleInfo } from "@/utils/date/matchTiming";

// This is a backup route to create matches if the automatic scheduler fails
export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify if the client is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Check if we're in match phase
    const cycleInfo = getCurrentCycleInfo();
    if (!cycleInfo.isInMatchPhase) {
      return new Response(JSON.stringify({ 
        error: 'Cannot create matches during cooldown phase',
        message: 'Matches can only be created during the match phase' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call the database function to create matches
    const { data, error } = await supabase.rpc('create_weekly_matches');
    
    if (error) throw error;
    
    return new Response(JSON.stringify({ 
      success: true, 
      matchesCreated: data || 0,
      message: `Created ${data || 0} new matches`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[API] Error creating matches:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create matches',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
