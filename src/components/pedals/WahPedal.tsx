import { PedalCase } from '@/components/PedalCase';
import { ParamControl } from '@/components/ParamControl';
import { PedalParams } from '@/hooks/useAudioEngine';

interface WahPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['wah'];
  onParamChange: (param: string, value: number) => void;
}

export function WahPedal({ isOn, onToggle, params, onParamChange }: WahPedalProps) {
  return (
    <PedalCase
      name="WAH"
      subtitle="Cry Baby"
      color="hsl(var(--pedal-wah))"
      glowColor="hsl(var(--pedal-wah-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="flex gap-4">
        <ParamControl
          value={params.frequency}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onParamChange('frequency', v)}
          label="Freq"
          color="hsl(var(--pedal-wah))"
          size="sm"
        />
        <ParamControl
          value={params.resonance}
          min={1}
          max={30}
          step={1}
          onChange={(v) => onParamChange('resonance', v)}
          label="Res"
          color="hsl(var(--pedal-wah))"
          size="sm"
        />
      </div>
    </PedalCase>
  );
}
