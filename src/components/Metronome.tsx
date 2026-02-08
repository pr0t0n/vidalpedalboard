import { useState, useEffect, useRef, useCallback } from 'react';
import { Knob } from '@/components/Knob';
import { LED } from '@/components/LED';

interface MetronomeProps {
  initialBpm?: number;
}

export function Metronome({ initialBpm = 120 }: MetronomeProps) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const playClick = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = beat % 4 === 0 ? 1000 : 800;
    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);

    setBeat((b) => (b + 1) % 4);
  }, [beat]);

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;
      playClick();
      intervalRef.current = window.setInterval(playClick, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, playClick]);

  return (
    <div
      className="flex flex-col items-center gap-4 p-5 rounded-xl border border-metal-highlight/20"
      style={{
        background: 'linear-gradient(180deg, hsl(220 10% 14%) 0%, hsl(220 12% 10%) 50%, hsl(220 14% 7%) 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Title */}
      <h3 className="font-display font-bold text-sm text-primary tracking-wide">
        METRONOME
      </h3>

      {/* Beat indicators */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <LED
            key={i}
            isOn={isPlaying && beat === i}
            color={i === 0 ? 'red' : 'green'}
            size="md"
          />
        ))}
      </div>

      {/* BPM display */}
      <div
        className="w-24 h-12 rounded-lg flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, hsl(220 15% 8%) 0%, hsl(220 18% 5%) 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <span className="font-display text-2xl font-black text-primary">
          {bpm}
        </span>
        <span className="text-xs text-muted-foreground ml-1">BPM</span>
      </div>

      {/* BPM knob */}
      <Knob
        value={bpm}
        min={40}
        max={240}
        onChange={setBpm}
        label="Tempo"
        size="md"
      />

      {/* Play/Stop button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-full py-2 px-4 rounded-lg font-display font-bold text-sm transition-all"
        style={{
          background: isPlaying
            ? 'linear-gradient(180deg, hsl(0 70% 45%) 0%, hsl(0 75% 35%) 100%)'
            : 'linear-gradient(180deg, hsl(120 60% 40%) 0%, hsl(120 65% 30%) 100%)',
          boxShadow: isPlaying
            ? '0 4px 12px rgba(200,50,50,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 4px 12px rgba(50,150,50,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          color: 'white',
        }}
      >
        {isPlaying ? 'STOP' : 'START'}
      </button>
    </div>
  );
}
