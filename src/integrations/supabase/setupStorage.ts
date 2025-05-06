
import { supabase } from './client';

export const ensureStorageBuckets = async () => {
  try {
    // Check if club-logos bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('[Storage setup] Error listing buckets:', error);
      return;
    }
    
    const clubLogosBucketExists = buckets.some(bucket => bucket.name === 'club-logos');
    
    if (!clubLogosBucketExists) {
      // Create club-logos bucket with public access
      const { error: createError } = await supabase.storage.createBucket('club-logos', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
      });
      
      if (createError) {
        console.error('[Storage setup] Error creating club-logos bucket:', createError);
      } else {
        console.log('[Storage setup] Successfully created club-logos bucket');
      }
    }
  } catch (err) {
    console.error('[Storage setup] Unexpected error:', err);
  }
};
