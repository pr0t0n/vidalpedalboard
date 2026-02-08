import { PedalParams, PedalState } from '@/hooks/useAudioEngine';

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'rock' | 'blues' | 'metal' | 'clean' | 'ambient' | 'custom';
  pedalState: Partial<PedalState>;
  params: Partial<PedalParams>;
}

export const presets: Preset[] = [
  {
    id: 'clean',
    name: 'Clean',
    description: 'Cristalino, sem efeitos',
    category: 'clean',
    pedalState: {
      compressor: true,
      drive: false,
      chorus: false,
      tremolo: false,
      delay: false,
      wah: false,
      reverb: true,
    },
    params: {
      compressor: { threshold: -20, ratio: 4, attack: 0.003, release: 0.25 },
      reverb: { decay: 0.3, mix: 0.2 },
      volume: 0.8,
    },
  },
  {
    id: 'van-halen',
    name: 'Brown Sound',
    description: 'Eddie Van Halen - Hard Rock clássico',
    category: 'rock',
    pedalState: {
      compressor: true,
      drive: true,
      chorus: true,
      tremolo: false,
      delay: true,
      wah: false,
      reverb: true,
    },
    params: {
      compressor: { threshold: -15, ratio: 6, attack: 0.002, release: 0.2 },
      drive: { gain: 0.75, tone: 0.65 },
      chorus: { rate: 0.8, depth: 0.3, feedback: 0.2 },
      delay: { time: 0.35, feedback: 0.3, mix: 0.25 },
      reverb: { decay: 0.4, mix: 0.3 },
      volume: 0.85,
    },
  },
  {
    id: 'hard-rock',
    name: 'Hard Rock',
    description: 'AC/DC, Guns N\' Roses style',
    category: 'rock',
    pedalState: {
      compressor: true,
      drive: true,
      chorus: false,
      tremolo: false,
      delay: false,
      wah: false,
      reverb: true,
    },
    params: {
      compressor: { threshold: -18, ratio: 5, attack: 0.003, release: 0.25 },
      drive: { gain: 0.65, tone: 0.7 },
      reverb: { decay: 0.35, mix: 0.25 },
      volume: 0.85,
    },
  },
  {
    id: 'metal',
    name: 'Metal',
    description: 'High gain agressivo',
    category: 'metal',
    pedalState: {
      compressor: true,
      drive: true,
      chorus: false,
      tremolo: false,
      delay: false,
      wah: false,
      reverb: true,
    },
    params: {
      compressor: { threshold: -12, ratio: 8, attack: 0.001, release: 0.15 },
      drive: { gain: 0.95, tone: 0.55 },
      reverb: { decay: 0.25, mix: 0.15 },
      volume: 0.9,
    },
  },
  {
    id: 'blues',
    name: 'Blues',
    description: 'Tone quente e expressivo',
    category: 'blues',
    pedalState: {
      compressor: true,
      drive: true,
      chorus: false,
      tremolo: false,
      delay: true,
      wah: false,
      reverb: true,
    },
    params: {
      compressor: { threshold: -25, ratio: 3, attack: 0.005, release: 0.3 },
      drive: { gain: 0.4, tone: 0.45 },
      delay: { time: 0.25, feedback: 0.2, mix: 0.2 },
      reverb: { decay: 0.5, mix: 0.35 },
      volume: 0.75,
    },
  },
  {
    id: 'ambient',
    name: 'Ambient',
    description: 'Espacial e atmosférico',
    category: 'ambient',
    pedalState: {
      compressor: true,
      drive: false,
      chorus: true,
      tremolo: true,
      delay: true,
      wah: false,
      reverb: true,
    },
    params: {
      compressor: { threshold: -30, ratio: 2, attack: 0.01, release: 0.5 },
      chorus: { rate: 0.5, depth: 0.6, feedback: 0.4 },
      tremolo: { rate: 2, depth: 0.3 },
      delay: { time: 0.5, feedback: 0.5, mix: 0.45 },
      reverb: { decay: 0.8, mix: 0.6 },
      volume: 0.7,
    },
  },
  {
    id: 'funk-wah',
    name: 'Funk Wah',
    description: 'Groove com wah expressivo',
    category: 'clean',
    pedalState: {
      compressor: true,
      drive: false,
      chorus: false,
      tremolo: false,
      delay: false,
      wah: true,
      reverb: false,
    },
    params: {
      compressor: { threshold: -20, ratio: 4, attack: 0.002, release: 0.2 },
      wah: { frequency: 0.5, resonance: 15 },
      volume: 0.8,
    },
  },
];

export function getPresetsByCategory(category: Preset['category']): Preset[] {
  return presets.filter(p => p.category === category);
}

export function getPresetById(id: string): Preset | undefined {
  return presets.find(p => p.id === id);
}
