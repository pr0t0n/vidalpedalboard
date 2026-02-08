import { PedalCase } from '@/components/PedalCase';
import { ParamControl } from '@/components/ParamControl';
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
      subtitle="Vintage Vibe"
      color="hsl(var(--pedal-tremolo))"
      glowColor="hsl(var(--pedal-tremolo-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-4">
        <ParamControl
          value={params.rate}
          min={0.5}
          max={20}
          step={0.5}
          onChange={(v) => onParamChange('rate', v)}
          label="Speed"
          color="hsl(var(--pedal-tremolo))"
          size="sm"
        />
        <ParamControl
          value={params.depth}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange('depth', v)}
          label="Depth"
          color="hsl(var(--pedal-tremolo))"
          size="sm"
        />
      </div>
    </PedalCase>
  );
}
