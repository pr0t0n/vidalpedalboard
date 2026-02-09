import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
import { PedalParams } from '@/hooks/useAudioEngine';

interface WahPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['wah'];
  onParamChange: (param: string, value: number) => void;
}

export function WahPedal({ isOn, onToggle, params, onParamChange }: WahPedalProps) {
  return (
    <PedalCase
      name="WAH"
      subtitle="Filter"
      color="hsl(var(--pedal-wah))"
      glowColor="hsl(var(--pedal-wah-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <ParamSlider value={params.frequency} min={0} max={1} onChange={(v) => onParamChange('frequency', v)} label="Freq" color="hsl(var(--pedal-wah))" />
      <ParamSlider value={params.resonance} min={1} max={30} onChange={(v) => onParamChange('resonance', v)} label="Resonance" color="hsl(var(--pedal-wah))" />
    </PedalCase>
  );
}
