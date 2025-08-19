import dotenv from 'dotenv';
import { SpotifyService } from './services/spotify';

dotenv.config();

async function testWithRefresh() {
  const spotify = new SpotifyService();
  
  // Set tokens from environment variables
  if (!process.env.SPOTIFY_ACCESS_TOKEN || !process.env.SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Spotify tokens not found in environment variables');
  }

  // Set tokens directly for testing
  // @ts-ignore - Accessing private properties for testing
  spotify['accessToken'] = process.env.SPOTIFY_ACCESS_TOKEN;
  // @ts-ignore
  spotify['refreshToken'] = process.env.SPOTIFY_REFRESH_TOKEN;
  
  // Test if the access token is valid
  try {
    console.log('Testing access token...');
    // @ts-ignore - Accessing private method for testing
    await spotify.authenticate();
    console.log('✅ Access token is valid');
  } catch (error) {
    console.error('❌ Access token is invalid or expired');
    console.log('Attempting to refresh token...');
    try {
      // @ts-ignore - Accessing private method for testing
      await spotify.refreshAccessToken();
      console.log('✅ Token refreshed successfully');
    } catch (refreshError) {
      console.error('❌ Failed to refresh token:', refreshError);
      throw new Error('Could not obtain a valid access token');
    }
  }
  
  // Test with a known valid track ID ("Blinding Lights" by The Weeknd)
  const testTrackId = '0VjIjW4GlUZAMYd2vXMi3b';
  
  try {
    console.log('Testing with current access token...');
    
    // First, check the current user's profile to see what scopes we have
    console.log('Fetching current user profile...');
    const meResponse = await spotify['api'].get('/me');
    console.log('Current user:', meResponse.data.display_name || 'Unknown');
    
    // Try to get the track with audio features included
    console.log('Fetching track with audio features...');
    try {
      const trackResponse = await spotify['api'].get(`/tracks/${testTrackId}`, {
        params: {
          market: 'from_token'
        }
      });
      
      const track = trackResponse.data;
      console.log('Track details:', {
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown',
        album: track.album?.name || 'Unknown'
      });
      
      // Try to get audio features directly
      console.log('Trying direct audio features endpoint...');
      try {
        const featuresResponse = await spotify['api'].get(`/audio-features/${testTrackId}`);
        console.log('Successfully got audio features directly!');
        return { success: true, features: [featuresResponse.data] };
      } catch (featuresError) {
        console.error('Direct audio features failed:', featuresError.response?.data || featuresError.message);
      }
      
      // If direct audio features failed, try getting several tracks at once
      console.log('Trying to get multiple tracks with audio features...');
      try {
        const tracksResponse = await spotify['api'].get('/tracks', {
          params: {
            ids: [testTrackId, '3n3Ppam7vgaVa1o82s6a5p', '4cOdK2wGLETKBW3PvgPWqT'].join(','),
            market: 'from_token'
          }
        });
        console.log('Got multiple tracks:', tracksResponse.data.tracks.length);
        return { success: true, tracks: tracksResponse.data.tracks };
      } catch (tracksError) {
        console.error('Failed to get multiple tracks:', tracksError.response?.data || tracksError.message);
        throw new Error('All audio features endpoints failed');
      }
      
    } catch (trackError) {
      console.error('Failed to get track:', trackError.response?.data || trackError.message);
      throw trackError;
    }
  } catch (error) {
    console.log('First attempt failed, trying to refresh token...');
    
    try {
      // @ts-ignore - Accessing private method for testing
      await spotify.refreshAccessToken();
      console.log('Token refreshed, trying again...');
      
      const features = await spotify.getAudioFeatures([testTrackId]);
      console.log('Success after token refresh!');
      return { success: true, features };
    } catch (refreshError) {
      console.error('Failed after token refresh:', refreshError);
      return { success: false, error: refreshError };
    }
  }
}

// Run the test
testWithRefresh().then(({ success, features, error }) => {
  if (success) {
    console.log('✅ Test completed successfully!');
    console.log('Features:', JSON.stringify(features, null, 2));
    process.exit(0);
  } else {
    console.error('❌ Test failed');
    console.error('Error:', error);
    process.exit(1);
  }
});
