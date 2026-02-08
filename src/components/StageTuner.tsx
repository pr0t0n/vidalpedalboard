import { TunerData } from '@/hooks/useAudioEngine';

interface StageTunerProps {
  isOn: boolean;
  onToggle: () => void;
  tunerData: TunerData;
  isConnected: boolean;
}

export function StageTuner({ isOn, onToggle, tunerData, isConnected }: StageTunerProps) {
  const getCentsColor = () => {
    if (!isOn || !isConnected) return 'hsl(var(--muted-foreground))';
    if (Math.abs(tunerData.cents) <= 5) return 'hsl(var(--stage-active))';
    if (tunerData.cents > 5) return 'hsl(var(--stage-danger))';
    return 'hsl(var(--stage-warning))';
  };

  const centsPosition = ((tunerData.cents + 50) / 100) * 100;

  return (
    <button
      onClick={onToggle}
      className="pedal-surface rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98]"
      style={{
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: isOn ? 'hsl(var(--pedal-tuner))' : 'hsl(var(--border))',
        boxShadow: isOn ? '0 0 20px hsl(var(--pedal-tuner) / 0.3)' : undefined,
      }}
    >
      {/* LED */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isOn ? 'hsl(var(--pedal-tuner))' : 'hsl(var(--stage-inactive))',
            boxShadow: isOn ? '0 0 10px hsl(var(--pedal-tuner))' : undefined,
          }}
        />
        <span className="text-xs font-mono text-muted-foreground uppercase">TUNER</span>
      </div>

      {/* Note Display */}
      <div className="flex items-baseline gap-1">
        <span
          className="text-5xl font-bold font-mono"
          style={{
            color: getCentsColor(),
            textShadow: isOn && isConnected ? `0 0 20px ${getCentsColor()}` : undefined,
          }}
        >
          {isOn && isConnected && tunerData.note !== '-' ? tunerData.note : '--'}
        </span>
        {isOn && isConnected && tunerData.octave > 0 && (
          <span className="text-xl font-mono text-muted-foreground">{tunerData.octave}</span>
        )}
      </div>

      {/* Cents Meter */}
      <div className="w-full max-w-[200px]">
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          {/* Gradient background */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--stage-warning)), hsl(var(--stage-active)), hsl(var(--stage-danger)))',
            }}
          />
          
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white -translate-x-1/2 z-10" />
          
          {/* Indicator */}
          {isOn && isConnected && tunerData.note !== '-' && (
            <div
              className="absolute top-0 w-2 h-full bg-white rounded-full transition-all duration-100 z-20"
              style={{
                left: `${Math.max(0, Math.min(100, centsPosition))}%`,
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px white',
              }}
            />
          )}
        </div>

        <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
          <span>♭</span>
          <span>{isOn && isConnected ? `${tunerData.frequency.toFixed(0)} Hz` : '--- Hz'}</span>
          <span>♯</span>
        </div>
      </div>
    </button>
  );
}
