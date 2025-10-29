import { RitualScheduler } from '../services/scheduler';
import { SpotifyService } from '../services/spotify';
import { PlaylistBuilder } from '../services/playlist-builder';
import { NotificationService } from '../services/notification';

jest.mock('../services/spotify');
jest.mock('../services/playlist-builder');
jest.mock('node-cron');

describe('RitualScheduler', () => {
  let scheduler: RitualScheduler;
  let mockSpotifyService: jest.Mocked<SpotifyService>;
  let mockPlaylistBuilder: jest.Mocked<PlaylistBuilder>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockSpotifyService = {
      authenticate: jest.fn(),
      createPlaylist: jest.fn(),
      addTracksToPlaylist: jest.fn()
    } as any;

    mockPlaylistBuilder = {
      generateRitualPlaylist: jest.fn()
    } as any;

    mockNotificationService = {
      notifyPlaylistCreated: jest.fn()
    } as any;

    scheduler = new RitualScheduler(
      mockSpotifyService,
      mockPlaylistBuilder,
      mockNotificationService
    );
  });

  describe('initialize', () => {
    it('should authenticate with Spotify', async () => {
      mockSpotifyService.authenticate.mockResolvedValue();

      await scheduler.initialize();

      expect(mockSpotifyService.authenticate).toHaveBeenCalled();
    });
  });

  describe('createDailyRitualPlaylist', () => {
    it('should create a complete ritual playlist', async () => {
      const mockPlaylist = {
        name: 'The Ritual - Test',
        tracks: [
          {
            id: '1',
            name: 'Test Song',
            uri: 'spotify:track:1',
            artists: [],
            duration_ms: 180000,
            external_urls: { spotify: '' }
          }
        ],
        totalDurationMs: 1200000,
        phaseBreakdown: [
          {
            phase: 'Going to Temple',
            tracks: [],
            durationMs: 180000
          }
        ]
      };

      mockPlaylistBuilder.generateRitualPlaylist.mockResolvedValue(mockPlaylist);
      mockSpotifyService.createPlaylist.mockResolvedValue('playlist123');
      mockSpotifyService.addTracksToPlaylist.mockResolvedValue();
      mockNotificationService.notifyPlaylistCreated.mockResolvedValue();

      await scheduler.createDailyRitualPlaylist();

      expect(mockPlaylistBuilder.generateRitualPlaylist).toHaveBeenCalled();
      expect(mockSpotifyService.createPlaylist).toHaveBeenCalledWith(
        mockPlaylist.name,
        expect.any(String)
      );
      expect(mockSpotifyService.addTracksToPlaylist).toHaveBeenCalledWith(
        'playlist123',
        ['spotify:track:1']
      );
      expect(mockNotificationService.notifyPlaylistCreated).toHaveBeenCalledWith({
        playlist: mockPlaylist,
        playlistId: 'playlist123'
      });
    });

    it('should handle errors gracefully', async () => {
      mockPlaylistBuilder.generateRitualPlaylist.mockRejectedValue(
        new Error('Failed to generate playlist')
      );

      await expect(scheduler.createDailyRitualPlaylist()).rejects.toThrow(
        'Failed to generate playlist'
      );
    });
  });

  describe('runOnce', () => {
    it('should initialize and create playlist once', async () => {
      const initializeSpy = jest.spyOn(scheduler, 'initialize').mockResolvedValue();
      const createPlaylistSpy = jest.spyOn(scheduler, 'createDailyRitualPlaylist').mockResolvedValue();

      await scheduler.runOnce();

      expect(initializeSpy).toHaveBeenCalled();
      expect(createPlaylistSpy).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return correct status when not running', () => {
      const status = scheduler.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.nextRun).toBeUndefined();
    });
  });
});
