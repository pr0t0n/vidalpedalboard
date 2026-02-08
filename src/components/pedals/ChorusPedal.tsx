import { PedalCase } from '@/components/PedalCase';
import { ParamControl } from '@/components/ParamControl';
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
        <ParamControl
          value={params.rate}
          min={0.01}
          max={8}
          step={0.5}
          onChange={(v) => onParamChange('rate', v)}
          label="Rate"
          color="hsl(var(--pedal-chorus))"
          size="sm"
        />
        <ParamControl
          value={params.depth}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange('depth', v)}
          label="Depth"
          color="hsl(var(--pedal-chorus))"
          size="sm"
        />
      </div>
    </PedalCase>
  );
}
