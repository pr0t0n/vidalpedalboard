import { useCallback, useRef, useState, useEffect } from 'react';
import Tuna from 'tunajs';

export interface PedalState {
  tuner: boolean;
  compressor: boolean;
  drive: boolean;
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

export interface TunerData {
  frequency: number;
  note: string;
  cents: number;
  octave: number;
}

export interface PerformanceStats {
  cpu: number;
  memory: number;
  latency: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(frequency: number): TunerData {
  if (frequency < 20 || frequency > 20000) {
    return { frequency: 0, note: '-', cents: 0, octave: 0 };
  }
  
  const noteNum = 12 * (Math.log2(frequency / 440)) + 69;
  const roundedNote = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNote) * 100);
  const note = NOTE_NAMES[roundedNote % 12];
  const octave = Math.floor(roundedNote / 12) - 1;
  
  return { frequency, note, cents, octave };
}

function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  let rms = 0;
  
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  
  if (rms < 0.01) return -1;
  
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }
  
  const trimmedBuffer = buffer.slice(r1, r2);
  const trimmedSize = trimmedBuffer.length;
  
  if (trimmedSize < 2) return -1;
  
  const c = new Array(trimmedSize).fill(0);
  for (let i = 0; i < trimmedSize; i++) {
    for (let j = 0; j < trimmedSize - i; j++) {
      c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
    }
  }
  
  let d = 0;
  while (d < trimmedSize - 1 && c[d] > c[d + 1]) d++;
  
  if (d >= trimmedSize - 1) return -1;
  
  let maxval = -1, maxpos = -1;
  for (let i = d; i < trimmedSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  
  if (maxpos <= 0 || maxpos >= trimmedSize - 1) return -1;
  
  let T0 = maxpos;
  
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  
  return sampleRate / T0;
}

export function useAudioEngine() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const [tunerData, setTunerData] = useState<TunerData>({ frequency: 0, note: '-', cents: 0, octave: 0 });
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({ cpu: 0, memory: 0, latency: 0 });
  
  const [pedalState, setPedalState] = useState<PedalState>({
    tuner: false,
    compressor: false,
    drive: false,
    chorus: false,
    tremolo: false,
    delay: false,
    wah: false,
    reverb: false,
  });
  
  const [params, setParams] = useState<PedalParams>({
    compressor: { threshold: -20, ratio: 4, attack: 0.003, release: 0.25 },
    drive: { gain: 0.5, tone: 0.5 },
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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const stereoMergerRef = useRef<ChannelMergerNode | null>(null);
  const effectsRef = useRef<Record<string, any>>({});
  const animationFrameRef = useRef<number | null>(null);
  const performanceIntervalRef = useRef<number | null>(null);

  // Check microphone permission status
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
    
    // Get memory usage if available
    if ((performance as any).memory) {
      const memInfo = (performance as any).memory;
      stats.memory = Math.round((memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100);
    }
    
    // Get audio latency
    if (audioContextRef.current) {
      stats.latency = Math.round((audioContextRef.current.baseLatency || 0) * 1000);
    }
    
    // Estimate CPU based on audio processing
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      const now = performance.now();
      const start = now;
      // Simple CPU estimation based on frame timing
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
    
    // Tuner detection
    if (pedalState.tuner) {
      const frequency = autoCorrelate(buffer, audioContextRef.current?.sampleRate || 44100);
      if (frequency > 0) {
        setTunerData(frequencyToNote(frequency));
      }
    }
    
    animationFrameRef.current = requestAnimationFrame(updateInputLevel);
  }, [isConnected, pedalState.tuner]);

  const createAndConnectEffects = useCallback(() => {
    if (!tunaRef.current || !audioContextRef.current || !sourceRef.current || !gainNodeRef.current || !analyserRef.current) {
      console.error('Audio context not ready');
      return;
    }
    
    const tuna = tunaRef.current;
    const ctx = audioContextRef.current;
    
    // Create stereo merger for mono-to-stereo conversion
    stereoMergerRef.current = ctx.createChannelMerger(2);
    
    // Create all effects
    const effects = {
      compressor: new tuna.Compressor({
        threshold: params.compressor.threshold,
        ratio: params.compressor.ratio,
        attack: params.compressor.attack,
        release: params.compressor.release,
        bypass: !pedalState.compressor,
      }),
      overdrive: new tuna.Overdrive({
        outputGain: 0.5,
        drive: params.drive.gain * 0.8 + 0.2,
        curveAmount: params.drive.tone * 0.8,
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
        highCut: 22050,
        lowCut: 20,
        dryLevel: 1 - params.reverb.mix * 0.5,
        wetLevel: params.reverb.mix,
        level: 1,
        bypass: !pedalState.reverb,
      }),
    };
    
    effectsRef.current = effects;
    
    // Connect chain: source -> analyser -> effects -> gain -> stereo merger -> destination
    // This ensures audio comes out of BOTH channels (stereo)
    sourceRef.current.connect(analyserRef.current);
    
    let previousNode: AudioNode = analyserRef.current;
    const order = ['compressor', 'overdrive', 'chorus', 'tremolo', 'delay', 'wahwah', 'convolver'];
    
    for (const effectName of order) {
      const effect = effects[effectName as keyof typeof effects];
      if (effect) {
        previousNode.connect(effect);
        previousNode = effect;
      }
    }
    
    previousNode.connect(gainNodeRef.current);
    
    // Connect to stereo merger - duplicate mono signal to both L and R channels
    gainNodeRef.current.connect(stereoMergerRef.current, 0, 0); // Left channel
    gainNodeRef.current.connect(stereoMergerRef.current, 0, 1); // Right channel
    stereoMergerRef.current.connect(ctx.destination);
    
    console.log('Effects chain connected successfully (stereo output)');
  }, [params, pedalState]);

  // CRITICAL: Direct gesture-to-capture pattern
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check permission first
      const permission = await checkPermission();
      console.log('Microphone permission status:', permission);
      
      if (permission === 'denied') {
        throw new Error('Acesso ao microfone negado. Habilite nas configurações do navegador.');
      }
      
      console.log('Requesting microphone access...');
      
      // CRITICAL: getUserMedia called directly in gesture handler
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 44100,
        },
      });
      
      console.log('Microphone stream obtained:', stream.getAudioTracks());
      streamRef.current = stream;
      
      // Create audio context - must be after getUserMedia for Safari
      const ctx = new AudioContext({ 
        sampleRate: 44100,
        latencyHint: 'interactive' 
      });
      
      // Resume context if suspended (required for some browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      console.log('AudioContext state:', ctx.state, 'Sample rate:', ctx.sampleRate);
      
      audioContextRef.current = ctx;
      tunaRef.current = new Tuna(ctx);
      
      // Create source from stream
      sourceRef.current = ctx.createMediaStreamSource(stream);
      
      // Create gain node for volume control
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.value = params.volume;
      
      // Create analyser for level metering and tuner
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Create and connect effects
      createAndConnectEffects();
      
      setIsConnected(true);
      
      // Start monitoring
      animationFrameRef.current = requestAnimationFrame(updateInputLevel);
      performanceIntervalRef.current = window.setInterval(updatePerformanceStats, 1000);
      
      console.log('Audio engine connected successfully');
      
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
    
    // Stop all tracks in the stream
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
    audioContextRef.current = null;
    tunaRef.current = null;
    effectsRef.current = {};
    
    setIsConnected(false);
    setInputLevel(0);
    setTunerData({ frequency: 0, note: '-', cents: 0, octave: 0 });
    setPerformanceStats({ cpu: 0, memory: 0, latency: 0 });
  }, []);

  const togglePedal = useCallback((pedal: keyof PedalState) => {
    setPedalState(prev => {
      const newState = { ...prev, [pedal]: !prev[pedal] };
      
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
      
      return newState;
    });
  }, []);

  const updateParam = useCallback((
    pedal: keyof Omit<PedalParams, 'volume'>,
    param: string,
    value: number
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
      effects.overdrive.drive = params.drive.gain;
      effects.overdrive.curveAmount = params.drive.tone;
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
  }, [params, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Apply preset - bulk update pedal state and params
  const applyPreset = useCallback((
    newPedalState: Partial<PedalState>,
    newParams: Partial<PedalParams>
  ) => {
    setPedalState(prev => ({ ...prev, ...newPedalState }));
    setParams(prev => {
      const updated = { ...prev };
      if (newParams.compressor) updated.compressor = { ...prev.compressor, ...newParams.compressor };
      if (newParams.drive) updated.drive = { ...prev.drive, ...newParams.drive };
      if (newParams.chorus) updated.chorus = { ...prev.chorus, ...newParams.chorus };
      if (newParams.tremolo) updated.tremolo = { ...prev.tremolo, ...newParams.tremolo };
      if (newParams.delay) updated.delay = { ...prev.delay, ...newParams.delay };
      if (newParams.wah) updated.wah = { ...prev.wah, ...newParams.wah };
      if (newParams.reverb) updated.reverb = { ...prev.reverb, ...newParams.reverb };
      if (newParams.volume !== undefined) updated.volume = newParams.volume;
      return updated;
    });
  }, []);

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
    applyPreset,
  };
}
