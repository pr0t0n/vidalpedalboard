import { Guitar } from 'lucide-react';

export function VidalLogo() {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Main Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Guitar className="w-8 h-8 text-primary" />
          <div className="absolute inset-0 blur-md bg-primary/30 -z-10" />
        </div>
        <div className="flex flex-col">
          <span
            className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
            style={{
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            VIDAL
          </span>
          <span className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase -mt-1">
            PedalBoard
          </span>
        </div>
      </div>
    </div>
  );
}

export function VidalFooter() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span>Desenvolvido por</span>
      <span className="font-bold text-primary">André Vidal</span>
      <span>•</span>
      <span className="font-mono">PedalBoard v1.0</span>
    </div>
  );
}
