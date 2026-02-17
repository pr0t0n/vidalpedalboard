import { useCallback, useRef, useState, useEffect } from 'react';
import Tuna from 'tunajs';

export interface TunerData {
  frequency: number;
  note: string;
  cents: number;
  octave: number;
  clarity: number;
}

export interface PedalState {
  compressor: boolean;
  drive: boolean;
  distortion: boolean;
  chorus: boolean;
  tremolo: boolean;
  delay: boolean;
  wah: boolean;
  reverb: boolean;
}

export interface PedalParams {
  compressor: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  drive: {
    gain: number;
    tone: number;
  };
  distortion: {
    gain: number;
    tone: number;
  };
  chorus: {
    rate: number;
    depth: number;
    feedback: number;
  };
  tremolo: {
    rate: number;
    depth: number;
  };
  delay: {
    time: number;
    feedback: number;
    mix: number;
  };
  wah: {
    frequency: number;
    resonance: number;
  };
  reverb: {
    decay: number;
    mix: number;
  };
  volume: number;
}

export interface PerformanceStats {
  cpu: number;
  memory: number;
  latency: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQUENCY = 440;

function frequencyToNote(frequency: number, clarity: number): TunerData {
  if (frequency < 20 || frequency > 5000 || !isFinite(frequency)) {
    return { frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 };
  }
  const semitonesFromA4 = 12 * Math.log2(frequency / A4_FREQUENCY);
  const roundedSemitones = Math.round(semitonesFromA4);
  const cents = Math.round((semitonesFromA4 - roundedSemitones) * 100);
  const midiNote = 69 + roundedSemitones;
  const note = NOTE_NAMES[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return { frequency, note, cents, octave, clarity };
}

// Pre-computed distortion curve cached by amount
const curveCache = new Map<number, Float32Array<ArrayBuffer>>();
function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const key = Math.round(amount * 100);
  if (curveCache.has(key)) return curveCache.get(key)!;
  const samples = 8192;
  const buffer = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buffer);
  const deg = Math.PI / 180;
  const intensity = amount * 300;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + intensity) * x * 20 * deg) / (Math.PI + intensity * Math.abs(x));
  }
  curveCache.set(key, curve);
  return curve;
}

export function useAudioEngine() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({ cpu: 0, memory: 0, latency: 0 });
  const [tunerData, setTunerData] = useState<TunerData>({ frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 });
  
  const [pedalState, setPedalState] = useState<PedalState>({
    compressor: false, drive: false, distortion: false, chorus: false,
    tremolo: false, delay: false, wah: false, reverb: false,
  });
  
  const [params, setParams] = useState<PedalParams>({
    compressor: { threshold: -20, ratio: 4, attack: 0.003, release: 0.25 },
    drive: { gain: 0.7, tone: 0.6 },
    distortion: { gain: 0.8, tone: 0.6 },
    chorus: { rate: 1.5, depth: 0.7, feedback: 0.4 },
    tremolo: { rate: 4, depth: 0.5 },
    delay: { time: 0.3, feedback: 0.4, mix: 0.5 },
    wah: { frequency: 0.5, resonance: 10 },
    reverb: { decay: 0.5, mix: 0.5 },
    volume: 0.8,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const tunaRef = useRef<Tuna | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  // Analyser is OFF the main signal path — connected in parallel
  const analyserRef = useRef<AnalyserNode | null>(null);
  const stereoMergerRef = useRef<ChannelMergerNode | null>(null);
  
  // Distortion nodes
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const distortionGainRef = useRef<GainNode | null>(null);
  const distortionToneRef = useRef<BiquadFilterNode | null>(null);
  const distortionPreGainRef = useRef<GainNode | null>(null);
  const distortionDryGainRef = useRef<GainNode | null>(null);
  
  const effectsRef = useRef<Record<string, any>>({});
  const meterIntervalRef = useRef<number | null>(null);
  const performanceIntervalRef = useRef<number | null>(null);

  const checkPermission = useCallback(async (): Promise<PermissionState | 'unknown'> => {
    try {
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return result.state;
      }
    } catch { /* unsupported */ }
    return 'unknown';
  }, []);

  // Lightweight meter — runs at 15fps via setInterval instead of rAF to reduce GC/scheduling overhead
  const startMeter = useCallback(() => {
    if (meterIntervalRef.current) return;
    const buffer = new Float32Array(256); // small reusable buffer
    meterIntervalRef.current = window.setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < 256; i++) sum += buffer[i] * buffer[i];
      setInputLevel(Math.min(1, Math.sqrt(sum / 256) * 5));
    }, 66); // ~15fps
  }, []);

  const stopMeter = useCallback(() => {
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
  }, []);

  const updatePerformanceStats = useCallback(() => {
    const stats: PerformanceStats = { cpu: 0, memory: 0, latency: 0 };
    if ((performance as any).memory) {
      const m = (performance as any).memory;
      stats.memory = Math.round((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100);
    }
    if (audioContextRef.current) {
      stats.latency = Math.round((audioContextRef.current.baseLatency || 0) * 1000);
    }
    setPerformanceStats(stats);
  }, []);

  const createAndConnectEffects = useCallback(() => {
    if (!tunaRef.current || !audioContextRef.current || !sourceRef.current || !gainNodeRef.current) {
      console.error('Audio context not ready');
      return;
    }
    
    const tuna = tunaRef.current;
    const ctx = audioContextRef.current;
    
    // Stereo merger for mono→stereo
    stereoMergerRef.current = ctx.createChannelMerger(2);
    
    // ===== ANALYSER OFF SIGNAL PATH =====
    // Key optimization: analyser taps the source in parallel, not in series
    analyserRef.current = ctx.createAnalyser();
    analyserRef.current.fftSize = 256; // absolute minimum for metering
    analyserRef.current.smoothingTimeConstant = 0.1;
    sourceRef.current.connect(analyserRef.current); // parallel tap — no latency added
    
    // ===== DISTORTION (native Web Audio) =====
    distortionPreGainRef.current = ctx.createGain();
    distortionPreGainRef.current.gain.value = 4;
    
    distortionNodeRef.current = ctx.createWaveShaper();
    distortionNodeRef.current.curve = makeDistortionCurve(params.distortion.gain);
    distortionNodeRef.current.oversample = '2x'; // reduced from 4x — huge latency save
    
    distortionGainRef.current = ctx.createGain();
    distortionGainRef.current.gain.value = pedalState.distortion ? 1 : 0;
    
    distortionToneRef.current = ctx.createBiquadFilter();
    distortionToneRef.current.type = 'lowpass';
    distortionToneRef.current.frequency.value = 2000 + params.distortion.tone * 6000;
    
    distortionDryGainRef.current = ctx.createGain();
    distortionDryGainRef.current.gain.value = pedalState.distortion ? 0 : 1;
    
    // ===== TUNA EFFECTS =====
    const effects = {
      compressor: new tuna.Compressor({
        threshold: params.compressor.threshold,
        ratio: params.compressor.ratio,
        attack: params.compressor.attack,
        release: params.compressor.release,
        bypass: !pedalState.compressor,
      }),
      overdrive: new tuna.Overdrive({
        outputGain: 0.8,
        drive: params.drive.gain * 1.5 + 0.3,
        curveAmount: params.drive.tone * 1.2,
        algorithmIndex: 0,
        bypass: !pedalState.drive,
      }),
      chorus: new tuna.Chorus({
        rate: params.chorus.rate,
        feedback: params.chorus.feedback,
        depth: params.chorus.depth,
        delay: 0.0045,
        bypass: !pedalState.chorus,
      }),
      tremolo: new tuna.Tremolo({
        intensity: params.tremolo.depth,
        rate: params.tremolo.rate,
        stereoPhase: 0,
        bypass: !pedalState.tremolo,
      }),
      delay: new tuna.Delay({
        feedback: params.delay.feedback,
        delayTime: params.delay.time * 1000,
        wetLevel: params.delay.mix,
        dryLevel: 1 - params.delay.mix * 0.5,
        cutoff: 2000,
        bypass: !pedalState.delay,
      }),
      wahwah: new tuna.WahWah({
        automode: false,
        baseFrequency: params.wah.frequency,
        excursionOctaves: 2,
        sweep: 0.2,
        resonance: params.wah.resonance,
        sensitivity: 0.5,
        bypass: !pedalState.wah,
      }),
      convolver: new tuna.Convolver({
        highCut: 22050, lowCut: 20,
        dryLevel: 1 - params.reverb.mix * 0.5,
        wetLevel: params.reverb.mix,
        level: 1,
        bypass: !pedalState.reverb,
      }),
    };
    
    effectsRef.current = effects;
    
    // ===== SIGNAL CHAIN (analyser is NOT in this path) =====
    // Source -> Compressor -> Drive -> Distortion -> Chorus -> Tremolo -> Delay -> Wah -> Reverb -> Gain -> Stereo -> Out
    
    let prev: AudioNode = sourceRef.current;
    
    prev.connect(effects.compressor);
    prev = effects.compressor;
    
    prev.connect(effects.overdrive);
    prev = effects.overdrive;
    
    // Distortion wet/dry
    prev.connect(distortionDryGainRef.current);
    prev.connect(distortionPreGainRef.current);
    distortionPreGainRef.current.connect(distortionNodeRef.current);
    distortionNodeRef.current.connect(distortionToneRef.current);
    distortionToneRef.current.connect(distortionGainRef.current);
    
    const distMixer = ctx.createGain();
    distortionDryGainRef.current.connect(distMixer);
    distortionGainRef.current.connect(distMixer);
    prev = distMixer;
    
    prev.connect(effects.chorus);
    prev = effects.chorus;
    
    prev.connect(effects.tremolo);
    prev = effects.tremolo;
    
    prev.connect(effects.delay);
    prev = effects.delay;
    
    prev.connect(effects.wahwah);
    prev = effects.wahwah;
    
    prev.connect(effects.convolver);
    prev = effects.convolver;
    
    prev.connect(gainNodeRef.current);
    
    // Stereo output
    gainNodeRef.current.connect(stereoMergerRef.current!, 0, 0);
    gainNodeRef.current.connect(stereoMergerRef.current!, 0, 1);
    stereoMergerRef.current!.connect(ctx.destination);
    
    console.log('Effects chain connected (analyser off signal path)');
  }, [params, pedalState]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const permission = await checkPermission();
      if (permission === 'denied') {
        throw new Error('Acesso ao microfone negado. Habilite nas configurações do navegador.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      
      streamRef.current = stream;
      
      // ULTRA LOW LATENCY: interactive hint + smallest buffer
      const ctx = new AudioContext({ 
        sampleRate: 44100,
        latencyHint: 'interactive', // browser picks smallest safe buffer
      });
      
      if (ctx.state === 'suspended') await ctx.resume();
      
      console.log(`AudioContext: sr=${ctx.sampleRate} baseLatency=${ctx.baseLatency}ms outputLatency=${(ctx as any).outputLatency || 'N/A'}ms`);
      
      audioContextRef.current = ctx;
      tunaRef.current = new Tuna(ctx);
      
      sourceRef.current = ctx.createMediaStreamSource(stream);
      
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.value = params.volume;
      
      createAndConnectEffects();
      
      setIsConnected(true);
      
      startMeter();
      performanceIntervalRef.current = window.setInterval(updatePerformanceStats, 2000); // reduced frequency
      
      console.log('Audio engine connected — low latency mode');
      
    } catch (err: any) {
      console.error('Audio connection error:', err);
      let errorMessage = 'Erro ao conectar áudio.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permissão de microfone negada. Clique no ícone de cadeado na barra de endereços e permita o acesso.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Nenhum dispositivo de áudio encontrado. Verifique se o iRig está conectado.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Dispositivo de áudio em uso por outro aplicativo.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [params.volume, checkPermission, createAndConnectEffects, startMeter, updatePerformanceStats]);

  const disconnect = useCallback(() => {
    stopMeter();
    if (performanceIntervalRef.current) {
      clearInterval(performanceIntervalRef.current);
      performanceIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    
    sourceRef.current = null;
    gainNodeRef.current = null;
    analyserRef.current = null;
    stereoMergerRef.current = null;
    distortionNodeRef.current = null;
    distortionGainRef.current = null;
    distortionToneRef.current = null;
    distortionPreGainRef.current = null;
    distortionDryGainRef.current = null;
    audioContextRef.current = null;
    tunaRef.current = null;
    effectsRef.current = {};
    
    setIsConnected(false);
    setInputLevel(0);
    setTunerData({ frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 });
    setPerformanceStats({ cpu: 0, memory: 0, latency: 0 });
  }, [stopMeter]);

  const togglePedal = useCallback((pedal: keyof PedalState) => {
    setPedalState(prev => {
      const newState = { ...prev, [pedal]: !prev[pedal] };
      
      const effectMap: Record<string, string> = {
        compressor: 'compressor', drive: 'overdrive', chorus: 'chorus',
        tremolo: 'tremolo', delay: 'delay', wah: 'wahwah', reverb: 'convolver',
      };
      
      const effectName = effectMap[pedal];
      if (effectName && effectsRef.current[effectName]) {
        effectsRef.current[effectName].bypass = !newState[pedal];
      }
      
      if (pedal === 'distortion') {
        if (distortionGainRef.current) distortionGainRef.current.gain.value = newState.distortion ? 1 : 0;
        if (distortionDryGainRef.current) distortionDryGainRef.current.gain.value = newState.distortion ? 0 : 1;
      }
      
      return newState;
    });
  }, []);

  const updateParam = useCallback((
    pedal: keyof Omit<PedalParams, 'volume'>,
    param: string,
    value: number | boolean
  ) => {
    setParams(prev => {
      const pedalParams = prev[pedal];
      if (typeof pedalParams === 'object' && pedalParams !== null) {
        return { ...prev, [pedal]: { ...pedalParams, [param]: value } };
      }
      return prev;
    });
  }, []);

  const setVolume = useCallback((value: number) => {
    setParams(prev => ({ ...prev, volume: value }));
    if (gainNodeRef.current) gainNodeRef.current.gain.value = value;
  }, []);

  // Update live effect params
  useEffect(() => {
    if (!isConnected) return;
    const effects = effectsRef.current;
    
    if (effects.compressor) {
      effects.compressor.threshold = params.compressor.threshold;
      effects.compressor.ratio = params.compressor.ratio;
    }
    if (effects.overdrive) {
      effects.overdrive.drive = params.drive.gain * 1.5 + 0.3;
      effects.overdrive.curveAmount = params.drive.tone * 1.2;
    }
    if (distortionNodeRef.current) {
      distortionNodeRef.current.curve = makeDistortionCurve(params.distortion.gain);
    }
    if (distortionToneRef.current) {
      distortionToneRef.current.frequency.value = 2000 + params.distortion.tone * 6000;
    }
    if (distortionGainRef.current) {
      distortionGainRef.current.gain.value = pedalState.distortion ? 1 : 0;
    }
    if (distortionDryGainRef.current) {
      distortionDryGainRef.current.gain.value = pedalState.distortion ? 0 : 1;
    }
    if (effects.chorus) {
      effects.chorus.rate = params.chorus.rate;
      effects.chorus.feedback = params.chorus.feedback;
      effects.chorus.depth = params.chorus.depth;
    }
    if (effects.tremolo) {
      effects.tremolo.intensity = params.tremolo.depth;
      effects.tremolo.rate = params.tremolo.rate;
    }
    if (effects.delay) {
      effects.delay.delayTime = params.delay.time * 1000;
      effects.delay.feedback = params.delay.feedback;
      effects.delay.wetLevel = params.delay.mix;
    }
    if (effects.wahwah) {
      effects.wahwah.baseFrequency = params.wah.frequency;
      effects.wahwah.resonance = params.wah.resonance;
    }
    if (effects.convolver) {
      effects.convolver.wetLevel = params.reverb.mix;
    }
  }, [params, isConnected, pedalState.distortion]);

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return {
    isConnected, isLoading, error, inputLevel, tunerData,
    pedalState, params, performanceStats,
    connect, disconnect, togglePedal, updateParam, setVolume,
    checkPermission,
  };
}
