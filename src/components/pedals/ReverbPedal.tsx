import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
import { PedalParams } from '@/hooks/useAudioEngine';

interface ReverbPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['reverb'];
  onParamChange: (param: string, value: number) => void;
}

export function ReverbPedal({ isOn, onToggle, params, onParamChange }: ReverbPedalProps) {
  return (
    <PedalCase
      name="REVERB"
      subtitle="Hall"
      color="hsl(var(--pedal-reverb))"
      glowColor="hsl(var(--pedal-reverb-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <ParamSlider value={params.decay} min={0} max={1} onChange={(v) => onParamChange('decay', v)} label="Decay" color="hsl(var(--pedal-reverb))" />
      <ParamSlider value={params.mix} min={0} max={1} onChange={(v) => onParamChange('mix', v)} label="Mix" color="hsl(var(--pedal-reverb))" />
    </PedalCase>
  );
}
