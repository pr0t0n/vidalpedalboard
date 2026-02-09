import { Minus, Plus } from 'lucide-react';

interface ParamSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
  step?: number;
}

export function ParamSlider({ value, min, max, onChange, label, color, step }: ParamSliderProps) {
  const normalizedPercent = Math.round(((value - min) / (max - min)) * 100);
  const stepVal = step || (max - min) / 20;

  const decrement = () => onChange(Math.max(min, value - stepVal));
  const increment = () => onChange(Math.min(max, value + stepVal));

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-mono text-muted-foreground">{normalizedPercent}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={decrement}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/80 active:scale-90 transition-transform touch-manipulation"
          style={{ border: `1px solid ${color || 'hsl(var(--border))'}` }}
        >
          <Minus className="w-3.5 h-3.5 text-foreground" />
        </button>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${normalizedPercent}%`,
              background: color || 'hsl(var(--primary))',
            }}
          />
        </div>
        <button
          onClick={increment}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/80 active:scale-90 transition-transform touch-manipulation"
          style={{ border: `1px solid ${color || 'hsl(var(--border))'}` }}
        >
          <Plus className="w-3.5 h-3.5 text-foreground" />
        </button>
      </div>
    </div>
  );
}
