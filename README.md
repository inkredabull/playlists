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

2. **Start ngrok and get forwarding URL:**
   ```bash
   ngrok http 8888
   ```
   - Keep this running in a separate terminal
   - Copy the HTTPS forwarding URL (e.g., `https://abc123.ngrok-free.app`)

3. **Configure Spotify API (local development):**
   - Copy `.env.example` to `.env`
   - Get your Spotify credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Fill in your credentials with the ngrok URL:
     ```
     SPOTIFY_CLIENT_ID=your_spotify_client_id
     SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
     SPOTIFY_REDIRECT_URI=https://your-ngrok-url.ngrok-free.app/callback
     PLAYLIST_DURATION_MINUTES=30
     ```
   - **Important**: In your Spotify app settings, add the same ngrok URL as a redirect URI:
     `https://your-ngrok-url.ngrok-free.app/callback`

4. **Authenticate with Spotify:**
   ```bash
   npm run auth
   ```
   This will:
   - Start a local callback server on port 8888
   - Open your browser to authorize the app
   - Automatically handle the OAuth callback via ngrok
   - Display your access tokens to add to your `.env` file

5. **Build the project:**
   ```bash
   npm run build
   ```

## Deploying to Fly.io

1. **Make sure the project builds locally**
   ```bash
   npm run build
   ```

2. **Set Fly secrets (mirrors the values in your `.env`)**
   ```bash
   fly secrets set \
     SPOTIFY_CLIENT_ID=... \
     SPOTIFY_CLIENT_SECRET=... \
     SPOTIFY_ACCESS_TOKEN=... \
     SPOTIFY_REFRESH_TOKEN=... \
     PLAYLIST_DURATION_MINUTES=30
   ```
   - `SPOTIFY_ACCESS_TOKEN` and `SPOTIFY_REFRESH_TOKEN` should be generated via the auth flow (see below).
   - If you are running the auth flow locally, keep `SPOTIFY_REDIRECT_URI=http://localhost:8888/callback`.
   - For Fly-hosted auth make sure `SPOTIFY_REDIRECT_URI=https://playlists-falling-meadow-3086.fly.dev/callback` is registered in the Spotify dashboard and set as a secret if you override it.

3. **Deploy**
   ```bash
   fly deploy
   ```
   Fly builds the Docker image using the provided `Dockerfile`, prunes dev dependencies, and starts the machine(s).

4. **Run the auth flow on Fly (optional)**
   - Connect to a running machine:
     ```bash
     fly ssh console -a playlists-falling-meadow-3086 --select
     ```
   - Inside the container:
     ```bash
     cd /app
     export PORT=3000
     export SPOTIFY_REDIRECT_URI=https://playlists-falling-meadow-3086.fly.dev/callback
     node dist/index.js --auth
     ```
   - Authorize in the browser and copy the tokens shown in the success page into `fly secrets set ...`.

5. **Monitor**
   ```bash
   fly status                                   # machine overview
   fly logs -a playlists-falling-meadow-3086    # tail logs
   fly machine list -a playlists-falling-meadow-3086
   ```
   If a machine is stuck after a crash loop you can remove it with:
   ```bash
   fly machine destroy <machine-id> -a playlists-falling-meadow-3086 --force
   ```

## Running the production image locally

You can reproduce the Fly container with Docker:

```bash
docker build -t playlist-prod .
docker run --rm -it -p 3000:3000 --env-file .env -e NODE_ENV=production playlist-prod
```

The container prints the same logs you see on Fly. To exec into the container or run the auth flow:

```bash
docker exec -it <container-id> /bin/bash
cd /app && node dist/index.js --auth
```

## Configuration

### Environment Variables
- `SPOTIFY_CLIENT_ID` - Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET` - Your Spotify app client secret  
- `SPOTIFY_REDIRECT_URI` - Your ngrok callback URL
- `PLAYLIST_DURATION_MINUTES` - Playlist duration in minutes (default: 30)

### Customizing Playlist Duration
You can change the playlist duration by setting `PLAYLIST_DURATION_MINUTES` in your `.env` file:
```bash
PLAYLIST_DURATION_MINUTES=45  # For 45-minute playlists
PLAYLIST_DURATION_MINUTES=20  # For 20-minute playlists
```

The phase durations will be scaled proportionally to maintain the ritual flow.

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
