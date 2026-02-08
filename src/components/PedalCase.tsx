import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LED } from './LED';
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
        'relative flex flex-col items-center gap-3 p-4 rounded-xl',
        'border border-metal-highlight/20',
        'transition-all duration-300',
        className
      )}
      style={{
        background: 'linear-gradient(180deg, hsl(220 10% 14%) 0%, hsl(220 12% 10%) 50%, hsl(220 14% 7%) 100%)',
        boxShadow: isOn
          ? `0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px ${glowColor}20`
          : '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        minWidth: '140px',
      }}
    >
      {/* Top screws */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-metal-highlight/30 border border-metal-dark" />
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-metal-highlight/30 border border-metal-dark" />
      
      {/* LED indicator - Green when ON, Red when OFF */}
      <div className="flex items-center justify-center">
        <div
          className="w-3 h-3 rounded-full transition-all duration-200 border border-black/30"
          style={{
            backgroundColor: isOn ? 'hsl(142, 70%, 45%)' : 'hsl(0, 65%, 40%)',
            boxShadow: isOn
              ? '0 0 8px hsl(142, 70%, 45%), 0 0 16px hsl(142, 70%, 45%), 0 0 24px hsl(142, 70%, 45% / 0.4)'
              : '0 0 6px hsl(0, 65%, 40% / 0.5), inset 0 1px 2px rgba(0,0,0,0.5)',
          }}
        />
      </div>
      
      {/* Pedal name */}
      <div className="text-center">
        <h3
          className="font-display font-bold text-sm tracking-wide"
          style={{ color }}
        >
          {name}
        </h3>
        {subtitle && (
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
            {subtitle}
          </span>
        )}
      </div>
      
      {/* Controls area */}
      <div className="flex flex-wrap items-center justify-center gap-3 py-2">
        {children}
      </div>
      
      {/* Foot switch */}
      <div className="mt-2">
        <FootSwitch isOn={isOn} onToggle={onToggle} size="md" />
      </div>
      
      {/* Bottom screws */}
      <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-metal-highlight/30 border border-metal-dark" />
      <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-metal-highlight/30 border border-metal-dark" />
      
      {/* Decorative lines */}
      <div
        className="absolute left-0 top-1/4 w-1 h-1/2 rounded-r"
        style={{ backgroundColor: `${color}30` }}
      />
      <div
        className="absolute right-0 top-1/4 w-1 h-1/2 rounded-l"
        style={{ backgroundColor: `${color}30` }}
      />
    </div>
  );
}
