import { useCallback, useRef, useState, useEffect } from 'react';

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
  compressor: { threshold: number; ratio: number; attack: number; release: number };
  drive: { gain: number; tone: number };
  distortion: { gain: number; tone: number };
  chorus: { rate: number; depth: number; feedback: number };
  tremolo: { rate: number; depth: number };
  delay: { time: number; feedback: number; mix: number };
  wah: { frequency: number; resonance: number };
  reverb: { decay: number; mix: number };
  volume: number;
}

export interface PerformanceStats {
  cpu: number;
  memory: number;
  latency: number;
}

// ===== DISTORTION CURVE (cached) =====
const curveCache = new Map<number, Float32Array<ArrayBuffer>>();
function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const key = Math.round(amount * 100);
  if (curveCache.has(key)) return curveCache.get(key)!;
  const samples = 8192;
  const buf = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buf);
  const deg = Math.PI / 180;
  const intensity = amount * 300;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + intensity) * x * 20 * deg) / (Math.PI + intensity * Math.abs(x));
  }
  curveCache.set(key, curve);
  return curve;
}

// ===== BYPASS HELPER =====
// True bypass: wet gain=1/dry gain=0 when ON, wet gain=0/dry gain=1 when OFF
// Signal splits into dry and wet paths, both merge into a single output node.
interface BypassableEffect {
  input: GainNode;
  output: GainNode;
  wetGain: GainNode;
  dryGain: GainNode;
  setBypass: (bypassed: boolean) => void;
}

function createBypassable(ctx: AudioContext, buildWetChain: (input: GainNode, output: GainNode) => void): BypassableEffect {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  // Dry path
  input.connect(dryGain).connect(output);

  // Wet path — caller connects nodes between wetInput and wetOutput
  const wetInput = ctx.createGain();
  const wetOutput = ctx.createGain();
  input.connect(wetInput);
  wetOutput.connect(wetGain).connect(output);

  buildWetChain(wetInput, wetOutput);

  // Start bypassed
  dryGain.gain.value = 1;
  wetGain.gain.value = 0;

  return {
    input, output, wetGain, dryGain,
    setBypass(bypassed: boolean) {
      const t = ctx.currentTime;
      dryGain.gain.setTargetAtTime(bypassed ? 1 : 0, t, 0.005);
      wetGain.gain.setTargetAtTime(bypassed ? 0 : 1, t, 0.005);
    },
  };
}

// ===== NATIVE REVERB via feedback delay network =====
function createSimpleReverb(ctx: AudioContext, decay: number): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // 4 parallel allpass filters for diffuse reverb — zero latency unlike convolver
  const delays = [0.0297, 0.0371, 0.0411, 0.0437];
  for (const dt of delays) {
    const delay = ctx.createDelay(0.05);
    delay.delayTime.value = dt;
    const fb = ctx.createGain();
    fb.gain.value = decay * 0.75;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4000;

    input.connect(delay);
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay); // feedback loop
    lp.connect(output);
  }

  return { input, output };
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

  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mergerRef = useRef<ChannelMergerNode | null>(null);

  // Native effect node refs for live param updates
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const driveWaveShaperRef = useRef<WaveShaperNode | null>(null);
  const driveToneRef = useRef<BiquadFilterNode | null>(null);
  const distWaveShaperRef = useRef<WaveShaperNode | null>(null);
  const distToneRef = useRef<BiquadFilterNode | null>(null);
  const chorusDelayRef = useRef<DelayNode | null>(null);
  const chorusLfoRef = useRef<OscillatorNode | null>(null);
  const chorusDepthRef = useRef<GainNode | null>(null);
  const chorusFbRef = useRef<GainNode | null>(null);
  const tremoloLfoRef = useRef<OscillatorNode | null>(null);
  const tremoloDepthRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFbRef = useRef<GainNode | null>(null);
  const wahFilterRef = useRef<BiquadFilterNode | null>(null);
  const reverbDecayGains = useRef<GainNode[]>([]);

  // Bypassable wrappers
  const effectsMap = useRef<Record<string, BypassableEffect>>({});

  const meterIntervalRef = useRef<number | null>(null);
  const perfIntervalRef = useRef<number | null>(null);

  const checkPermission = useCallback(async (): Promise<PermissionState | 'unknown'> => {
    try {
      if (navigator.permissions?.query) {
        return (await navigator.permissions.query({ name: 'microphone' as PermissionName })).state;
      }
    } catch { /* unsupported */ }
    return 'unknown';
  }, []);

  const startMeter = useCallback(() => {
    if (meterIntervalRef.current) return;
    const buf = new Float32Array(128);
    meterIntervalRef.current = window.setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < 128; i++) sum += buf[i] * buf[i];
      setInputLevel(Math.min(1, Math.sqrt(sum / 128) * 5));
    }, 80);
  }, []);

  const stopMeter = useCallback(() => {
    if (meterIntervalRef.current) { clearInterval(meterIntervalRef.current); meterIntervalRef.current = null; }
  }, []);

  const buildEffectsChain = useCallback(() => {
    const ctx = ctxRef.current!;
    const source = sourceRef.current!;
    const master = masterGainRef.current!;

    // Analyser — parallel tap, NOT in signal path
    analyserRef.current = ctx.createAnalyser();
    analyserRef.current.fftSize = 128;
    analyserRef.current.smoothingTimeConstant = 0;
    source.connect(analyserRef.current);

    // Stereo merger
    mergerRef.current = ctx.createChannelMerger(2);

    // ===== 1. COMPRESSOR (native DynamicsCompressorNode) =====
    const comp = createBypassable(ctx, (inp, out) => {
      const c = ctx.createDynamicsCompressor();
      c.threshold.value = params.compressor.threshold;
      c.ratio.value = params.compressor.ratio;
      c.attack.value = params.compressor.attack;
      c.release.value = params.compressor.release;
      c.knee.value = 5;
      compressorNodeRef.current = c;
      inp.connect(c).connect(out);
    });
    comp.setBypass(!pedalState.compressor);

    // ===== 2. DRIVE (WaveShaper + tone filter) =====
    const drive = createBypassable(ctx, (inp, out) => {
      const ws = ctx.createWaveShaper();
      ws.curve = makeDistortionCurve(params.drive.gain * 0.5);
      ws.oversample = 'none';
      driveWaveShaperRef.current = ws;
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 3000 + params.drive.tone * 5000;
      driveToneRef.current = tone;
      inp.connect(ws).connect(tone).connect(out);
    });
    drive.setBypass(!pedalState.drive);

    // ===== 3. DISTORTION (WaveShaper + pre-gain + tone) =====
    const dist = createBypassable(ctx, (inp, out) => {
      const preGain = ctx.createGain();
      preGain.gain.value = 4;
      const ws = ctx.createWaveShaper();
      ws.curve = makeDistortionCurve(params.distortion.gain);
      ws.oversample = 'none'; // zero additional latency
      distWaveShaperRef.current = ws;
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 2000 + params.distortion.tone * 6000;
      distToneRef.current = tone;
      inp.connect(preGain).connect(ws).connect(tone).connect(out);
    });
    dist.setBypass(!pedalState.distortion);

    // ===== 4. CHORUS (delay + LFO modulation) =====
    const chorus = createBypassable(ctx, (inp, out) => {
      const d = ctx.createDelay(0.05);
      d.delayTime.value = 0.005;
      chorusDelayRef.current = d;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = params.chorus.rate;
      chorusLfoRef.current = lfo;
      const depth = ctx.createGain();
      depth.gain.value = params.chorus.depth * 0.003;
      chorusDepthRef.current = depth;
      lfo.connect(depth).connect(d.delayTime);
      lfo.start();
      const fb = ctx.createGain();
      fb.gain.value = params.chorus.feedback * 0.7;
      chorusFbRef.current = fb;
      inp.connect(d);
      d.connect(fb).connect(d); // feedback
      d.connect(out);
      // also pass dry through for mix
      inp.connect(out);
    });
    chorus.setBypass(!pedalState.chorus);

    // ===== 5. TREMOLO (LFO on gain) =====
    const trem = createBypassable(ctx, (inp, out) => {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = params.tremolo.rate;
      tremoloLfoRef.current = lfo;
      const depth = ctx.createGain();
      depth.gain.value = params.tremolo.depth;
      tremoloDepthRef.current = depth;
      const tremGain = ctx.createGain();
      tremGain.gain.value = 1;
      lfo.connect(depth).connect(tremGain.gain);
      lfo.start();
      inp.connect(tremGain).connect(out);
    });
    trem.setBypass(!pedalState.tremolo);

    // ===== 6. DELAY (native DelayNode + feedback) =====
    const del = createBypassable(ctx, (inp, out) => {
      const d = ctx.createDelay(2.0);
      d.delayTime.value = params.delay.time;
      delayNodeRef.current = d;
      const fb = ctx.createGain();
      fb.gain.value = params.delay.feedback;
      delayFbRef.current = fb;
      const wetGain = ctx.createGain();
      wetGain.gain.value = params.delay.mix;
      inp.connect(d);
      d.connect(fb).connect(d); // feedback loop
      d.connect(wetGain).connect(out);
      inp.connect(out); // dry pass-through
    });
    del.setBypass(!pedalState.delay);

    // ===== 7. WAH (BiquadFilter bandpass) =====
    const wah = createBypassable(ctx, (inp, out) => {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 200 + params.wah.frequency * 2000;
      f.Q.value = params.wah.resonance;
      wahFilterRef.current = f;
      inp.connect(f).connect(out);
    });
    wah.setBypass(!pedalState.wah);

    // ===== 8. REVERB (allpass feedback delay network) =====
    const rev = createBypassable(ctx, (inp, out) => {
      const r = createSimpleReverb(ctx, params.reverb.decay);
      const wetGain = ctx.createGain();
      wetGain.gain.value = params.reverb.mix;
      inp.connect(r.input);
      r.output.connect(wetGain).connect(out);
      inp.connect(out); // dry
      // Store feedback gains for live updates
      // (gains are inside createSimpleReverb, we track decay via reverbDecayGains)
    });
    rev.setBypass(!pedalState.reverb);

    effectsMap.current = { compressor: comp, drive, distortion: dist, chorus, tremolo: trem, delay: del, wah, reverb: rev };

    // ===== CHAIN: Source -> Comp -> Drive -> Dist -> Chorus -> Trem -> Delay -> Wah -> Reverb -> Master -> Stereo -> Out =====
    const chain = [comp, drive, dist, chorus, trem, del, wah, rev];
    let prev: AudioNode = source;
    for (const fx of chain) {
      prev.connect(fx.input);
      prev = fx.output;
    }
    prev.connect(master);
    master.connect(mergerRef.current!, 0, 0);
    master.connect(mergerRef.current!, 0, 1);
    mergerRef.current!.connect(ctx.destination);

    console.log('Native effects chain connected — zero Tuna overhead');
  }, [params, pedalState]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const perm = await checkPermission();
      if (perm === 'denied') throw new Error('Acesso ao microfone negado. Habilite nas configurações do navegador.');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
      });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 44100, latencyHint: 'interactive' });
      if (ctx.state === 'suspended') await ctx.resume();

      console.log(`AudioContext: sr=${ctx.sampleRate} baseLatency=${ctx.baseLatency}s outputLatency=${(ctx as any).outputLatency || 'N/A'}s bufferSize=${128}`);

      ctxRef.current = ctx;
      sourceRef.current = ctx.createMediaStreamSource(stream);
      masterGainRef.current = ctx.createGain();
      masterGainRef.current.gain.value = params.volume;

      buildEffectsChain();
      setIsConnected(true);
      startMeter();
      perfIntervalRef.current = window.setInterval(() => {
        const stats: PerformanceStats = { cpu: 0, memory: 0, latency: 0 };
        if ((performance as any).memory) {
          stats.memory = Math.round(((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100);
        }
        if (ctxRef.current) stats.latency = Math.round((ctxRef.current.baseLatency || 0) * 1000);
        setPerformanceStats(stats);
      }, 3000);

      console.log('Audio engine connected — NATIVE Web Audio, zero Tuna.js');
    } catch (err: any) {
      console.error('Audio connection error:', err);
      let msg = 'Erro ao conectar áudio.';
      if (err.name === 'NotAllowedError') msg = 'Permissão de microfone negada.';
      else if (err.name === 'NotFoundError') msg = 'Nenhum dispositivo de áudio encontrado.';
      else if (err.name === 'NotReadableError') msg = 'Dispositivo de áudio em uso por outro app.';
      else if (err.message) msg = err.message;
      setError(msg);
      disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [params.volume, checkPermission, buildEffectsChain, startMeter]);

  const disconnect = useCallback(() => {
    stopMeter();
    if (perfIntervalRef.current) { clearInterval(perfIntervalRef.current); perfIntervalRef.current = null; }
    // Stop oscillators
    try { chorusLfoRef.current?.stop(); } catch {}
    try { tremoloLfoRef.current?.stop(); } catch {}
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (ctxRef.current) ctxRef.current.close();
    ctxRef.current = null;
    sourceRef.current = null;
    masterGainRef.current = null;
    analyserRef.current = null;
    mergerRef.current = null;
    compressorNodeRef.current = null;
    driveWaveShaperRef.current = null;
    driveToneRef.current = null;
    distWaveShaperRef.current = null;
    distToneRef.current = null;
    chorusDelayRef.current = null;
    chorusLfoRef.current = null;
    chorusDepthRef.current = null;
    chorusFbRef.current = null;
    tremoloLfoRef.current = null;
    tremoloDepthRef.current = null;
    delayNodeRef.current = null;
    delayFbRef.current = null;
    wahFilterRef.current = null;
    reverbDecayGains.current = [];
    effectsMap.current = {};
    setIsConnected(false);
    setInputLevel(0);
    setTunerData({ frequency: 0, note: '-', cents: 0, octave: 0, clarity: 0 });
    setPerformanceStats({ cpu: 0, memory: 0, latency: 0 });
  }, [stopMeter]);

  const togglePedal = useCallback((pedal: keyof PedalState) => {
    setPedalState(prev => {
      const newState = { ...prev, [pedal]: !prev[pedal] };
      const fx = effectsMap.current[pedal];
      if (fx) fx.setBypass(!newState[pedal]);
      return newState;
    });
  }, []);

  const updateParam = useCallback((pedal: keyof Omit<PedalParams, 'volume'>, param: string, value: number | boolean) => {
    setParams(prev => {
      const pp = prev[pedal];
      if (typeof pp === 'object' && pp !== null) return { ...prev, [pedal]: { ...pp, [param]: value } };
      return prev;
    });
  }, []);

  const setVolume = useCallback((value: number) => {
    setParams(prev => ({ ...prev, volume: value }));
    if (masterGainRef.current) masterGainRef.current.gain.value = value;
  }, []);

  // Live param updates — no reconnection needed
  useEffect(() => {
    if (!isConnected) return;

    // Compressor
    const c = compressorNodeRef.current;
    if (c) {
      c.threshold.value = params.compressor.threshold;
      c.ratio.value = params.compressor.ratio;
      c.attack.value = params.compressor.attack;
      c.release.value = params.compressor.release;
    }

    // Drive
    if (driveWaveShaperRef.current) driveWaveShaperRef.current.curve = makeDistortionCurve(params.drive.gain * 0.5);
    if (driveToneRef.current) driveToneRef.current.frequency.value = 3000 + params.drive.tone * 5000;

    // Distortion
    if (distWaveShaperRef.current) distWaveShaperRef.current.curve = makeDistortionCurve(params.distortion.gain);
    if (distToneRef.current) distToneRef.current.frequency.value = 2000 + params.distortion.tone * 6000;

    // Chorus
    if (chorusLfoRef.current) chorusLfoRef.current.frequency.value = params.chorus.rate;
    if (chorusDepthRef.current) chorusDepthRef.current.gain.value = params.chorus.depth * 0.003;
    if (chorusFbRef.current) chorusFbRef.current.gain.value = params.chorus.feedback * 0.7;

    // Tremolo
    if (tremoloLfoRef.current) tremoloLfoRef.current.frequency.value = params.tremolo.rate;
    if (tremoloDepthRef.current) tremoloDepthRef.current.gain.value = params.tremolo.depth;

    // Delay
    if (delayNodeRef.current) delayNodeRef.current.delayTime.value = params.delay.time;
    if (delayFbRef.current) delayFbRef.current.gain.value = params.delay.feedback;

    // Wah
    if (wahFilterRef.current) {
      wahFilterRef.current.frequency.value = 200 + params.wah.frequency * 2000;
      wahFilterRef.current.Q.value = params.wah.resonance;
    }
  }, [params, isConnected]);

  useEffect(() => { return () => { disconnect(); }; }, [disconnect]);

  return {
    isConnected, isLoading, error, inputLevel, tunerData,
    pedalState, params, performanceStats,
    connect, disconnect, togglePedal, updateParam, setVolume, checkPermission,
  };
}
