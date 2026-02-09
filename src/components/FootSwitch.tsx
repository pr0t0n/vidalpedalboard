import { cn } from '@/lib/utils';

interface FootSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function FootSwitch({ isOn, onToggle, size = 'md' }: FootSwitchProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };
  
  return (
    <button
      onClick={onToggle}
      className={cn(
        sizeClasses[size],
        'relative rounded-full transition-all duration-100',
        'border-2 border-metal-highlight/40',
        'active:scale-95 touch-manipulation',
        'focus:outline-none focus:ring-2 focus:ring-primary/30'
      )}
      style={{
        background: isOn
          ? 'linear-gradient(180deg, hsl(220 8% 22%) 0%, hsl(220 10% 16%) 50%, hsl(220 12% 12%) 100%)'
          : 'linear-gradient(180deg, hsl(220 8% 18%) 0%, hsl(220 10% 12%) 50%, hsl(220 12% 8%) 100%)',
        boxShadow: isOn
          ? 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        transform: isOn ? 'translateY(2px)' : 'translateY(0)',
      }}
    >
      <div
        className="absolute inset-1 rounded-full"
        style={{
          background: 'linear-gradient(145deg, hsl(220 5% 35%) 0%, hsl(220 8% 20%) 100%)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background: 'linear-gradient(145deg, hsl(220 6% 25%) 0%, hsl(220 8% 15%) 100%)',
        }}
      />
      <div
        className="absolute inset-[35%] rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, hsl(220 5% 30%) 0%, hsl(220 8% 18%) 100%)',
        }}
      />
    </button>
  );
}
