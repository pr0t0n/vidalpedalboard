import { PedalCase } from '@/components/PedalCase';
import { Knob } from '@/components/Knob';
import { PedalParams } from '@/hooks/useAudioEngine';

interface DistortionPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['distortion'];
  onParamChange: (param: string, value: number) => void;
  onToggleEVH: () => void;
}

export function DistortionPedal({ isOn, onToggle, params, onParamChange, onToggleEVH }: DistortionPedalProps) {
  return (
    <PedalCase
      name={params.evhMode ? "EVH" : "DISTORTION"}
      subtitle={params.evhMode ? "Brown Sound" : "High Gain"}
      color={params.evhMode ? "hsl(45, 100%, 50%)" : "hsl(var(--pedal-distortion))"}
      glowColor={params.evhMode ? "hsl(45, 100%, 60%)" : "hsl(var(--pedal-distortion-glow))"}
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex flex-col gap-3">
        {/* EVH Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleEVH();
          }}
          className="w-full py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
          style={{
            background: params.evhMode 
              ? 'linear-gradient(180deg, hsl(45, 100%, 50%) 0%, hsl(35, 100%, 40%) 100%)'
              : 'linear-gradient(180deg, hsl(220, 15%, 25%) 0%, hsl(220, 18%, 18%) 100%)',
            color: params.evhMode ? 'black' : 'hsl(var(--muted-foreground))',
            boxShadow: params.evhMode 
              ? '0 0 15px hsl(45, 100%, 50% / 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
              : 'inset 0 2px 4px rgba(0,0,0,0.3)',
            border: params.evhMode ? '1px solid hsl(45, 100%, 60%)' : '1px solid hsl(220, 15%, 30%)',
          }}
        >
          {params.evhMode ? '🎸 EVH ON' : 'EVH MODE'}
        </button>

        <div className="flex gap-4">
          <Knob
            value={params.gain}
            min={0}
            max={1}
            onChange={(v) => onParamChange('gain', v)}
            label="Gain"
            color={params.evhMode ? "hsl(45, 100%, 50%)" : "hsl(var(--pedal-distortion))"}
            size="md"
          />
          <Knob
            value={params.tone}
            min={0}
            max={1}
            onChange={(v) => onParamChange('tone', v)}
            label="Tone"
            color={params.evhMode ? "hsl(45, 100%, 50%)" : "hsl(var(--pedal-distortion))"}
            size="md"
          />
        </div>
      </div>
    </PedalCase>
  );
}
