
// Define a consistent set of request status values
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

// Map for converting between different status formats if needed
export const statusMap: Record<string, RequestStatus> = {
  'pending': 'PENDING',
  'accepted': 'ACCEPTED', 
  'rejected': 'REJECTED',
  'PENDING': 'PENDING',
  'ACCEPTED': 'ACCEPTED',
  'REJECTED': 'REJECTED',
  'SUCCESS': 'ACCEPTED', // Map SUCCESS to ACCEPTED
  'ERROR': 'REJECTED'    // Map ERROR to REJECTED
};

// Helper function to normalize status values
export const normalizeStatus = (status: string): RequestStatus => {
  return statusMap[status] || 'PENDING';
};
