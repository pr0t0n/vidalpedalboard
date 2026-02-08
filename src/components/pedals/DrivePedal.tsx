import { PedalCase } from '@/components/PedalCase';
import { ParamControl } from '@/components/ParamControl';
import { PedalParams } from '@/hooks/useAudioEngine';

interface DrivePedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['drive'];
  onParamChange: (param: string, value: number) => void;
}

export function DrivePedal({ isOn, onToggle, params, onParamChange }: DrivePedalProps) {
  return (
    <PedalCase
      name="OVERDRIVE"
      subtitle="Tube Screamer"
      color="hsl(var(--pedal-drive))"
      glowColor="hsl(var(--pedal-drive-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-4">
        <ParamControl
          value={params.gain}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange('gain', v)}
          label="Gain"
          color="hsl(var(--pedal-drive))"
          size="md"
        />
        <ParamControl
          value={params.tone}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange('tone', v)}
          label="Tone"
          color="hsl(var(--pedal-drive))"
          size="md"
        />
      </div>
    </PedalCase>
  );
}
