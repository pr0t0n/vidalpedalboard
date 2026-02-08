import { PedalCase } from '@/components/PedalCase';
import { Knob } from '@/components/Knob';
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
      subtitle="Brown Sound"
      color="hsl(var(--pedal-drive))"
      glowColor="hsl(var(--pedal-drive-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-4">
        <Knob
          value={params.gain}
          min={0}
          max={1}
          onChange={(v) => onParamChange('gain', v)}
          label="Drive"
          color="hsl(var(--pedal-drive))"
          size="md"
        />
        <Knob
          value={params.tone}
          min={0}
          max={1}
          onChange={(v) => onParamChange('tone', v)}
          label="Tone"
          color="hsl(var(--pedal-drive))"
          size="md"
        />
      </div>
    </PedalCase>
  );
}
