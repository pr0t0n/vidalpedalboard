import { Knob } from '@/components/Knob';
import { LED } from '@/components/LED';

interface VolumeMasterProps {
  volume: number;
  onChange?: (value: number) => void;
  onVolumeChange?: (value: number) => void;
  level?: number;
  isConnected?: boolean;
}

export function VolumeMaster({ volume, onChange, onVolumeChange, level = 0, isConnected = true }: VolumeMasterProps) {
  const handleChange = (value: number) => {
    onChange?.(value);
    onVolumeChange?.(value);
  };
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
        MASTER
      </h3>

      {/* Signal indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase">Signal</span>
        <LED isOn={isConnected} color="green" size="md" />
      </div>

      {/* Volume display */}
      <div
        className="w-20 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, hsl(220 15% 8%) 0%, hsl(220 18% 5%) 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <span className="font-display text-xl font-black text-foreground">
          {Math.round(volume * 100)}
        </span>
        <span className="text-xs text-muted-foreground ml-0.5">%</span>
      </div>

      {/* Volume meter */}
      <div className="w-3 h-24 rounded-full overflow-hidden relative"
        style={{
          background: 'linear-gradient(180deg, hsl(220 15% 8%) 0%, hsl(220 18% 5%) 100%)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-100 rounded-full"
          style={{
            height: `${volume * 100}%`,
            background: volume > 0.8
              ? 'linear-gradient(180deg, hsl(0 100% 50%) 0%, hsl(45 100% 50%) 50%, hsl(120 100% 45%) 100%)'
              : 'linear-gradient(180deg, hsl(45 100% 50%) 0%, hsl(120 100% 45%) 100%)',
            boxShadow: `0 0 10px ${volume > 0.8 ? 'hsl(0 100% 50%)' : 'hsl(120 100% 45%)'}`,
          }}
        />
      </div>

      {/* Volume knob */}
      <Knob
        value={volume}
        min={0}
        max={1}
        onChange={handleChange}
        label="Volume"
        size="lg"
      />
    </div>
  );
}
