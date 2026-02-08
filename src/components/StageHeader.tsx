import { Mic, MicOff, Volume2, Cpu, HardDrive, Clock } from 'lucide-react';
import { PerformanceStats } from '@/hooks/useAudioEngine';

interface StageHeaderProps {
  isConnected: boolean;
  isLoading: boolean;
  inputLevel: number;
  volume: number;
  performanceStats: PerformanceStats;
  onConnect: () => void;
  onDisconnect: () => void;
  onVolumeChange: (value: number) => void;
}

export function StageHeader({
  isConnected,
  isLoading,
  inputLevel,
  volume,
  performanceStats,
  onConnect,
  onDisconnect,
  onVolumeChange,
}: StageHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Connect Button */}
        <button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={isLoading}
          className="stage-button flex items-center gap-3 px-6 py-4"
          style={{
            background: isConnected
              ? 'linear-gradient(180deg, hsl(0 60% 45%) 0%, hsl(0 65% 35%) 100%)'
              : 'linear-gradient(180deg, hsl(142 60% 40%) 0%, hsl(142 65% 30%) 100%)',
          }}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isConnected ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          <span className="text-white font-semibold text-lg">
            {isLoading ? 'CONECTANDO...' : isConnected ? 'DESCONECTAR' : 'CONECTAR'}
          </span>
        </button>

        {/* Center: Input Level Meter */}
        <div className="flex-1 flex items-center gap-3 max-w-xs">
          <span className="text-xs text-muted-foreground font-mono">IN</span>
          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full level-meter transition-all duration-75"
              style={{ width: `${inputLevel * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono w-8 text-right">
            {Math.round(inputLevel * 100)}
          </span>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-2 bg-muted rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <span className="text-sm font-mono text-foreground w-10">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Performance Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Cpu className="w-4 h-4" />
            <span>{performanceStats.cpu}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HardDrive className="w-4 h-4" />
            <span>{performanceStats.memory}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{performanceStats.latency}ms</span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full transition-colors"
            style={{
              backgroundColor: isConnected ? 'hsl(var(--stage-active))' : 'hsl(var(--stage-inactive))',
              boxShadow: isConnected ? '0 0 10px hsl(var(--stage-active))' : 'none',
            }}
          />
          <span className="text-xs font-mono text-muted-foreground uppercase">
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
}
