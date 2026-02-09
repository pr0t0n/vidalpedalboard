import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
import { PedalParams } from '@/hooks/useAudioEngine';

interface ChorusPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['chorus'];
  onParamChange: (param: string, value: number) => void;
}

export function ChorusPedal({ isOn, onToggle, params, onParamChange }: ChorusPedalProps) {
  return (
    <PedalCase
      name="CHORUS"
      subtitle="Modulation"
      color="hsl(var(--pedal-chorus))"
      glowColor="hsl(var(--pedal-chorus-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <ParamSlider value={params.rate} min={0.1} max={10} onChange={(v) => onParamChange('rate', v)} label="Rate" color="hsl(var(--pedal-chorus))" />
      <ParamSlider value={params.depth} min={0} max={1} onChange={(v) => onParamChange('depth', v)} label="Depth" color="hsl(var(--pedal-chorus))" />
      <ParamSlider value={params.feedback} min={0} max={1} onChange={(v) => onParamChange('feedback', v)} label="Feedback" color="hsl(var(--pedal-chorus))" />
    </PedalCase>
  );
}
