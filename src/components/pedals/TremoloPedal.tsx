import { PedalCase } from '@/components/PedalCase';
import { Knob } from '@/components/Knob';
import { PedalParams } from '@/hooks/useAudioEngine';

interface TremoloPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['tremolo'];
  onParamChange: (param: string, value: number) => void;
}

export function TremoloPedal({ isOn, onToggle, params, onParamChange }: TremoloPedalProps) {
  return (
    <PedalCase
      name="TREMOLO"
      subtitle="Amplitude"
      color="hsl(var(--pedal-tremolo))"
      glowColor="hsl(var(--pedal-tremolo-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-4">
        <Knob
          value={params.rate}
          min={0.5}
          max={20}
          onChange={(v) => onParamChange('rate', v)}
          label="Speed"
          color="hsl(var(--pedal-tremolo))"
          size="md"
        />
        <Knob
          value={params.depth}
          min={0}
          max={1}
          onChange={(v) => onParamChange('depth', v)}
          label="Depth"
          color="hsl(var(--pedal-tremolo))"
          size="md"
        />
      </div>
    </PedalCase>
  );
}
