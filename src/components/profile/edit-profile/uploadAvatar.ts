
import { safeSupabase } from '@/integrations/supabase/safeClient';

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    console.log('[uploadAvatar] Starting upload for user:', userId);
    console.log('[uploadAvatar] File details:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      lastModified: file.lastModified
    });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Ensure the avatars bucket exists
    try {
      const { data: buckets } = await safeSupabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'avatars')) {
        console.log('[uploadAvatar] Creating avatars bucket');
        await safeSupabase.storage.createBucket('avatars', { public: true });
      } else {
        console.log('[uploadAvatar] Avatars bucket already exists');
      }
    } catch (error) {
      console.error('[uploadAvatar] Error checking/creating avatars bucket:', error);
    }

    console.log('[uploadAvatar] Uploading file to path:', filePath);
    const { data, error: uploadError } = await safeSupabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    // Log both data and error to diagnose the issue
    console.log('[uploadAvatar] Upload result:', { data, error: uploadError });

    if (uploadError) {
      console.error('[uploadAvatar] Error uploading avatar:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = safeSupabase.storage.from('avatars').getPublicUrl(filePath);
    console.log('[uploadAvatar] Avatar upload successful, URL:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('[uploadAvatar] Error in avatar upload process:', error);
    return null;
  }
};
