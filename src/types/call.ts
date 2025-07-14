export interface Call {
  channelName: string;
  callType: 'video' | 'audio';
  initiatorId: string;
  receiverId: string;
  status: 'initiated' | 'accepted' | 'rejected' | 'ended';
  timestamp: string;
  duration?: number; // Added to store call duration
}