import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
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
      <button
        onClick={(e) => { e.stopPropagation(); onToggleEVH(); }}
        className="w-full py-2 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 touch-manipulation"
        style={{
          background: params.evhMode
            ? 'linear-gradient(180deg, hsl(45, 100%, 50%) 0%, hsl(35, 100%, 40%) 100%)'
            : 'linear-gradient(180deg, hsl(220, 15%, 25%) 0%, hsl(220, 18%, 18%) 100%)',
          color: params.evhMode ? 'black' : 'hsl(var(--muted-foreground))',
          border: params.evhMode ? '1px solid hsl(45, 100%, 60%)' : '1px solid hsl(220, 15%, 30%)',
        }}
      >
        {params.evhMode ? '🎸 EVH ON' : 'EVH MODE'}
      </button>
      <ParamSlider
        value={params.gain} min={0} max={1}
        onChange={(v) => onParamChange('gain', v)} label="Gain"
        color={params.evhMode ? "hsl(45, 100%, 50%)" : "hsl(var(--pedal-distortion))"}
      />
      <ParamSlider
        value={params.tone} min={0} max={1}
        onChange={(v) => onParamChange('tone', v)} label="Tone"
        color={params.evhMode ? "hsl(45, 100%, 50%)" : "hsl(var(--pedal-distortion))"}
      />
    </PedalCase>
  );
}
