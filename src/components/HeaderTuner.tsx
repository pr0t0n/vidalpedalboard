import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { TunerData } from '@/hooks/useAudioEngine';

interface HeaderTunerProps {
  isOn: boolean;
  onToggle: () => void;
  tunerData: TunerData;
  isConnected: boolean;
}

type GuitarString = {
  id: 'E2' | 'A2' | 'D3' | 'G3' | 'B3' | 'E4';
  freq: number;
  pt: string;
};

const STANDARD_GUITAR_STRINGS: GuitarString[] = [
  { id: 'E2', freq: 82.41, pt: 'MI' },
  { id: 'A2', freq: 110.0, pt: 'LÁ' },
  { id: 'D3', freq: 146.83, pt: 'RÉ' },
  { id: 'G3', freq: 196.0, pt: 'SOL' },
  { id: 'B3', freq: 246.94, pt: 'SI' },
  { id: 'E4', freq: 329.63, pt: 'MI' },
];

function centsDiff(freq: number, target: number) {
  return 1200 * Math.log2(freq / target);
}

function getClosestString(freq: number): { string: GuitarString; deltaCents: number } {
  let best = STANDARD_GUITAR_STRINGS[0];
  let bestAbs = Infinity;
  let bestDelta = 0;

  for (const s of STANDARD_GUITAR_STRINGS) {
    const d = centsDiff(freq, s.freq);
    const abs = Math.abs(d);
    if (abs < bestAbs) {
      bestAbs = abs;
      best = s;
      bestDelta = d;
    }
  }

  return { string: best, deltaCents: bestDelta };
}

export function HeaderTuner({ isOn, onToggle, tunerData, isConnected }: HeaderTunerProps) {
  const isActive = isOn && isConnected;
  const hasPitch = isActive && tunerData.frequency > 0 && tunerData.note !== '-' && tunerData.clarity > 0.15;

  const closest = hasPitch ? getClosestString(tunerData.frequency) : null;
  const targetDelta = closest ? closest.deltaCents : 0;

  const direction = !closest
    ? 'none'
    : Math.abs(targetDelta) <= 5
      ? 'ok'
      : targetDelta < 0
        ? 'tighten'
        : 'loosen';

  const statusColor = !isActive
    ? 'hsl(var(--muted-foreground))'
    : direction === 'ok'
      ? 'hsl(var(--stage-active))'
      : 'hsl(var(--stage-danger))';

  const centsPosition = ((tunerData.cents + 50) / 100) * 100;

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 px-4 py-2 rounded-xl transition-all hover:bg-muted/50"
      style={{
        background: isOn ? 'hsl(var(--muted))' : 'transparent',
        border: isOn ? '1px solid hsl(var(--border))' : '1px solid hsl(var(--border))',
      }}
      title={!isActive ? 'Ativar tuner' : undefined}
    >
      {/* LED (verde ligado / vermelho desligado) */}
      <div
        className="w-2.5 h-2.5 rounded-full transition-all"
        style={{
          backgroundColor: isOn ? 'hsl(var(--stage-active))' : 'hsl(var(--stage-danger))',
          boxShadow: isOn ? '0 0 8px hsl(var(--stage-active))' : '0 0 6px hsl(var(--stage-danger) / 0.6)',
        }}
      />

      {/* Label */}
      <span className="text-xs font-mono text-muted-foreground uppercase">TUNER</span>

      {/* Note Display */}
      <div className="flex items-baseline gap-0.5">
        <span
          className="text-2xl font-black font-mono min-w-[2ch] text-center"
          style={{
            color: hasPitch ? statusColor : 'hsl(var(--muted-foreground))',
            textShadow: hasPitch ? `0 0 10px ${statusColor}` : 'none',
          }}
        >
          {hasPitch ? tunerData.note : '--'}
        </span>
        {hasPitch && tunerData.octave > 0 && (
          <span className="text-xs font-mono text-muted-foreground">{tunerData.octave}</span>
        )}
      </div>

      {/* Cents Meter */}
      <div className="w-24 flex flex-col gap-0.5">
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'linear-gradient(90deg, hsl(var(--stage-danger)), hsl(var(--stage-warning)), hsl(var(--stage-active)), hsl(var(--stage-warning)), hsl(var(--stage-danger)))',
            }}
          />

          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white -translate-x-1/2 z-10" />

          {hasPitch && (
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
          <span>{hasPitch ? `${tunerData.frequency.toFixed(1)}Hz` : '---'}</span>
          <span>♯</span>
        </div>
      </div>

      {/* String + Direction */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col leading-none">
          <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-wider">CORDA</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: hasPitch ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
            {closest ? `${closest.string.id} (${closest.string.pt})` : '--'}
          </span>
        </div>

        <div className="flex flex-col items-center leading-none min-w-[60px]">
          {direction === 'ok' ? (
            <div className="flex items-center gap-1" style={{ color: 'hsl(var(--stage-active))' }}>
              <Check className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold">OK</span>
            </div>
          ) : direction === 'tighten' ? (
            <div className="flex items-center gap-1" style={{ color: 'hsl(var(--stage-active))' }}>
              <ArrowUp className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold">APERTE</span>
            </div>
          ) : direction === 'loosen' ? (
            <div className="flex items-center gap-1" style={{ color: 'hsl(var(--stage-danger))' }}>
              <ArrowDown className="w-4 h-4" />
              <span className="text-[10px] font-mono font-bold">AFROUXE</span>
            </div>
          ) : (
            <span className="text-[9px] font-mono text-muted-foreground">TOQUE A CORDA</span>
          )}
        </div>
      </div>
    </button>
  );
}
