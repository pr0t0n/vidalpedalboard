import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
import { PedalParams } from '@/hooks/useAudioEngine';

interface DelayPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['delay'];
  onParamChange: (param: string, value: number) => void;
}

export function DelayPedal({ isOn, onToggle, params, onParamChange }: DelayPedalProps) {
  return (
    <PedalCase
      name="DELAY"
      subtitle="Echo"
      color="hsl(var(--pedal-delay))"
      glowColor="hsl(var(--pedal-delay-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <ParamSlider value={params.time} min={0.01} max={1} onChange={(v) => onParamChange('time', v)} label="Time" color="hsl(var(--pedal-delay))" />
      <ParamSlider value={params.feedback} min={0} max={0.9} onChange={(v) => onParamChange('feedback', v)} label="Feedback" color="hsl(var(--pedal-delay))" />
      <ParamSlider value={params.mix} min={0} max={1} onChange={(v) => onParamChange('mix', v)} label="Mix" color="hsl(var(--pedal-delay))" />
    </PedalCase>
  );
}
