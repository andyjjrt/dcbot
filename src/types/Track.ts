export interface TrackMetadata {
  // Original Track Url
  url: string;

  // Original Tack Title
  title: string;

  // Original Channel Name
  channel?: string;

  // Original Channel Url
  channelUrl?: string;

  // Track thumbnail
  thumbnail: string;

  // Unique track id
  id: string;

  // Track's youtube id
  ytId: string;
}

/**
 * This is the data required to create a Track object.
 */
export interface TrackInterface {
  metadata: TrackMetadata
  user: import("discord.js").User | import("discord.js").APIUser;
  startTime: number;
  endTime: number;
  onStart: (url: string, title: string, thumbnail: string) => void;
  onError: (error: Error) => void;
}