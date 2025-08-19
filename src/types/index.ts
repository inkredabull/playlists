export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  duration_ms: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
  audio_features?: AudioFeatures;
}

export interface AudioFeatures {
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

export interface RitualPhase {
  name: string;
  description: string;
  targetDurationMs: number;
  criteria: PhaseCriteria;
}

export interface PhaseCriteria {
  keywords?: string[];
  durationRange?: [number, number]; // Duration in milliseconds
}

export interface PlaylistConfig {
  name: string;
  description: string;
  totalDurationMs: number;
  phases: RitualPhase[];
}

export interface SpotifyAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface GeneratedPlaylist {
  name: string;
  tracks: SpotifyTrack[];
  totalDurationMs: number;
  phaseBreakdown: Array<{
    phase: string;
    tracks: SpotifyTrack[];
    durationMs: number;
  }>;
}