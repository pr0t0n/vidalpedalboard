import { PedalCase } from '@/components/PedalCase';
import { TunerData } from '@/hooks/useAudioEngine';

interface TunerPedalProps {
  isOn: boolean;
  onToggle: () => void;
  tunerData: TunerData;
}

export function TunerPedal({ isOn, onToggle, tunerData }: TunerPedalProps) {
  const getCentsColor = () => {
    if (Math.abs(tunerData.cents) <= 5) return 'hsl(120 100% 50%)';
    if (tunerData.cents > 5) return 'hsl(0 100% 50%)';
    return 'hsl(45 100% 50%)';
  };

  const getCentsIndicator = () => {
    const position = ((tunerData.cents + 50) / 100) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <PedalCase
      name="TUNER"
      subtitle="Chromatic"
      color="hsl(var(--pedal-tuner))"
      glowColor="hsl(var(--pedal-tuner-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Note display */}
        <div
          className="relative w-24 h-16 rounded-lg flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, hsl(220 15% 8%) 0%, hsl(220 18% 5%) 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <span
            className="font-display text-3xl font-black"
            style={{
              color: isOn ? getCentsColor() : 'hsl(220 10% 30%)',
              textShadow: isOn ? `0 0 10px ${getCentsColor()}` : 'none',
            }}
          >
            {isOn ? tunerData.note : '-'}
          </span>
          {isOn && tunerData.octave > 0 && (
            <span className="text-xs text-muted-foreground">{tunerData.octave}</span>
          )}
        </div>

        {/* Cents meter */}
        <div className="w-full px-2">
          <div
            className="relative h-2 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, hsl(45 100% 50%) 0%, hsl(120 100% 50%) 50%, hsl(0 100% 50%) 100%)',
              opacity: isOn ? 1 : 0.3,
            }}
          >
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/80 -translate-x-1/2" />
            
            {/* Current position indicator */}
            {isOn && (
              <div
                className="absolute top-0 w-1 h-full bg-white transition-all duration-75"
                style={{
                  left: `${getCentsIndicator()}%`,
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 8px white',
                }}
              />
            )}
          </div>
          
          <div className="flex justify-between mt-1 text-[8px] text-muted-foreground">
            <span>♭</span>
            <span>●</span>
            <span>♯</span>
          </div>
        </div>

        {/* Frequency display */}
        <div className="text-xs text-muted-foreground font-mono">
          {isOn && tunerData.frequency > 0
            ? `${tunerData.frequency.toFixed(1)} Hz`
            : '--- Hz'}
        </div>
      </div>
    </PedalCase>
  );
}
