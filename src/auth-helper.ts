import { SpotifyService } from './services/spotify';
import * as http from 'http';
import * as url from 'url';

export async function startAuthFlow(): Promise<{ accessToken: string; refreshToken: string }> {
  const spotifyService = new SpotifyService();
  const authUrl = spotifyService.getAuthUrl();
  
  console.log('🔐 Starting Spotify authentication...');
  console.log('\n📝 Please visit this URL to authorize the application:');
  console.log(`\n${authUrl}\n`);
  console.log('🚀 Waiting for authorization callback...\n');

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = url.parse(req.url!, true);
        
        if (parsedUrl.pathname === '/callback') {
          const code = parsedUrl.query.code as string;
          const error = parsedUrl.query.error as string;

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>❌ Authorization Error</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error(`Authorization error: ${error}`));
            return;
          }

          if (code) {
            try {
              const tokens = await spotifyService.exchangeCodeForTokens(code);
              
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>✅ Authorization Successful!</h1>
                    <p>You can now close this window and return to the terminal.</p>
                    <h3>Add these to your .env file:</h3>
                    <pre>
SPOTIFY_ACCESS_TOKEN=${tokens.access_token}
SPOTIFY_REFRESH_TOKEN=${tokens.refresh_token}
                    </pre>
                  </body>
                </html>
              `);
              
              server.close();
              resolve({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token
              });
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ Token Exchange Error</h1>
                    <p>Error: ${error}</p>
                  </body>
                </html>
              `);
              server.close();
              reject(error);
            }
          } else {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>❌ Missing Authorization Code</h1>
                  <p>No authorization code received.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error('No authorization code received'));
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        server.close();
        reject(error);
      }
    });

    const port = process.env.PORT || 8888;
    server.listen(port, () => {
      console.log(`🌐 Authorization server started on http://localhost:${port}`);
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}