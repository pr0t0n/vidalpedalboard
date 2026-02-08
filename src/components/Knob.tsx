import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Knob({ value, min, max, onChange, label, size = 'md', color }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  
  const normalizedValue = (value - min) / (max - min);
  const rotation = -135 + normalizedValue * 270;
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-18 h-18',
  };
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 150;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + deltaY * sensitivity));
      onChange(newValue);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [value, min, max, onChange]);
  
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          sizeClasses[size],
          'relative cursor-pointer rounded-full knob-texture',
          'border-2 border-metal-highlight/30',
          isDragging && 'ring-2 ring-primary/50'
        )}
        onMouseDown={handleMouseDown}
        style={{
          background: 'linear-gradient(145deg, hsl(220 6% 28%) 0%, hsl(220 8% 16%) 50%, hsl(220 10% 10%) 100%)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.08)',
        }}
      >
        {/* Knob markings */}
        <div className="absolute inset-1 rounded-full overflow-hidden">
          {[...Array(11)].map((_, i) => {
            const angle = -135 + i * 27;
            return (
              <div
                key={i}
                className="absolute w-0.5 h-1 bg-metal-highlight/40"
                style={{
                  left: '50%',
                  top: '2px',
                  transformOrigin: '50% calc(50% + 50%)',
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                }}
              />
            );
          })}
        </div>
        
        {/* Knob indicator */}
        <div
          className="absolute inset-2 rounded-full flex items-start justify-center"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="w-1 h-3 rounded-full"
            style={{
              background: color || 'hsl(var(--primary))',
              boxShadow: `0 0 8px ${color || 'hsl(var(--primary))'}`,
            }}
          />
        </div>
        
        {/* Center cap */}
        <div
          className="absolute inset-[30%] rounded-full"
          style={{
            background: 'linear-gradient(145deg, hsl(220 6% 22%) 0%, hsl(220 8% 12%) 100%)',
          }}
        />
      </div>
      
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
