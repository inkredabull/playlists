# Automated Playlist Flow Generator

Builds daily Spotify playlists that follow a curated energy arc. The app pulls from your Liked Songs, scores tracks against a configurable set of phases, and publishes the final playlist automatically. The default configuration expresses a “ritual” journey, but every phase can be renamed, reordered, or redefined to fit any musical flow you care about.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy the example env file and fill in Spotify credentials**
   ```bash
   cp .env.example .env
   ```
3. **Expose a local callback URL** – easiest with ngrok:
   ```bash
   ngrok http 8888
   ```
   Set `SPOTIFY_REDIRECT_URI` to the forwarded HTTPS URL ending in `/callback`, and register the same URL in the Spotify Developer Dashboard.
4. **Authenticate with Spotify**
   ```bash
   npm run auth
   ```
   Paste the returned access and refresh tokens into `.env`.
5. **Generate a playlist once**
   ```bash
   npm run dev -- --once
   ```
   Alternatively run `npm start` to launch the daily scheduler (defaults to 3:00 AM).

## Key Capabilities

- 🎛️ Configurable playlist phases stored in `ritual-phases.yaml`
- 🔍 Keyword and duration-based matching for each phase
- ⚖️ Automatic duration balancing to hit your target runtime
- 🗓️ Daily scheduler with pluggable run time (3 AM by default)
- 📬 Optional Resend-powered email notifications after each playlist is published
- ☁️ Fly.io deployment recipe with Dockerfile and GitHub Actions workflow
- 🧪 Jest unit tests and TypeScript throughout

## Designing Your Playlist Arc

The playlist arc is defined in `ritual-phases.yaml`. Each phase declares:

- `name` and `description`
- `duration_minutes` and acceptable `duration_range`
- `keywords` used to match track/artist names

The default file describes a six-phase journey (Temple → Intro → High-energy → Cooldown). Rename phases, change durations, or add/remove stages to suit any theme—energizing morning mix, mood-driven study session, etc. `PLAYLIST_DURATION_MINUTES` scales the whole arc proportionally.

## Local Development Details

### Spotify setup
- Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
- Add your ngrok HTTPS URL (ending in `/callback`) to the app’s redirect URI list.
- Populate `.env` with:
  ```
  SPOTIFY_CLIENT_ID=...
  SPOTIFY_CLIENT_SECRET=...
  SPOTIFY_REDIRECT_URI=https://<your-ngrok>.ngrok-free.app/callback
  PLAYLIST_DURATION_MINUTES=30       # adjust as needed
  ```

### Authentication flow
- Run `npm run auth`.
- Approve the Spotify access request.
- Copy the printed access & refresh tokens into `.env`.
- You can re-run `npm run auth` whenever you need fresh tokens.

### Useful commands
| Action | Command |
| --- | --- |
| Build TypeScript | `npm run build` |
| Generate once | `npm run dev -- --once` |
| Start scheduled run | `npm start` |
| Custom schedule | `npm start -- --hour=7 --minute=30` |
| Run tests | `npm test` |
| Lint | `npm run lint` |

## Email Notifications (optional)

Set up [Resend](https://resend.com/) if you want an email every time a playlist is published.

1. Verify a sending domain and create an API key in Resend.
2. Add the following to `.env` (and to Fly secrets in production):
   ```
   RESEND_API_KEY=...
   RESEND_FROM_EMAIL=notifications@yourdomain.com
   RESEND_NOTIFICATION_EMAIL=you@example.com
   ```
3. When the app finishes building a playlist, it will log the Resend message ID and send the email.

If any of the variables are missing, notifications are skipped gracefully with an informative log line.

## Deployment to Fly.io

1. **Confirm the build works locally**
   ```bash
   npm run build
   ```
2. **Push secrets to Fly (mirrors `.env`)**
   ```bash
   fly secrets set \
     SPOTIFY_CLIENT_ID=... \
     SPOTIFY_CLIENT_SECRET=... \
     SPOTIFY_ACCESS_TOKEN=... \
     SPOTIFY_REFRESH_TOKEN=... \
     PLAYLIST_DURATION_MINUTES=30 \
     RESEND_API_KEY=... \
     RESEND_FROM_EMAIL=... \
     RESEND_NOTIFICATION_EMAIL=...
   ```
   Keep `SPOTIFY_REDIRECT_URI=http://localhost:8888/callback` unless you’re running the auth flow on Fly; in that case set it to `https://<app>.fly.dev/callback` and register it with Spotify.
3. **Deploy**
   ```bash
   fly deploy
   ```
4. **Optional: run the auth flow on the Fly machine**
   ```bash
   fly ssh console -a <app> --select
   cd /app
   export PORT=3000
   export SPOTIFY_REDIRECT_URI=https://<app>.fly.dev/callback
   node dist/index.js --auth
   ```
5. **Monitor**
   ```bash
   fly status
   fly logs -a <app>
   fly machine list -a <app>
   ```
   Remove stuck machines with `fly machine destroy <id> -a <app> --force`.

## Running the Production Image Locally

```bash
docker build -t playlist-prod .
docker run --rm -it -p 3000:3000 --env-file .env -e NODE_ENV=production playlist-prod
```

Attach to the container with `docker exec -it <id> /bin/bash` if you need to rerun `node dist/index.js --auth` or inspect logs.

## Configuration Reference

| Variable | Description |
| --- | --- |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify credentials |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL |
| `SPOTIFY_ACCESS_TOKEN` / `SPOTIFY_REFRESH_TOKEN` | tokens obtained via `npm run auth` |
| `PLAYLIST_DURATION_MINUTES` | Target playlist length (scales phase durations) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_NOTIFICATION_EMAIL` | Email notification settings (optional) |

The phase definitions live in `ritual-phases.yaml`; adjust keywords, durations, and descriptions there. Update the file before rebuilding if you want a different flow.

## Development & Testing

```bash
# Development mode with hot reload
npm run dev

# Jest unit tests
npm test

# Watch mode
npm run test:watch

# ESLint
npm run lint
```

The project is written in TypeScript and uses Jest for unit tests. Scheduling is provided by `node-cron`, Spotify calls use `axios`, and email notifications rely on the Resend SDK.

## License

MIT
