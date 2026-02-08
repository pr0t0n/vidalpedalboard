import { cn } from '@/lib/utils';

interface LEDProps {
  isOn: boolean;
  color?: 'green' | 'red' | 'yellow' | 'custom';
  customColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LED({ isOn, color = 'green', customColor, size = 'md' }: LEDProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  const getColor = () => {
    if (customColor) return customColor;
    switch (color) {
      case 'green':
        return isOn ? 'hsl(120 100% 50%)' : 'hsl(120 30% 20%)';
      case 'red':
        return isOn ? 'hsl(0 100% 50%)' : 'hsl(0 30% 20%)';
      case 'yellow':
        return isOn ? 'hsl(45 100% 50%)' : 'hsl(45 30% 20%)';
      default:
        return isOn ? 'hsl(120 100% 50%)' : 'hsl(120 30% 20%)';
    }
  };
  
  const ledColor = getColor();
  
  return (
    <div
      className={cn(
        sizeClasses[size],
        'rounded-full transition-all duration-200',
        'border border-black/30'
      )}
      style={{
        backgroundColor: ledColor,
        boxShadow: isOn
          ? `0 0 8px ${ledColor}, 0 0 16px ${ledColor}, 0 0 24px ${ledColor}40`
          : 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}
    />
  );
}
