import { NativeModules } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const { HealthKit } = NativeModules;

// Initialize Supabase client
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

interface HealthKitOptions {
  permissions: string[];
}

export const initHealthKit = async (options: HealthKitOptions): Promise<void> => {
  try {
    // Request authorization with the specified permissions
    await HealthKit.requestAuthorization(options);
    console.log('HealthKit authorization successful.');
  } catch (error) {
    console.error('HealthKit authorization failed:', error);
  }
};

// Insert activity data into Supabase
const insertActivityData = async (userId: string, activities: any[]) => {
  for (const activity of activities) {
    const { data, error } = await supabase
      .from('activity')
      .insert([
        {
          user_id: userId,             // Link the activity to the user
          match_id: null,              // Optional: Link to a specific match if needed
          device_type: 'Apple Watch',  // Modify based on the user's device
          distance: activity.distance, // Distance in meters
          start_time: activity.start_time,  // Start time of the activity
          end_time: activity.end_time,      // End time of the activity
        }
      ]);

    if (error) {
      console.error('Error inserting activity data:', error);
    } else {
      console.log('Activity data inserted:', data);
    }
  }
};

// Fetch Activity data (distance, start time, and end time)
export const fetchActivityData = async (userId: string): Promise<void> => {
  try {
    // Fetch workouts (running, walking, etc.)
    const workouts = await HealthKit.getWorkouts({
      type: 'running',  // Change to desired activity type, e.g., walking, cycling
      startDate: '2023-05-01T00:00:00Z',  // Optional: Specify the start date for the activity range
      endDate: '2023-05-02T00:00:00Z'    // Optional: Specify the end date
    });

    const activities = workouts.map(workout => {
      return {
        distance: workout.distance,  // Activity distance in meters
        start_time: workout.startDate,  // Start time of the activity
        end_time: workout.endDate,     // End time of the activity
      };
    });

    // Insert the fetched data into Supabase
    await insertActivityData(userId, activities);
  } catch (error) {
    console.error('Error fetching activity data:', error);
  }
};
