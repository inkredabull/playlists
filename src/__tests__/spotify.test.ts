import axios from 'axios';
import { SpotifyService } from '../services/spotify';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SpotifyService', () => {
  let spotifyService: SpotifyService;

  beforeEach(() => {
    process.env.SPOTIFY_CLIENT_ID = 'test_client_id';
    process.env.SPOTIFY_CLIENT_SECRET = 'test_client_secret';
    process.env.SPOTIFY_REDIRECT_URI = 'http://localhost:8888/callback';

    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn()
    } as any);

    spotifyService = new SpotifyService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate successfully with valid credentials', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'test_token' }
      });

      await spotifyService.authenticate();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
    });

    it('should throw error when credentials are missing', async () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      const serviceWithoutCreds = new SpotifyService();

      await expect(serviceWithoutCreds.authenticate()).rejects.toThrow(
        'Spotify credentials not configured'
      );
    });

    it('should throw error when authentication fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Auth failed'));

      await expect(spotifyService.authenticate()).rejects.toThrow(
        'Spotify authentication failed'
      );
    });
  });

  describe('getLikedSongs', () => {
    it('should fetch liked songs successfully', async () => {
      const mockTracks = {
        items: [
          {
            track: {
              id: '1',
              name: 'Test Song',
              artists: [{ id: 'artist1', name: 'Test Artist' }],
              duration_ms: 180000,
              uri: 'spotify:track:1',
              external_urls: { spotify: 'https://open.spotify.com/track/1' }
            }
          }
        ]
      };

      const mockApi = {
        get: jest.fn().mockResolvedValue({ data: mockTracks })
      } as any;

      (spotifyService as any).api = mockApi;

      const result = await spotifyService.getLikedSongs();

      expect(mockApi.get).toHaveBeenCalledWith('/me/tracks', {
        params: { limit: 50, offset: 0 }
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Song');
    });
  });

  describe('getAudioFeatures', () => {
    it('should fetch audio features for tracks', async () => {
      const mockFeatures = {
        audio_features: [
          {
            danceability: 0.5,
            energy: 0.7,
            valence: 0.6,
            tempo: 120,
            duration_ms: 180000
          }
        ]
      };

      const mockApi = {
        get: jest.fn().mockResolvedValue({ data: mockFeatures })
      } as any;

      (spotifyService as any).api = mockApi;

      const result = await spotifyService.getAudioFeatures(['track1']);

      expect(mockApi.get).toHaveBeenCalledWith('/audio-features', {
        params: { ids: 'track1' }
      });
      expect(result).toHaveLength(1);
      expect(result[0].danceability).toBe(0.5);
    });

    it('should handle chunking for large track lists', async () => {
      const trackIds = Array.from({ length: 150 }, (_, i) => `track${i}`);
      const mockFeatures = {
        audio_features: trackIds.map(() => ({
          danceability: 0.5,
          energy: 0.7,
          duration_ms: 180000
        }))
      };

      const mockApi = {
        get: jest.fn().mockResolvedValue({ data: mockFeatures })
      } as any;

      (spotifyService as any).api = mockApi;

      await spotifyService.getAudioFeatures(trackIds);

      expect(mockApi.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('createPlaylist', () => {
    it('should create a playlist successfully', async () => {
      const mockUserResponse = { data: { id: 'user123' } };
      const mockPlaylistResponse = { data: { id: 'playlist123' } };

      const mockApi = {
        get: jest.fn().mockResolvedValue(mockUserResponse),
        post: jest.fn().mockResolvedValue(mockPlaylistResponse)
      } as any;

      (spotifyService as any).api = mockApi;

      const result = await spotifyService.createPlaylist('Test Playlist', 'Test Description');

      expect(mockApi.get).toHaveBeenCalledWith('/me');
      expect(mockApi.post).toHaveBeenCalledWith('/users/user123/playlists', {
        name: 'Test Playlist',
        description: 'Test Description',
        public: false
      });
      expect(result).toBe('playlist123');
    });
  });
});
