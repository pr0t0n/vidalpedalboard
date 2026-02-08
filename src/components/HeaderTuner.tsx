import { TunerData } from '@/hooks/useAudioEngine';

interface HeaderTunerProps {
  isOn: boolean;
  onToggle: () => void;
  tunerData: TunerData;
  isConnected: boolean;
}

export function HeaderTuner({ isOn, onToggle, tunerData, isConnected }: HeaderTunerProps) {
  const getCentsColor = () => {
    if (!isOn || !isConnected || tunerData.note === '-') return 'hsl(var(--muted-foreground))';
    if (Math.abs(tunerData.cents) <= 5) return 'hsl(142, 70%, 45%)'; // Green - in tune
    if (Math.abs(tunerData.cents) <= 15) return 'hsl(45, 100%, 50%)'; // Yellow - close
    return 'hsl(0, 70%, 50%)'; // Red - out of tune
  };

  const centsPosition = ((tunerData.cents + 50) / 100) * 100;

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all hover:bg-muted/50"
      style={{
        background: isOn ? 'hsl(var(--muted))' : 'transparent',
        border: isOn ? '1px solid hsl(var(--pedal-tuner))' : '1px solid hsl(var(--border))',
      }}
    >
      {/* LED */}
      <div
        className="w-2.5 h-2.5 rounded-full transition-all"
        style={{
          backgroundColor: isOn ? 'hsl(var(--pedal-tuner))' : 'hsl(var(--stage-inactive))',
          boxShadow: isOn ? '0 0 8px hsl(var(--pedal-tuner))' : 'none',
        }}
      />

      {/* Label */}
      <span className="text-xs font-mono text-muted-foreground uppercase">TUNER</span>

      {/* Note Display */}
      <div className="flex items-baseline gap-0.5">
        <span
          className="text-2xl font-black font-mono min-w-[2ch] text-center"
          style={{
            color: getCentsColor(),
            textShadow: isOn && isConnected && tunerData.note !== '-' ? `0 0 10px ${getCentsColor()}` : 'none',
          }}
        >
          {isOn && isConnected && tunerData.note !== '-' ? tunerData.note : '--'}
        </span>
        {isOn && isConnected && tunerData.octave > 0 && (
          <span className="text-xs font-mono text-muted-foreground">{tunerData.octave}</span>
        )}
      </div>

      {/* Cents Meter */}
      <div className="w-24 flex flex-col gap-0.5">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          {/* Gradient background */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: 'linear-gradient(90deg, hsl(45, 100%, 50%), hsl(142, 70%, 45%), hsl(0, 70%, 50%))',
            }}
          />
          
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white -translate-x-1/2 z-10" />
          
          {/* Position indicator */}
          {isOn && isConnected && tunerData.note !== '-' && (
            <div
              className="absolute top-0 w-1.5 h-full bg-white rounded-full transition-all duration-75 z-20"
              style={{
                left: `${Math.max(0, Math.min(100, centsPosition))}%`,
                transform: 'translateX(-50%)',
                boxShadow: '0 0 6px white',
              }}
            />
          )}
        </div>
        
        <div className="flex justify-between text-[8px] font-mono text-muted-foreground">
          <span>♭</span>
          <span>{isOn && isConnected && tunerData.frequency > 0 ? `${tunerData.frequency.toFixed(0)}Hz` : '---'}</span>
          <span>♯</span>
        </div>
      </div>
    </button>
  );
}
