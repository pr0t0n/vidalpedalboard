export function VidalLogo() {
  return (
    <div className="flex items-center gap-2">
      {/* Premium Text Logo - Cyan */}
      <div className="flex items-center">
        <span
          className="text-xl font-black tracking-tight"
          style={{
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '-0.03em',
            background:
              'linear-gradient(135deg, hsl(var(--brand-cyan)) 0%, hsl(var(--brand-cyan-2)) 50%, hsl(var(--brand-cyan-3)) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ANDRÉ VIDAL
        </span>
      </div>

      {/* Divider */}
      <div
        className="w-px h-5"
        style={{
          background:
            'linear-gradient(180deg, transparent, hsl(var(--brand-cyan) / 0.5), transparent)',
        }}
      />

      {/* Product Name */}
      <div className="flex flex-col leading-none">
        <span
          className="text-[10px] font-medium tracking-[0.2em] uppercase"
          style={{
            color: 'hsl(var(--brand-cyan-2))',
          }}
        >
          PEDALBOARD
        </span>
        <span className="text-[8px] font-mono text-muted-foreground/60 tracking-wider">
          PRO SERIES
        </span>
      </div>
    </div>
  );
}

export function VidalFooter() {
  return (
    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground py-4">
      <span
        className="font-semibold"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--brand-cyan)), hsl(var(--brand-cyan-2)))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        André Vidal
      </span>
      <span className="text-muted-foreground/40">•</span>
      <span className="font-mono text-muted-foreground/60">PedalBoard v1.0</span>
    </div>
  );
}
