export interface DailyParticipant {
  session_id: string;
  user_id: string;
  user_name: string;
  local: boolean;
  video: boolean;
  audio: boolean;
  screen: boolean;
  joined_at: Date;
  tracks: {
    audio: { state: string; track?: MediaStreamTrack };
    video: { state: string; track?: MediaStreamTrack };
    screenVideo: { state: string; track?: MediaStreamTrack };
    screenAudio: { state: string; track?: MediaStreamTrack };
  };
}

export interface RoomState {
  participants: Map<string, DailyParticipant>;
  activeSpeakerId: string | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isJoined: boolean;
  error: string | null;
}
