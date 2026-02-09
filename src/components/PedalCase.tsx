import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FootSwitch } from './FootSwitch';

interface PedalCaseProps {
  name: string;
  subtitle?: string;
  color: string;
  glowColor: string;
  isOn: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

export function PedalCase({
  name,
  subtitle,
  color,
  glowColor,
  isOn,
  onToggle,
  children,
  className,
}: PedalCaseProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-xl',
        'border border-metal-highlight/20',
        'transition-all duration-300 w-full max-w-[180px] mx-auto',
        className
      )}
      style={{
        background: 'linear-gradient(180deg, hsl(220 10% 14%) 0%, hsl(220 12% 10%) 50%, hsl(220 14% 7%) 100%)',
        boxShadow: isOn
          ? `0 4px 16px rgba(0,0,0,0.6), 0 0 20px ${glowColor}20`
          : '0 4px 16px rgba(0,0,0,0.6)',
      }}
    >
      {/* LED indicator */}
      <div className="flex items-center justify-center">
        <div
          className="w-3 h-3 rounded-full transition-all duration-200 border border-black/30"
          style={{
            backgroundColor: isOn ? 'hsl(142, 70%, 45%)' : 'hsl(0, 65%, 40%)',
            boxShadow: isOn
              ? '0 0 8px hsl(142, 70%, 45%), 0 0 16px hsl(142, 70%, 45% / 0.4)'
              : '0 0 6px hsl(0, 65%, 40% / 0.5)',
          }}
        />
      </div>
      
      {/* Pedal name */}
      <div className="text-center">
        <h3
          className="font-mono font-bold text-xs tracking-wide leading-tight"
          style={{ color }}
        >
          {name}
        </h3>
        {subtitle && (
          <span className="text-[8px] text-muted-foreground uppercase tracking-widest">
            {subtitle}
          </span>
        )}
      </div>
      
      {/* Controls area */}
      <div className="w-full space-y-1.5 py-1">
        {children}
      </div>
      
      {/* Foot switch */}
      <div className="mt-1">
        <FootSwitch isOn={isOn} onToggle={onToggle} size="lg" />
      </div>
    </div>
  );
}
