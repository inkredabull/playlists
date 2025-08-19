import axios, { AxiosInstance } from 'axios';
import { SpotifyTrack, AudioFeatures, SpotifyAuthTokens } from '../types';

export class SpotifyService {
  private api: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken?: string;
  private refreshToken?: string;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8888/callback';
    
    this.api = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    // Add request interceptor for auth
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  getAuthUrl(): string {
    const scopes = [
      'user-library-read',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
      'app-remote-control'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes,
      state: 'ritual-playlist-generator'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<SpotifyAuthTokens> {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokens = response.data;
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      
      return tokens;
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }
  }

  async authenticate(): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
    }

    const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

    if (accessToken && refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      
      try {
        await this.api.get('/me');
        console.log('✅ Using existing access token');
        return;
      } catch (error) {
        console.log('🔄 Access token expired, attempting refresh...');
        await this.refreshAccessToken();
        return;
      }
    }

    throw new Error(`
❌ Spotify authentication required!

To authenticate with Spotify:
1. Visit this URL: ${this.getAuthUrl()}
2. Authorize the application
3. Copy the 'code' parameter from the redirect URL
4. Set these environment variables:
   - SPOTIFY_ACCESS_TOKEN (get from authorization flow)
   - SPOTIFY_REFRESH_TOKEN (get from authorization flow)

Or run the app with --auth flag to start the authentication flow.
    `);
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      if (response.data.refresh_token) {
        this.refreshToken = response.data.refresh_token;
      }
      
      console.log('✅ Access token refreshed successfully');
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  async getLikedSongs(limit: number = 50, offset: number = 0): Promise<SpotifyTrack[]> {
    try {
      const response = await this.api.get('/me/tracks', {
        params: { limit, offset },
      });

      return response.data.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists,
        duration_ms: item.track.duration_ms,
        uri: item.track.uri,
        external_urls: item.track.external_urls,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch liked songs: ${error}`);
    }
  }

  async getAllLikedSongs(): Promise<SpotifyTrack[]> {
    const allTracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      const tracks = await this.getLikedSongs(limit, offset);
      allTracks.push(...tracks);
      
      if (tracks.length < limit) {
        break;
      }
      offset += limit;
    }

    return allTracks;
  }


  async createPlaylist(name: string, description: string, isPublic: boolean = false): Promise<string> {
    try {
      const userResponse = await this.api.get('/me');
      const userId = userResponse.data.id;

      const response = await this.api.post(`/users/${userId}/playlists`, {
        name,
        description,
        public: isPublic,
      });

      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to create playlist: ${error}`);
    }
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    try {
      const chunks = this.chunkArray(trackUris, 100);
      
      for (const chunk of chunks) {
        await this.api.post(`/playlists/${playlistId}/tracks`, {
          uris: chunk,
        });
      }
    } catch (error) {
      throw new Error(`Failed to add tracks to playlist: ${error}`);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}