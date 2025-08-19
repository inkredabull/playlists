import { PlaylistBuilder } from '../services/playlist-builder';
import { SpotifyService } from '../services/spotify';
import { SpotifyTrack, AudioFeatures } from '../types';

jest.mock('../services/spotify');

describe('PlaylistBuilder', () => {
  let playlistBuilder: PlaylistBuilder;
  let mockSpotifyService: jest.Mocked<SpotifyService>;

  const mockTracks: SpotifyTrack[] = [
    {
      id: '1',
      name: 'Temple Song',
      artists: [{ id: 'artist1', name: 'Artist 1' }],
      duration_ms: 180000,
      uri: 'spotify:track:1',
      external_urls: { spotify: 'https://open.spotify.com/track/1' },
      audio_features: {
        danceability: 0.5,
        energy: 0.4,
        valence: 0.6,
        tempo: 100,
        acousticness: 0.5,
        instrumentalness: 0.2,
        key: 5,
        loudness: -8,
        mode: 1,
        speechiness: 0.05,
        liveness: 0.1,
        duration_ms: 180000,
        time_signature: 4
      }
    },
    {
      id: '2',
      name: 'Dance Divine',
      artists: [{ id: 'artist2', name: 'Artist 2' }],
      duration_ms: 240000,
      uri: 'spotify:track:2',
      external_urls: { spotify: 'https://open.spotify.com/track/2' },
      audio_features: {
        danceability: 0.8,
        energy: 0.7,
        valence: 0.8,
        tempo: 140,
        acousticness: 0.2,
        instrumentalness: 0.1,
        key: 3,
        loudness: -6,
        mode: 0,
        speechiness: 0.04,
        liveness: 0.15,
        duration_ms: 240000,
        time_signature: 4
      }
    },
    {
      id: '3',
      name: 'Beast Unleashed',
      artists: [{ id: 'artist3', name: 'Artist 3' }],
      duration_ms: 200000,
      uri: 'spotify:track:3',
      external_urls: { spotify: 'https://open.spotify.com/track/3' },
      audio_features: {
        danceability: 0.9,
        energy: 0.9,
        valence: 0.7,
        tempo: 160,
        acousticness: 0.1,
        instrumentalness: 0.05,
        key: 7,
        loudness: -4,
        mode: 1,
        speechiness: 0.06,
        liveness: 0.2,
        duration_ms: 200000,
        time_signature: 4
      }
    }
  ];

  beforeEach(() => {
    mockSpotifyService = {
      getAllLikedSongs: jest.fn(),
      getAudioFeatures: jest.fn(),
      authenticate: jest.fn(),
      getLikedSongs: jest.fn(),
      createPlaylist: jest.fn(),
      addTracksToPlaylist: jest.fn()
    } as any;

    playlistBuilder = new PlaylistBuilder(mockSpotifyService);
  });

  describe('generateRitualPlaylist', () => {
    it('should generate a playlist with all ritual phases', async () => {
      mockSpotifyService.getAllLikedSongs.mockResolvedValue(mockTracks);
      mockSpotifyService.getAudioFeatures.mockResolvedValue(
        mockTracks.map(track => track.audio_features!)
      );

      const result = await playlistBuilder.generateRitualPlaylist();

      expect(result.name).toContain('The Ritual');
      expect(result.tracks.length).toBeGreaterThan(0);
      expect(result.totalDurationMs).toBeGreaterThan(0);
      expect(result.phaseBreakdown.length).toBeGreaterThan(0);
    });

    it('should throw error when no liked songs found', async () => {
      mockSpotifyService.getAllLikedSongs.mockResolvedValue([]);

      await expect(playlistBuilder.generateRitualPlaylist()).rejects.toThrow('No liked songs found');
    });

    it('should respect the 20-minute target duration', async () => {
      const longTracks = Array.from({ length: 50 }, (_, i) => ({
        ...mockTracks[0],
        id: `track-${i}`,
        duration_ms: 300000 // 5 minutes each
      }));

      mockSpotifyService.getAllLikedSongs.mockResolvedValue(longTracks);
      mockSpotifyService.getAudioFeatures.mockResolvedValue(
        longTracks.map(track => track.audio_features!)
      );

      const result = await playlistBuilder.generateRitualPlaylist();
      const twentyMinutesMs = 20 * 60 * 1000;
      
      expect(result.totalDurationMs).toBeLessThanOrEqual(twentyMinutesMs * 1.1);
    });
  });

  describe('phase matching', () => {
    it('should match tracks to appropriate phases based on audio features', async () => {
      const phasedTracks = [
        {
          ...mockTracks[0],
          name: 'Temple Meditation',
          audio_features: {
            ...mockTracks[0].audio_features!,
            energy: 0.3,
            danceability: 0.4,
            acousticness: 0.7
          }
        },
        {
          ...mockTracks[1],
          name: 'High Energy Dance',
          audio_features: {
            ...mockTracks[1].audio_features!,
            energy: 0.9,
            danceability: 0.9,
            tempo: 170
          }
        }
      ];

      mockSpotifyService.getAllLikedSongs.mockResolvedValue(phasedTracks);
      mockSpotifyService.getAudioFeatures.mockResolvedValue(
        phasedTracks.map(track => track.audio_features!)
      );

      const result = await playlistBuilder.generateRitualPlaylist();

      expect(result.phaseBreakdown.some(phase => 
        phase.phase === 'Going to Temple' && phase.tracks.length > 0
      )).toBeTruthy();
    });
  });
});