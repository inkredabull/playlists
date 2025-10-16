import { RitualPhase, PlaylistConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface YamlPhase {
  name: string;
  duration_minutes: number;
  description: string;
  keywords: string[];
  duration_range: {
    min: number;
    max: number;
  };
}

interface YamlConfig {
  phases: YamlPhase[];
  total_duration_minutes: number;
  total_duration_ms: number;
  playlist_name: string;
  playlist_description: string;
}

function loadRitualConfig(): PlaylistConfig {
  try {
    const configPath = path.join(process.cwd(), 'ritual-phases.yaml');
    const yamlContent = fs.readFileSync(configPath, 'utf8');
    const yamlConfig: YamlConfig = yaml.load(yamlContent) as YamlConfig;

    // Allow override of total duration via environment variable
    const envDurationMinutes = process.env.PLAYLIST_DURATION_MINUTES;
    const totalDurationMinutes = envDurationMinutes ? parseInt(envDurationMinutes, 10) : yamlConfig.total_duration_minutes;
    const totalDurationMs = totalDurationMinutes * 60 * 1000;

    // Scale phase durations proportionally if duration is overridden
    const scaleFactor = totalDurationMinutes / yamlConfig.total_duration_minutes;

    const phases: RitualPhase[] = yamlConfig.phases.map(phase => ({
      name: phase.name,
      description: phase.description,
      targetDurationMs: Math.round(phase.duration_minutes * 60 * 1000 * scaleFactor),
      criteria: {
        keywords: phase.keywords,
        durationRange: [phase.duration_range.min, phase.duration_range.max]
      }
    }));

    return {
      name: `${yamlConfig.playlist_name} - ${new Date().toLocaleDateString()}`,
      description: yamlConfig.playlist_description.replace('30-minute', `${totalDurationMinutes}-minute`),
      totalDurationMs: totalDurationMs,
      phases: phases
    };
  } catch (error) {
    console.error('Failed to load ritual-phases.yaml, using fallback config:', error);
    
    // Fallback to environment variable or default 30 minutes
    const envDurationMinutes = process.env.PLAYLIST_DURATION_MINUTES;
    const totalDurationMinutes = envDurationMinutes ? parseInt(envDurationMinutes, 10) : 30;
    const totalDurationMs = totalDurationMinutes * 60 * 1000;
    
    return {
      name: `The Ritual - ${new Date().toLocaleDateString()}`,
      description: `A ${totalDurationMinutes}-minute journey through The Ritual phases`,
      totalDurationMs: totalDurationMs,
      phases: []
    };
  }
}

export const RITUAL_CONFIG: PlaylistConfig = loadRitualConfig();