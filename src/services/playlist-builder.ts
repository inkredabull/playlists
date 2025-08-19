import { SpotifyTrack, AudioFeatures, RitualPhase, GeneratedPlaylist, PhaseCriteria } from '../types';
import { SpotifyService } from './spotify';
import { RITUAL_CONFIG } from './ritual-config';

export class PlaylistBuilder {
  private spotifyService: SpotifyService;

  constructor(spotifyService: SpotifyService) {
    this.spotifyService = spotifyService;
  }

  async generateRitualPlaylist(): Promise<GeneratedPlaylist> {
    const likedSongs = await this.spotifyService.getLikedSongs(200, 0);
    
    if (likedSongs.length === 0) {
      throw new Error('No liked songs found');
    }
    
    const selectedTracks: SpotifyTrack[] = [];
    const phaseBreakdown: Array<{ phase: string; tracks: SpotifyTrack[]; durationMs: number }> = [];
    let totalDuration = 0;

    for (const phase of RITUAL_CONFIG.phases) {
      const phaseTracks = this.selectTracksForPhase(likedSongs, phase, selectedTracks);
      
      if (phaseTracks.length === 0) {
        console.warn(`No tracks found for phase: ${phase.name}`);
        continue;
      }

      const phaseDuration = phaseTracks.reduce((sum, track) => sum + track.duration_ms, 0);
      
      selectedTracks.push(...phaseTracks);
      totalDuration += phaseDuration;
      
      phaseBreakdown.push({
        phase: phase.name,
        tracks: phaseTracks,
        durationMs: phaseDuration
      });
    }

    const adjustedTracks = this.adjustToTargetDuration(selectedTracks, RITUAL_CONFIG.totalDurationMs);
    const finalDuration = adjustedTracks.reduce((sum, track) => sum + track.duration_ms, 0);

    return {
      name: RITUAL_CONFIG.name,
      tracks: adjustedTracks,
      totalDurationMs: finalDuration,
      phaseBreakdown: this.recalculatePhaseBreakdown(phaseBreakdown, adjustedTracks)
    };
  }


  private selectTracksForPhase(
    availableTracks: SpotifyTrack[], 
    phase: RitualPhase, 
    alreadySelected: SpotifyTrack[]
  ): SpotifyTrack[] {
    const usedIds = new Set(alreadySelected.map(t => t.id));
    const candidates = availableTracks.filter(track => 
      !usedIds.has(track.id) && this.matchesPhaseCriteria(track, phase.criteria)
    );

    if (candidates.length === 0) {
      return availableTracks
        .filter(track => !usedIds.has(track.id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
    }

    const scored = candidates.map(track => ({
      track,
      score: this.calculatePhaseScore(track, phase.criteria)
    })).sort((a, b) => b.score - a.score);

    return this.selectOptimalTracks(scored.map(s => s.track), phase.targetDurationMs);
  }

  private matchesPhaseCriteria(track: SpotifyTrack, criteria: PhaseCriteria): boolean {
    // Check duration range
    if (criteria.durationRange) {
      const [minDuration, maxDuration] = criteria.durationRange;
      if (track.duration_ms < minDuration || track.duration_ms > maxDuration) {
        return false;
      }
    }

    // Check keywords in track name and artist names
    if (criteria.keywords && criteria.keywords.length > 0) {
      const trackText = `${track.name} ${track.artists.map(a => a.name).join(' ')}`.toLowerCase();
      const hasKeywordMatch = criteria.keywords.some(keyword => 
        trackText.includes(keyword.toLowerCase())
      );
      return hasKeywordMatch;
    }

    return true; // If no criteria specified, track matches
  }

  private calculatePhaseScore(track: SpotifyTrack, criteria: PhaseCriteria): number {
    let score = 0;

    // Score based on keyword matches
    if (criteria.keywords && criteria.keywords.length > 0) {
      const trackText = `${track.name} ${track.artists.map(a => a.name).join(' ')}`.toLowerCase();
      const keywordMatches = criteria.keywords.filter(keyword => 
        trackText.includes(keyword.toLowerCase())
      ).length;
      score += keywordMatches * 2; // Higher weight for keyword matches
    }

    // Score based on duration preference (closer to target duration gets higher score)
    if (criteria.durationRange) {
      const [minDuration, maxDuration] = criteria.durationRange;
      const targetDuration = (minDuration + maxDuration) / 2;
      const durationDiff = Math.abs(track.duration_ms - targetDuration);
      const maxDiff = (maxDuration - minDuration) / 2;
      const durationScore = Math.max(0, 1 - (durationDiff / maxDiff));
      score += durationScore;
    }

    // Add some randomness to avoid always picking the same songs
    score += Math.random() * 0.5;

    return score;
  }


  private selectOptimalTracks(tracks: SpotifyTrack[], targetDurationMs: number): SpotifyTrack[] {
    tracks.sort(() => Math.random() - 0.5);
    
    let selectedTracks: SpotifyTrack[] = [];
    let currentDuration = 0;
    
    for (const track of tracks) {
      if (currentDuration + track.duration_ms <= targetDurationMs * 1.2) {
        selectedTracks.push(track);
        currentDuration += track.duration_ms;
        
        if (currentDuration >= targetDurationMs * 0.8) {
          break;
        }
      }
    }

    if (selectedTracks.length === 0 && tracks.length > 0) {
      selectedTracks = [tracks[0]];
    }

    return selectedTracks;
  }

  private adjustToTargetDuration(tracks: SpotifyTrack[], targetDurationMs: number): SpotifyTrack[] {
    const currentDuration = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    
    if (Math.abs(currentDuration - targetDurationMs) <= 60000) {
      return tracks;
    }
    
    if (currentDuration > targetDurationMs) {
      let adjustedTracks = [...tracks];
      let adjustedDuration = currentDuration;
      
      while (adjustedDuration > targetDurationMs && adjustedTracks.length > 1) {
        const longestIndex = adjustedTracks.reduce((maxI, track, i, arr) => 
          track.duration_ms > arr[maxI].duration_ms ? i : maxI, 0);
        
        adjustedDuration -= adjustedTracks[longestIndex].duration_ms;
        adjustedTracks.splice(longestIndex, 1);
      }
      
      return adjustedTracks;
    }
    
    return tracks;
  }

  private recalculatePhaseBreakdown(
    originalBreakdown: Array<{ phase: string; tracks: SpotifyTrack[]; durationMs: number }>,
    finalTracks: SpotifyTrack[]
  ): Array<{ phase: string; tracks: SpotifyTrack[]; durationMs: number }> {
    const finalTrackIds = new Set(finalTracks.map(t => t.id));
    
    return originalBreakdown.map(phase => {
      const remainingTracks = phase.tracks.filter(track => finalTrackIds.has(track.id));
      return {
        ...phase,
        tracks: remainingTracks,
        durationMs: remainingTracks.reduce((sum, track) => sum + track.duration_ms, 0)
      };
    }).filter(phase => phase.tracks.length > 0);
  }
}