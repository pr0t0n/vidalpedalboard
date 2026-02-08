import { useState } from 'react';

interface PedalParam {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

interface StagePedalProps {
  name: string;
  color: string;
  isOn: boolean;
  onToggle: () => void;
  params: PedalParam[];
}

export function StagePedal({ name, color, isOn, onToggle, params }: StagePedalProps) {
  const [showParams, setShowParams] = useState(false);

  return (
    <div className="relative">
      {/* Main Pedal Button */}
      <button
        onClick={onToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowParams(!showParams);
        }}
        className="w-full h-full pedal-surface rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.97] min-h-[120px]"
        style={{
          borderWidth: '3px',
          borderStyle: 'solid',
          borderColor: isOn ? color : 'hsl(var(--border))',
          boxShadow: isOn ? `0 0 30px ${color}40, inset 0 0 20px ${color}10` : undefined,
        }}
      >
        {/* LED Indicator - Green when ON, Red when OFF */}
        <div
          className="w-4 h-4 rounded-full"
          style={{
            backgroundColor: isOn ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 40%)',
            boxShadow: isOn 
              ? '0 0 15px hsl(142, 70%, 45%), 0 0 30px hsl(142, 70%, 45% / 0.5)' 
              : '0 0 8px hsl(0, 70%, 40% / 0.5)',
          }}
        />

        {/* Pedal Name */}
        <span
          className="text-2xl font-bold font-mono tracking-wider"
          style={{ color: isOn ? color : 'hsl(var(--muted-foreground))' }}
        >
          {name}
        </span>

        {/* Quick Params Preview */}
        <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
          {params.slice(0, 2).map((p) => (
            <span key={p.label}>
              {p.label}: {Math.round(((p.value - p.min) / (p.max - p.min)) * 100)}%
            </span>
          ))}
        </div>

        {/* Tap hint */}
        <span className="text-[9px] text-muted-foreground/50 absolute bottom-2">
          SEGURAR PARA AJUSTAR
        </span>
      </button>

      {/* Parameter Overlay */}
      {showParams && (
        <div
          className="absolute inset-0 bg-background/95 backdrop-blur rounded-xl p-4 flex flex-col gap-3 z-10"
          onClick={() => setShowParams(false)}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold" style={{ color }}>{name}</span>
            <button
              onClick={() => setShowParams(false)}
              className="text-muted-foreground text-xl"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            {params.map((param) => (
              <div key={param.label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">{param.label}</span>
                  <span className="text-foreground">
                    {Math.round(((param.value - param.min) / (param.max - param.min)) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={(param.max - param.min) / 100}
                  value={param.value}
                  onChange={(e) => param.onChange(parseFloat(e.target.value))}
                  className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${((param.value - param.min) / (param.max - param.min)) * 100}%, hsl(var(--muted)) ${((param.value - param.min) / (param.max - param.min)) * 100}%, hsl(var(--muted)) 100%)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
