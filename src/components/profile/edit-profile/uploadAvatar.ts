
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

    // Enforce accepted image types (PNG, JPEG, JPG, WEBP, GIF)
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      console.error('[uploadAvatar] File type not supported:', file.type);
      return null;
    }

    // Updated file path with user folder and timestamp
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    console.log('[uploadAvatar] Using file path:', filePath);

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

    // Upload with upsert and correct file path
    console.log('[uploadAvatar] Uploading file to path:', filePath);
    const { data, error: uploadError } = await safeSupabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    // Log upload result for diagnostics
    console.log('[uploadAvatar] Upload result:', { data, error: uploadError });

    if (uploadError) {
      console.error('[uploadAvatar] Error uploading avatar:', uploadError);
      return null;
    }

    // Get public URL for this file
    const { data: urlData } = safeSupabase.storage.from('avatars').getPublicUrl(filePath);
    if (urlData && urlData.publicUrl) {
      console.log('[uploadAvatar] Avatar upload successful, URL:', urlData.publicUrl);
      return urlData.publicUrl;
    }
    console.error('[uploadAvatar] Could not get public URL after upload:', urlData);
    return null;
  } catch (error) {
    console.error('[uploadAvatar] Error in avatar upload process:', error);
    return null;
  }
};
