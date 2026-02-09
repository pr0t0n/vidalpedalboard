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

// Create distortion curve for waveshaper - INCREASED POWER
function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 44100;
  const buffer = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buffer);
  const deg = Math.PI / 180;
  
  const intensity = amount * 500;
  
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + intensity) * x * 20 * deg) / (Math.PI + intensity * Math.abs(x));
  }
  
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
    compressor: false,
    drive: false,
    distortion: false,
    chorus: false,
    tremolo: false,
    delay: false,
    wah: false,
    reverb: false,
  });
  
  const [params, setParams] = useState<PedalParams>({
    compressor: { threshold: -15, ratio: 6, attack: 0.001, release: 0.15 },
    drive: { gain: 0.85, tone: 0.7 },
    distortion: { gain: 0.9, tone: 0.65 },
    chorus: { rate: 2, depth: 0.8, feedback: 0.5 },
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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const stereoMergerRef = useRef<ChannelMergerNode | null>(null);
  
  // Standard distortion nodes
  const distortionNodeRef = useRef<WaveShaperNode | null>(null);
  const distortionGainRef = useRef<GainNode | null>(null);
  const distortionToneRef = useRef<BiquadFilterNode | null>(null);
  const distortionPreGainRef = useRef<GainNode | null>(null);
  
  // EVH distortion nodes
  const evhWaveShaperRef = useRef<WaveShaperNode | null>(null);
  const evhPreGainRef = useRef<GainNode | null>(null);
  const evhLowCutRef = useRef<BiquadFilterNode | null>(null);
  const evhMidBoostRef = useRef<BiquadFilterNode | null>(null);
  const evhOutputRef = useRef<GainNode | null>(null);
  
  const effectsRef = useRef<Record<string, any>>({});
  const animationFrameRef = useRef<number | null>(null);
  const performanceIntervalRef = useRef<number | null>(null);

  const checkPermission = useCallback(async (): Promise<PermissionState | 'unknown'> => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return result.state;
      }
    } catch {
      // Permissions API not supported
    }
    return 'unknown';
  }, []);

  const updatePerformanceStats = useCallback(() => {
    const stats: PerformanceStats = { cpu: 0, memory: 0, latency: 0 };
    
    if ((performance as any).memory) {
      const memInfo = (performance as any).memory;
      stats.memory = Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100);
    }
    
    if (audioContextRef.current) {
      stats.latency = Math.round((audioContextRef.current.baseLatency || 0) * 1000);
    }
    
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      const now = performance.now();
      const start = now;
      requestAnimationFrame(() => {
        const frameTime = performance.now() - start;
        stats.cpu = Math.min(100, Math.round(frameTime / 16.67 * 100));
        setPerformanceStats(prev => ({ ...prev, ...stats }));
      });
    } else {
      setPerformanceStats(stats);
    }
  }, []);

  const updateInputLevel = useCallback(() => {
    if (!analyserRef.current || !isConnected) {
      animationFrameRef.current = requestAnimationFrame(updateInputLevel);
      return;
    }
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);
    
    // Calculate RMS for level meter
    let rms = 0;
    for (let i = 0; i < bufferLength; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / bufferLength);
    setInputLevel(Math.min(1, rms * 5));
    
    animationFrameRef.current = requestAnimationFrame(updateInputLevel);
  }, [isConnected]);

  const createAndConnectEffects = useCallback(() => {
    if (!tunaRef.current || !audioContextRef.current || !sourceRef.current || !gainNodeRef.current || !analyserRef.current) {
      console.error('Audio context not ready');
      return;
    }
    
    const tuna = tunaRef.current;
    const ctx = audioContextRef.current;
    
    // Create stereo merger for mono-to-stereo conversion
    stereoMergerRef.current = ctx.createChannelMerger(2);
    
    // ===== STANDARD DISTORTION =====
    distortionPreGainRef.current = ctx.createGain();
    distortionPreGainRef.current.gain.value = 6; // Higher pre-amplification
    
    distortionNodeRef.current = ctx.createWaveShaper();
    distortionNodeRef.current.curve = makeDistortionCurve(params.distortion.gain);
    distortionNodeRef.current.oversample = '4x';
    
    distortionGainRef.current = ctx.createGain();
    distortionGainRef.current.gain.value = pedalState.distortion ? 1 : 0;
    
    distortionToneRef.current = ctx.createBiquadFilter();
    distortionToneRef.current.type = 'lowpass';
    distortionToneRef.current.frequency.value = 2000 + params.distortion.tone * 6000;
    
    // Create Tuna effects with INCREASED POWER for overdrive
    const effects = {
      compressor: new tuna.Compressor({
        threshold: params.compressor.threshold,
        ratio: params.compressor.ratio,
        attack: params.compressor.attack,
        release: params.compressor.release,
        makeupGain: 3,
        bypass: !pedalState.compressor,
      }),
      overdrive: new tuna.Overdrive({
        outputGain: 1.0,
        drive: params.drive.gain * 2.0 + 0.4,
        curveAmount: params.drive.tone * 1.5,
        algorithmIndex: 0,
        bypass: !pedalState.drive,
      }),
      chorus: new tuna.Chorus({
        rate: params.chorus.rate,
        feedback: params.chorus.feedback,
        depth: params.chorus.depth,
        delay: 0.003,
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
        highCut: 22050,
        lowCut: 20,
        dryLevel: 1 - params.reverb.mix * 0.5,
        wetLevel: params.reverb.mix,
        level: 1,
        bypass: !pedalState.reverb,
      }),
    };
    
    effectsRef.current = effects;
    
    // Connect audio chain:
    // Source -> Analyser -> Compressor -> Drive -> Distortion/EVH -> Chorus -> Tremolo -> Delay -> Wah -> Reverb -> Gain -> Destination
    
    sourceRef.current.connect(analyserRef.current);
    
    let previousNode: AudioNode = analyserRef.current;
    
    // Compressor
    previousNode.connect(effects.compressor);
    previousNode = effects.compressor;
    
    // Overdrive
    previousNode.connect(effects.overdrive);
    previousNode = effects.overdrive;
    
    // Distortion (parallel dry/wet mixing)
    const distortionDryGain = ctx.createGain();
    distortionDryGain.gain.value = pedalState.distortion ? 0 : 1;
    
    previousNode.connect(distortionDryGain);
    previousNode.connect(distortionPreGainRef.current);
    distortionPreGainRef.current.connect(distortionNodeRef.current);
    distortionNodeRef.current.connect(distortionToneRef.current);
    distortionToneRef.current.connect(distortionGainRef.current);
    
    const distortionMixer = ctx.createGain();
    distortionDryGain.connect(distortionMixer);
    distortionGainRef.current.connect(distortionMixer);
    previousNode = distortionMixer;
    
    // Continue chain
    previousNode.connect(effects.chorus);
    previousNode = effects.chorus;
    
    previousNode.connect(effects.tremolo);
    previousNode = effects.tremolo;
    
    previousNode.connect(effects.delay);
    previousNode = effects.delay;
    
    previousNode.connect(effects.wahwah);
    previousNode = effects.wahwah;
    
    previousNode.connect(effects.convolver);
    previousNode = effects.convolver;
    
    previousNode.connect(gainNodeRef.current);
    
    // Connect to stereo output
    gainNodeRef.current.connect(stereoMergerRef.current, 0, 0);
    gainNodeRef.current.connect(stereoMergerRef.current, 0, 1);
    stereoMergerRef.current.connect(ctx.destination);
    
    console.log('Effects chain connected');
  }, [params, pedalState]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const permission = await checkPermission();
      console.log('Microphone permission status:', permission);
      
      if (permission === 'denied') {
        throw new Error('Acesso ao microfone negado. Habilite nas configurações do navegador.');
      }
      
      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000, // Higher sample rate for better quality
        },
      });
      
      console.log('Microphone stream obtained:', stream.getAudioTracks());
      streamRef.current = stream;
      
      // ULTRA LOW LATENCY CONFIGURATION
      const ctx = new AudioContext({ 
        sampleRate: 44100,
        latencyHint: 0 // Absolute minimum latency
      });
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      console.log('AudioContext state:', ctx.state, 'Sample rate:', ctx.sampleRate, 'Base latency:', ctx.baseLatency);
      
      audioContextRef.current = ctx;
      tunaRef.current = new Tuna(ctx);
      
      sourceRef.current = ctx.createMediaStreamSource(stream);
      
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.value = params.volume;
      
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 512; // Minimal for lowest latency
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      createAndConnectEffects();
      
      setIsConnected(true);
      
      animationFrameRef.current = requestAnimationFrame(updateInputLevel);
      performanceIntervalRef.current = window.setInterval(updatePerformanceStats, 1000);
      
      console.log('Audio engine connected successfully with low latency');
      
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
  }, [params.volume, checkPermission, createAndConnectEffects, updateInputLevel, updatePerformanceStats]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting audio engine...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (performanceIntervalRef.current) {
      clearInterval(performanceIntervalRef.current);
      performanceIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.label);
      });
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    sourceRef.current = null;
    gainNodeRef.current = null;
    analyserRef.current = null;
    stereoMergerRef.current = null;
    distortionNodeRef.current = null;
    distortionGainRef.current = null;
    distortionToneRef.current = null;
    distortionPreGainRef.current = null;
    audioContextRef.current = null;
    tunaRef.current = null;
    effectsRef.current = {};
    
    setIsConnected(false);
    setInputLevel(0);
    setTunerData({ frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 });
    setPerformanceStats({ cpu: 0, memory: 0, latency: 0 });
  }, []);

  const togglePedal = useCallback((pedal: keyof PedalState) => {
    setPedalState(prev => {
      const newState = { ...prev, [pedal]: !prev[pedal] };
      
      // Handle effect bypass
      const effectMap: Record<string, string> = {
        compressor: 'compressor',
        drive: 'overdrive',
        chorus: 'chorus',
        tremolo: 'tremolo',
        delay: 'delay',
        wah: 'wahwah',
        reverb: 'convolver',
      };
      
      const effectName = effectMap[pedal];
      if (effectName && effectsRef.current[effectName]) {
        effectsRef.current[effectName].bypass = !newState[pedal];
      }
      
      // Handle distortion separately (native Web Audio)
      if (pedal === 'distortion') {
        if (distortionGainRef.current) {
          distortionGainRef.current.gain.value = newState.distortion ? 1 : 0;
        }
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
        return {
          ...prev,
          [pedal]: {
            ...pedalParams,
            [param]: value,
          },
        };
      }
      return prev;
    });
  }, []);

  const setVolume = useCallback((value: number) => {
    setParams(prev => ({ ...prev, volume: value }));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value;
    }
  }, []);

  // Update effects when params change
  useEffect(() => {
    if (!isConnected) return;
    
    const effects = effectsRef.current;
    
    if (effects.compressor) {
      effects.compressor.threshold = params.compressor.threshold;
      effects.compressor.ratio = params.compressor.ratio;
    }
    
    if (effects.overdrive) {
      effects.overdrive.drive = params.drive.gain * 2.0 + 0.4;
      effects.overdrive.curveAmount = params.drive.tone * 1.5;
    }
    
    // Update distortion
    if (distortionNodeRef.current) {
      distortionNodeRef.current.curve = makeDistortionCurve(params.distortion.gain);
    }
    if (distortionToneRef.current) {
      distortionToneRef.current.frequency.value = 2000 + params.distortion.tone * 6000;
    }
    
    if (distortionGainRef.current) {
      distortionGainRef.current.gain.value = pedalState.distortion ? 1 : 0;
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isLoading,
    error,
    inputLevel,
    tunerData,
    pedalState,
    params,
    performanceStats,
    connect,
    disconnect,
    togglePedal,
    updateParam,
    setVolume,
    
    checkPermission,
  };
}
