import { PedalCase } from '@/components/PedalCase';
import { Knob } from '@/components/Knob';
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
      subtitle="Digital Echo"
      color="hsl(var(--pedal-delay))"
      glowColor="hsl(var(--pedal-delay-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-3">
        <Knob
          value={params.time * 1000}
          min={50}
          max={1000}
          onChange={(v) => onParamChange('time', v / 1000)}
          label="Time"
          color="hsl(var(--pedal-delay))"
          size="sm"
        />
        <Knob
          value={params.feedback}
          min={0}
          max={0.9}
          onChange={(v) => onParamChange('feedback', v)}
          label="Repeat"
          color="hsl(var(--pedal-delay))"
          size="sm"
        />
        <Knob
          value={params.mix}
          min={0}
          max={1}
          onChange={(v) => onParamChange('mix', v)}
          label="Mix"
          color="hsl(var(--pedal-delay))"
          size="sm"
        />
      </div>
    </PedalCase>
  );
}
