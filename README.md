# Ritual Playlist Generator

A TypeScript application that automatically creates 20-minute "Ritual" playlists from your Spotify Liked Songs, following a specific sequence of phases designed for a complete musical journey.

## The Ritual Phases

1. **Going to Temple** (3 min) - Phase Shift / The Anticipation
2. **Intro** (3 min) - Gettin' Goin' / Range Ridin' / Trance Walk / Warmup  
3. **Dancing With the Divine** (4 min) - The Prayer / Ecstasy / Being the Whirling Dervish / Celebrate / Finding Center
4. **Dealer's Choice** (3 min) - Wild card - anything goes
5. **Unleashing the Beast** (4 min) - Climbing the Mountain / Thick of It / Innit
6. **Outro** (3 min) - Cool Down / Stretch

## Features

- 🎵 Analyzes your Spotify Liked Songs using keyword matching
- 🧠 Intelligent song categorization based on track names, artist names, and duration
- ⏰ Daily automated playlist creation with cron scheduling
- 🎯 Precise 20-minute duration targeting
- 📊 Detailed phase breakdown and logging
- 🧪 Comprehensive unit test coverage

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Spotify API:**
   - Copy `.env.example` to `.env`
   - Get your Spotify credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Fill in your credentials:
     ```
     SPOTIFY_CLIENT_ID=your_spotify_client_id
     SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
     SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
     ```

3. **Authenticate with Spotify:**
   ```bash
   npm run auth
   ```
   This will:
   - Open your browser to authorize the app
   - Display your access tokens
   - Add the tokens to your `.env` file

4. **Build the project:**
   ```bash
   npm run build
   ```

## Usage

### Run Once
Generate a single playlist immediately:
```bash
npm run dev -- --once
```

### Daily Scheduler
Start the daily scheduler (default: 6:00 AM):
```bash
npm start
```

### Custom Schedule Time
```bash
npm start -- --hour=7 --minute=30
```

## Development

```bash
# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Build for production
npm run build
```

## How It Works

1. **Authentication**: Connects to Spotify API using OAuth2 flow
2. **Data Collection**: Fetches your 200 most recent Liked Songs
3. **Phase Matching**: Uses keyword matching to categorize songs into ritual phases:
   - Searches track names and artist names for phase-specific keywords
   - Considers song duration preferences for each phase
   - Applies intelligent scoring with randomization for variety
4. **Playlist Generation**: Selects optimal tracks for each phase within duration constraints
5. **Spotify Integration**: Creates and populates the playlist in your Spotify account

## Phase Matching Criteria

Each phase uses keyword matching and duration preferences:
- **Going to Temple**: Keywords like "meditation", "calm", "peace", "ambient" | 2-6 min songs
- **Intro**: Keywords like "warm", "begin", "groove", "build" | 2-5 min songs  
- **Dancing With the Divine**: Keywords like "dance", "joy", "sacred", "spirit" | 3-6 min songs
- **Dealer's Choice**: Keywords like "wild", "free", "surprise" | 1-8 min songs (wide range)
- **Unleashing the Beast**: Keywords like "power", "intense", "warrior", "fire" | 3-7 min songs
- **Outro**: Keywords like "cool", "relax", "gentle", "peaceful" | 2-6 min songs

## Testing

The project includes comprehensive unit tests covering:
- Playlist generation logic
- Spotify API integration
- Scheduling functionality
- Phase matching algorithms

Run tests with:
```bash
npm test
```

## Dependencies

- **axios**: HTTP client for Spotify API
- **node-cron**: Task scheduling
- **dotenv**: Environment variable management
- **typescript**: Type safety
- **jest**: Testing framework

## License

MIT