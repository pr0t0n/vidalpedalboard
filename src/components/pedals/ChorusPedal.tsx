import { PedalCase } from '@/components/PedalCase';
import { Knob } from '@/components/Knob';
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
      subtitle="Deep Blue"
      color="hsl(var(--pedal-chorus))"
      glowColor="hsl(var(--pedal-chorus-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-3">
        <Knob
          value={params.rate}
          min={0.01}
          max={8}
          onChange={(v) => onParamChange('rate', v)}
          label="Rate"
          color="hsl(var(--pedal-chorus))"
          size="sm"
        />
        <Knob
          value={params.depth}
          min={0}
          max={1}
          onChange={(v) => onParamChange('depth', v)}
          label="Depth"
          color="hsl(var(--pedal-chorus))"
          size="sm"
        />
        <Knob
          value={params.feedback}
          min={0}
          max={1}
          onChange={(v) => onParamChange('feedback', v)}
          label="Mix"
          color="hsl(var(--pedal-chorus))"
          size="sm"
        />
      </div>
    </PedalCase>
  );
}
