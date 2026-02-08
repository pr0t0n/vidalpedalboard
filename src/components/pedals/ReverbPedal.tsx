import { PedalCase } from '@/components/PedalCase';
import { Knob } from '@/components/Knob';
import { PedalParams } from '@/hooks/useAudioEngine';

interface ReverbPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['reverb'];
  onParamChange: (param: string, value: number) => void;
}

export function ReverbPedal({ isOn, onToggle, params, onParamChange }: ReverbPedalProps) {
  return (
    <PedalCase
      name="REVERB"
      subtitle="Hall"
      color="hsl(var(--pedal-reverb))"
      glowColor="hsl(var(--pedal-reverb-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-4">
        <Knob
          value={params.decay}
          min={0}
          max={1}
          onChange={(v) => onParamChange('decay', v)}
          label="Decay"
          color="hsl(var(--pedal-reverb))"
          size="md"
        />
        <Knob
          value={params.mix}
          min={0}
          max={1}
          onChange={(v) => onParamChange('mix', v)}
          label="Mix"
          color="hsl(var(--pedal-reverb))"
          size="md"
        />
      </div>
    </PedalCase>
  );
}
