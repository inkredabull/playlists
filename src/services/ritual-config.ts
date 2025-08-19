import { RitualPhase, PlaylistConfig } from '../types';

export const RITUAL_PHASES: RitualPhase[] = [
  {
    name: 'Going to Temple',
    description: 'Phase Shift / The Anticipation',
    targetDurationMs: 3 * 60 * 1000, // 3 minutes
    criteria: {
      keywords: ['temple', 'anticipation', 'phase', 'shift', 'intro', 'beginning', 'meditation', 'calm', 'serene', 'peace', 'still', 'quiet', 'ambient', 'acoustic'],
      durationRange: [2 * 60 * 1000, 6 * 60 * 1000] // 2-6 minutes
    }
  },
  {
    name: 'Intro',
    description: 'Gettin\' Goin\' / Range Ridin\' / Trance Walk / Warmup',
    targetDurationMs: 3 * 60 * 1000, // 3 minutes
    criteria: {
      keywords: ['intro', 'warm', 'begin', 'start', 'walk', 'ride', 'trance', 'groove', 'build', 'rise', 'awakening'],
      durationRange: [2 * 60 * 1000, 5 * 60 * 1000] // 2-5 minutes
    }
  },
  {
    name: 'Dancing With the Divine',
    description: 'The Prayer / Ecstasy / Being the Whirling Dervish / Celebrate / Finding Center',
    targetDurationMs: 4 * 60 * 1000, // 4 minutes
    criteria: {
      keywords: ['dance', 'divine', 'prayer', 'ecstasy', 'celebrate', 'center', 'dervish', 'bliss', 'joy', 'euphoria', 'sacred', 'spirit'],
      durationRange: [3 * 60 * 1000, 6 * 60 * 1000] // 3-6 minutes
    }
  },
  {
    name: 'Dealer\'s Choice',
    description: 'Wild card - anything goes',
    targetDurationMs: 3 * 60 * 1000, // 3 minutes
    criteria: {
      keywords: ['choice', 'wild', 'free', 'open', 'surprise', 'random', 'mix', 'variety'],
      durationRange: [1 * 60 * 1000, 8 * 60 * 1000] // 1-8 minutes (wide range)
    }
  },
  {
    name: 'Unleashing the Beast',
    description: 'Climbing the Mountain / Thick of It / Innit',
    targetDurationMs: 4 * 60 * 1000, // 4 minutes
    criteria: {
      keywords: ['beast', 'mountain', 'thick', 'climb', 'unleash', 'power', 'intense', 'fury', 'rage', 'strength', 'warrior', 'battle', 'fire', 'energy'],
      durationRange: [3 * 60 * 1000, 7 * 60 * 1000] // 3-7 minutes
    }
  },
  {
    name: 'Outro',
    description: 'Cool Down / Stretch',
    targetDurationMs: 3 * 60 * 1000, // 3 minutes
    criteria: {
      keywords: ['outro', 'cool', 'down', 'stretch', 'end', 'calm', 'relax', 'wind', 'finish', 'close', 'peaceful', 'gentle', 'soft'],
      durationRange: [2 * 60 * 1000, 6 * 60 * 1000] // 2-6 minutes
    }
  }
];

export const RITUAL_CONFIG: PlaylistConfig = {
  name: `The Ritual - ${new Date().toLocaleDateString()}`,
  description: 'A 20-minute journey through The Ritual phases',
  totalDurationMs: 20 * 60 * 1000, // 20 minutes
  phases: RITUAL_PHASES
};