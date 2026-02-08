import { Minus, Plus } from 'lucide-react';

interface ParamControlProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export function ParamControl({
  value,
  min,
  max,
  step,
  onChange,
  label,
  color,
  size = 'md',
  showPercentage = true,
}: ParamControlProps) {
  const computedStep = step ?? (max - min) / 20;
  const percentage = Math.round(((value - min) / (max - min)) * 100);
  
  const sizes = {
    sm: { button: 'w-8 h-8', text: 'text-sm', label: 'text-xs' },
    md: { button: 'w-10 h-10', text: 'text-lg', label: 'text-sm' },
    lg: { button: 'w-12 h-12', text: 'text-xl', label: 'text-base' },
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - computedStep);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + computedStep);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`font-mono text-muted-foreground uppercase ${sizes[size].label}`}>
        {label}
      </span>
      
      <div className="flex items-center gap-2">
        {/* Minus Button */}
        <button
          onClick={handleDecrement}
          className={`${sizes[size].button} rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-all active:scale-90`}
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <Minus className="w-4 h-4 text-foreground" />
        </button>

        {/* Value Display */}
        <div
          className={`${sizes[size].button} rounded-lg flex items-center justify-center font-mono font-bold ${sizes[size].text}`}
          style={{
            backgroundColor: `${color}20`,
            color: color,
            minWidth: size === 'lg' ? '60px' : size === 'md' ? '50px' : '40px',
          }}
        >
          {showPercentage ? `${percentage}%` : value.toFixed(1)}
        </div>

        {/* Plus Button */}
        <button
          onClick={handleIncrement}
          className={`${sizes[size].button} rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-all active:scale-90`}
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <Plus className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
