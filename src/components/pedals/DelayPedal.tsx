import { PedalCase } from '@/components/PedalCase';
import { ParamControl } from '@/components/ParamControl';
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
      subtitle="Digital"
      color="hsl(var(--pedal-delay))"
      glowColor="hsl(var(--pedal-delay-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-3">
        <ParamControl
          value={params.time}
          min={0.05}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange('time', v)}
          label="Time"
          color="hsl(var(--pedal-delay))"
          size="sm"
        />
        <ParamControl
          value={params.feedback}
          min={0}
          max={0.9}
          step={0.05}
          onChange={(v) => onParamChange('feedback', v)}
          label="Repeat"
          color="hsl(var(--pedal-delay))"
          size="sm"
        />
        <ParamControl
          value={params.mix}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange('mix', v)}
          label="Mix"
          color="hsl(var(--pedal-delay))"
          size="sm"
        />
      </div>
    </PedalCase>
  );
}
