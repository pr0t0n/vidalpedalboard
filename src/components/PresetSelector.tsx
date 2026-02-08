import { useState } from 'react';
import { Preset, presets } from '@/lib/presets';
import { Settings, ChevronDown, Zap, Music, Flame, Sparkles, Waves } from 'lucide-react';

interface PresetSelectorProps {
  onSelectPreset: (preset: Preset) => void;
  currentPresetId?: string;
}

const categoryIcons: Record<Preset['category'], React.ReactNode> = {
  rock: <Zap className="w-4 h-4" />,
  blues: <Music className="w-4 h-4" />,
  metal: <Flame className="w-4 h-4" />,
  clean: <Sparkles className="w-4 h-4" />,
  ambient: <Waves className="w-4 h-4" />,
  custom: <Settings className="w-4 h-4" />,
};

const categoryColors: Record<Preset['category'], string> = {
  rock: 'hsl(25, 70%, 50%)',
  blues: 'hsl(200, 60%, 50%)',
  metal: 'hsl(0, 70%, 50%)',
  clean: 'hsl(142, 60%, 50%)',
  ambient: 'hsl(260, 50%, 60%)',
  custom: 'hsl(45, 70%, 50%)',
};

export function PresetSelector({ onSelectPreset, currentPresetId }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentPreset = presets.find(p => p.id === currentPresetId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
      >
        <Settings className="w-5 h-5 text-muted-foreground" />
        <div className="flex flex-col items-start">
          <span className="text-xs text-muted-foreground">PRESET</span>
          <span className="font-bold text-foreground">
            {currentPreset?.name || 'Selecionar'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-border">
              <span className="text-xs font-mono text-muted-foreground uppercase">Presets Disponíveis</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all text-left ${
                    currentPresetId === preset.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${categoryColors[preset.category]}20`, color: categoryColors[preset.category] }}
                  >
                    {categoryIcons[preset.category]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">{preset.description}</div>
                  </div>
                  {currentPresetId === preset.id && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
