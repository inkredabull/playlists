import * as cron from 'node-cron';
import { SpotifyService } from './spotify';
import { PlaylistBuilder } from './playlist-builder';
import { NotificationService } from './notification';

export class RitualScheduler {
  private spotifyService: SpotifyService;
  private playlistBuilder: PlaylistBuilder;
  private notificationService: NotificationService;
  private isRunning: boolean = false;
  private scheduledTask?: cron.ScheduledTask;

  constructor(
    spotifyService?: SpotifyService,
    playlistBuilder?: PlaylistBuilder,
    notificationService?: NotificationService
  ) {
    this.spotifyService = spotifyService ?? new SpotifyService();
    this.playlistBuilder = playlistBuilder ?? new PlaylistBuilder(this.spotifyService);
    this.notificationService = notificationService ?? new NotificationService();
  }

  async initialize(): Promise<void> {
    await this.spotifyService.authenticate();
  }

  async createDailyRitualPlaylist(): Promise<void> {
    try {
      console.log('🎵 Starting daily ritual playlist generation...');
      
      const playlist = await this.playlistBuilder.generateRitualPlaylist();
      
      console.log(`📝 Generated playlist: ${playlist.name}`);
      console.log(`⏱️  Total duration: ${Math.round(playlist.totalDurationMs / 60000)} minutes`);
      console.log(`🎶 Total tracks: ${playlist.tracks.length}`);
      
      const playlistId = await this.spotifyService.createPlaylist(
        playlist.name,
        playlist.phaseBreakdown.map(phase => 
          `${phase.phase}: ${phase.tracks.length} tracks (${Math.round(phase.durationMs / 60000)}min)`
        ).join(' | ')
      );

      await this.spotifyService.addTracksToPlaylist(
        playlistId, 
        playlist.tracks.map(track => track.uri)
      );

      console.log(`✅ Successfully created playlist with ID: ${playlistId}`);
      console.log('📊 Phase breakdown:');
      playlist.phaseBreakdown.forEach(phase => {
        console.log(`   ${phase.phase}: ${phase.tracks.length} tracks, ${Math.round(phase.durationMs / 60000)}min`);
      });
      
      await this.notificationService.notifyPlaylistCreated({ playlist, playlistId });

    } catch (error) {
      console.error('❌ Failed to create daily ritual playlist:', error);
      throw error;
    }
  }

  startDailySchedule(hour: number = 3, minute: number = 0): void {
    if (this.isRunning) {
      console.log('⚠️  Scheduler is already running');
      return;
    }

    const cronExpression = `${minute} ${hour} * * *`;
    
    console.log(`🕐 Scheduling daily ritual playlist creation at ${hour}:${minute.toString().padStart(2, '0')}`);
    
    this.scheduledTask = cron.schedule(cronExpression, async () => {
      console.log(`\n🌅 Daily ritual playlist creation triggered at ${new Date().toLocaleString()}`);
      try {
        await this.createDailyRitualPlaylist();
      } catch (error) {
        console.error('💥 Scheduled playlist creation failed:', error);
      }
    });

    this.isRunning = true;
    console.log('✅ Daily scheduler started successfully');
  }

  stopSchedule(): void {
    if (!this.isRunning) {
      console.log('⚠️  Scheduler is not running');
      return;
    }

    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask = undefined;
    }
    this.isRunning = false;
    console.log('🛑 Daily scheduler stopped');
  }

  async runOnce(): Promise<void> {
    console.log('🎯 Running ritual playlist generation once...');
    await this.initialize();
    await this.createDailyRitualPlaylist();
  }

  getStatus(): { isRunning: boolean; nextRun?: string } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? 'Check cron schedule' : undefined
    };
  }
}
