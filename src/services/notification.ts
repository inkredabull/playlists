import { Resend } from 'resend';
import { GeneratedPlaylist } from '../types';

interface PlaylistNotificationContext {
  playlist: GeneratedPlaylist;
  playlistId: string;
}

export class NotificationService {
  private resend?: Resend;
  private fromEmail?: string;
  private toEmail?: string;
  private configWarningLogged = false;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.RESEND_FROM_EMAIL;
    this.toEmail = process.env.RESEND_NOTIFICATION_EMAIL;

    if (apiKey && this.fromEmail && this.toEmail) {
      this.resend = new Resend(apiKey);
    }
  }

  async notifyPlaylistCreated(context: PlaylistNotificationContext): Promise<void> {
    if (!this.resend || !this.fromEmail || !this.toEmail) {
      if (!this.configWarningLogged) {
        console.log('ℹ️  Email notifications disabled. Provide RESEND_API_KEY, RESEND_FROM_EMAIL, and RESEND_NOTIFICATION_EMAIL to enable.');
        this.configWarningLogged = true;
      }
      return;
    }

    const { playlist, playlistId } = context;
    const totalMinutes = Math.round(playlist.totalDurationMs / 60000);
    const playlistUrl = `https://open.spotify.com/playlist/${playlistId}`;

    const phaseRows = playlist.phaseBreakdown.map(phase => {
      const minutes = Math.round(phase.durationMs / 60000);
      return `<tr>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;">${phase.phase}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;">${phase.tracks.length}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;">${minutes}</td>
      </tr>`;
    }).join('');

    const html = `
      <div style="font-family:Arial, sans-serif;line-height:1.6;">
        <h2 style="margin-bottom:16px;">🎉 New Ritual Playlist Created!</h2>
        <p>A fresh playlist is ready on Spotify.</p>
        <p>
          <strong>Name:</strong> ${playlist.name}<br/>
          <strong>Tracks:</strong> ${playlist.tracks.length}<br/>
          <strong>Total Duration:</strong> ${totalMinutes} minutes
        </p>
        <p>
          <a href="${playlistUrl}" style="display:inline-block;padding:10px 16px;background:#1DB954;color:white;text-decoration:none;border-radius:4px;">Open in Spotify</a>
        </p>
        <h3 style="margin-top:24px;">Phase Breakdown</h3>
        <table style="border-collapse:collapse;">
          <thead>
            <tr>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f9fafb;text-align:left;">Phase</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f9fafb;text-align:center;">Tracks</th>
              <th style="padding:6px 8px;border:1px solid #e5e7eb;background:#f9fafb;text-align:center;">Minutes</th>
            </tr>
          </thead>
          <tbody>
            ${phaseRows}
          </tbody>
        </table>
      </div>
    `;

    const text = [
      'New Ritual Playlist Created!',
      `Name: ${playlist.name}`,
      `Tracks: ${playlist.tracks.length}`,
      `Total Duration: ${totalMinutes} minutes`,
      '',
      'Phase Breakdown:',
      ...playlist.phaseBreakdown.map(phase => {
        const minutes = Math.round(phase.durationMs / 60000);
        return ` - ${phase.phase}: ${phase.tracks.length} tracks, ${minutes} minutes`;
      }),
      '',
      `Open in Spotify: ${playlistUrl}`
    ].join('\n');

    try {
      console.log('📨 Sending notification via Resend', {
        from: this.fromEmail,
        to: this.toEmail,
        playlistId,
        totalTracks: playlist.tracks.length,
        totalMinutes
      });

      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: this.toEmail,
        subject: `New Ritual Playlist: ${playlist.name}`,
        html,
        text
      });
      if (response.error) {
        console.error('⚠️  Resend reported an error response', response.error);
      } else {
        console.log('📧 Notification email sent via Resend', {
          id: response.data?.id
        });
      }
    } catch (error) {
      console.error('⚠️  Failed to send notification email:', error);
    }
  }
}
