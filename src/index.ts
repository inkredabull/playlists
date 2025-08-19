import dotenv from 'dotenv';
import { RitualScheduler } from './services/scheduler';
import { startAuthFlow } from './auth-helper';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--auth')) {
    try {
      console.log('🔐 Starting Spotify authentication flow...');
      const tokens = await startAuthFlow();
      
      console.log('\n✅ Authentication successful!');
      console.log('\n📝 Add these to your .env file:');
      console.log(`SPOTIFY_ACCESS_TOKEN=${tokens.accessToken}`);
      console.log(`SPOTIFY_REFRESH_TOKEN=${tokens.refreshToken}`);
      console.log('\nThen run the app again with --once or start the scheduler.');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      process.exit(1);
    }
  }

  const scheduler = new RitualScheduler();

  try {
    await scheduler.initialize();
    
    if (args.includes('--once') || args.includes('-o')) {
      await scheduler.runOnce();
      process.exit(0);
    }
    
    const hourArg = args.find(arg => arg.startsWith('--hour='));
    const minuteArg = args.find(arg => arg.startsWith('--minute='));
    
    const hour = hourArg ? parseInt(hourArg.split('=')[1]) : 6;
    const minute = minuteArg ? parseInt(minuteArg.split('=')[1]) : 0;
    
    scheduler.startDailySchedule(hour, minute);
    
    console.log('🎵 Ritual Playlist Generator is running...');
    console.log('Press Ctrl+C to stop');
    
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down gracefully...');
      scheduler.stopSchedule();
      process.exit(0);
    });
    
    setInterval(() => {
      const status = scheduler.getStatus();
      if (status.isRunning) {
        console.log(`💫 Scheduler status: Running (${new Date().toLocaleString()})`);
      }
    }, 60000);
    
  } catch (error) {
    console.error('💥 Application failed to start:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}