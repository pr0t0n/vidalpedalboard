import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
import { PedalParams } from '@/hooks/useAudioEngine';

interface TremoloPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['tremolo'];
  onParamChange: (param: string, value: number) => void;
}

export function TremoloPedal({ isOn, onToggle, params, onParamChange }: TremoloPedalProps) {
  return (
    <PedalCase
      name="TREMOLO"
      subtitle="Modulation"
      color="hsl(var(--pedal-tremolo))"
      glowColor="hsl(var(--pedal-tremolo-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <ParamSlider value={params.rate} min={0.1} max={20} onChange={(v) => onParamChange('rate', v)} label="Rate" color="hsl(var(--pedal-tremolo))" />
      <ParamSlider value={params.depth} min={0} max={1} onChange={(v) => onParamChange('depth', v)} label="Depth" color="hsl(var(--pedal-tremolo))" />
    </PedalCase>
  );
}
