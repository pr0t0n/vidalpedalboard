import { useState, useEffect, useRef, useCallback } from 'react';

export function StageMetronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const scheduleNote = useCallback((time: number, isAccent: boolean) => {
    if (!audioContextRef.current) return;
    
    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();
    
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);
    
    osc.frequency.value = isAccent ? 1000 : 800;
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const scheduleAheadTime = 0.1;
    const currentTime = audioContextRef.current.currentTime;
    
    while (nextNoteTimeRef.current < currentTime + scheduleAheadTime) {
      scheduleNote(nextNoteTimeRef.current, beatRef.current % 4 === 0);
      
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      
      beatRef.current = (beatRef.current + 1) % 4;
      setBeat(beatRef.current);
    }
    
    timerIdRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, scheduleNote]);

  const start = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    beatRef.current = 0;
    setBeat(0);
    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    
    setIsPlaying(true);
    scheduler();
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsPlaying(false);
    setBeat(0);
    beatRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (timerIdRef.current) {
        clearTimeout(timerIdRef.current);
      }
    };
  }, []);

  const handleBpmChange = (delta: number) => {
    setBpm(prev => Math.max(40, Math.min(240, prev + delta)));
  };

  return (
    <div className="pedal-surface rounded-xl p-4 flex flex-col items-center justify-center gap-3">
      {/* LED */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isPlaying ? 'hsl(var(--stage-warning))' : 'hsl(var(--stage-inactive))',
            boxShadow: isPlaying ? '0 0 10px hsl(var(--stage-warning))' : undefined,
          }}
        />
        <span className="text-xs font-mono text-muted-foreground uppercase">METRONOME</span>
      </div>

      {/* Beat Indicators */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full transition-all"
            style={{
              backgroundColor: isPlaying && beat === i
                ? i === 0 ? 'hsl(var(--stage-danger))' : 'hsl(var(--stage-active))'
                : 'hsl(var(--stage-inactive))',
              boxShadow: isPlaying && beat === i
                ? `0 0 10px ${i === 0 ? 'hsl(var(--stage-danger))' : 'hsl(var(--stage-active))'}`
                : undefined,
            }}
          />
        ))}
      </div>

      {/* BPM Display */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleBpmChange(-5)}
          className="w-10 h-10 rounded-lg bg-muted text-foreground font-bold text-xl active:scale-95"
        >
          −
        </button>
        <div className="w-20 text-center">
          <span className="text-3xl font-bold font-mono text-foreground">{bpm}</span>
          <span className="text-xs font-mono text-muted-foreground block">BPM</span>
        </div>
        <button
          onClick={() => handleBpmChange(5)}
          className="w-10 h-10 rounded-lg bg-muted text-foreground font-bold text-xl active:scale-95"
        >
          +
        </button>
      </div>

      {/* Play/Stop Button */}
      <button
        onClick={isPlaying ? stop : start}
        className="stage-button w-full py-3 text-lg font-bold"
        style={{
          background: isPlaying
            ? 'linear-gradient(180deg, hsl(0 60% 45%) 0%, hsl(0 65% 35%) 100%)'
            : 'linear-gradient(180deg, hsl(142 60% 40%) 0%, hsl(142 65% 30%) 100%)',
          color: 'white',
        }}
      >
        {isPlaying ? 'STOP' : 'START'}
      </button>
    </div>
  );
}
