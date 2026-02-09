import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
import { PedalParams } from '@/hooks/useAudioEngine';

interface DistortionPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['distortion'];
  onParamChange: (param: string, value: number) => void;
}

export function DistortionPedal({ isOn, onToggle, params, onParamChange }: DistortionPedalProps) {
  return (
    <PedalCase
      name="DISTORTION"
      subtitle="High Gain"
      color="hsl(var(--pedal-distortion))"
      glowColor="hsl(var(--pedal-distortion-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <ParamSlider
        value={params.gain} min={0} max={1}
        onChange={(v) => onParamChange('gain', v)} label="Gain"
        color="hsl(var(--pedal-distortion))"
      />
      <ParamSlider
        value={params.tone} min={0} max={1}
        onChange={(v) => onParamChange('tone', v)} label="Tone"
        color="hsl(var(--pedal-distortion))"
      />
    </PedalCase>
  );
}
