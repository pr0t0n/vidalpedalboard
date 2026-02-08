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
  
  const c = new Array(trimmedSize).fill(0);
  for (let i = 0; i < trimmedSize; i++) {
    for (let j = 0; j < trimmedSize - i; j++) {
      c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
    }
  }
  
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  
  let maxval = -1, maxpos = -1;
  for (let i = d; i < trimmedSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  
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
  const [tunerData, setTunerData] = useState<TunerData>({ frequency: 0, note: '-', cents: 0, octave: 0 });
  
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
  const tunaRef = useRef<any>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const effectsRef = useRef<Record<string, any>>({});
  const animationFrameRef = useRef<number | null>(null);

  const createEffects = useCallback(() => {
    if (!tunaRef.current || !audioContextRef.current) return;
    
    const tuna = tunaRef.current;
    
    effectsRef.current = {
      compressor: new tuna.Compressor({
        threshold: params.compressor.threshold,
        ratio: params.compressor.ratio,
        attack: params.compressor.attack,
        release: params.compressor.release,
        bypass: !pedalState.compressor,
      }),
      overdrive: new tuna.Overdrive({
        outputGain: params.drive.gain * 0.5 - 0.25,
        drive: params.drive.gain,
        curveAmount: params.drive.tone,
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
  }, [params, pedalState]);

  const connectEffectsChain = useCallback(() => {
    if (!sourceRef.current || !gainNodeRef.current || !audioContextRef.current) return;
    
    const effects = effectsRef.current;
    const order = ['compressor', 'overdrive', 'chorus', 'tremolo', 'delay', 'wahwah', 'convolver'];
    
    let previousNode: AudioNode = sourceRef.current;
    
    if (analyserRef.current) {
      previousNode.connect(analyserRef.current);
    }
    
    for (const effectName of order) {
      const effect = effects[effectName];
      if (effect) {
        previousNode.connect(effect);
        previousNode = effect;
      }
    }
    
    previousNode.connect(gainNodeRef.current);
    gainNodeRef.current.connect(audioContextRef.current.destination);
  }, []);

  const updateTuner = useCallback(() => {
    if (!analyserRef.current || !pedalState.tuner) {
      animationFrameRef.current = requestAnimationFrame(updateTuner);
      return;
    }
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextRef.current?.sampleRate || 44100);
    
    if (frequency > 0) {
      setTunerData(frequencyToNote(frequency));
    }
    
    animationFrameRef.current = requestAnimationFrame(updateTuner);
  }, [pedalState.tuner]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as MediaTrackConstraints,
      });
      
      audioContextRef.current = new AudioContext({ latencyHint: 'interactive' });
      tunaRef.current = new Tuna(audioContextRef.current);
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = params.volume;
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      createEffects();
      connectEffectsChain();
      
      setIsConnected(true);
      animationFrameRef.current = requestAnimationFrame(updateTuner);
    } catch (err) {
      setError('Não foi possível acessar o microfone. Verifique as permissões.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [createEffects, connectEffectsChain, updateTuner, params.volume]);

  const disconnect = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    sourceRef.current = null;
    gainNodeRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;
    tunaRef.current = null;
    effectsRef.current = {};
    
    setIsConnected(false);
    setTunerData({ frequency: 0, note: '-', cents: 0, octave: 0 });
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

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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

  return {
    isConnected,
    isLoading,
    error,
    tunerData,
    pedalState,
    params,
    connect,
    disconnect,
    togglePedal,
    updateParam,
    setVolume,
  };
}
