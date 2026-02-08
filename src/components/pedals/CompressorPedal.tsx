import { PedalCase } from '@/components/PedalCase';
import { ParamControl } from '@/components/ParamControl';
import { PedalParams } from '@/hooks/useAudioEngine';

interface CompressorPedalProps {
  isOn: boolean;
  onToggle: () => void;
  params: PedalParams['compressor'];
  onParamChange: (param: string, value: number) => void;
}

export function CompressorPedal({ isOn, onToggle, params, onParamChange }: CompressorPedalProps) {
  return (
    <PedalCase
      name="SUSTAIN"
      subtitle="Compressor"
      color="hsl(var(--pedal-compressor))"
      glowColor="hsl(var(--pedal-compressor-glow))"
      isOn={isOn}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-2 gap-3">
        <ParamControl
          value={params.threshold}
          min={-60}
          max={0}
          step={3}
          onChange={(v) => onParamChange('threshold', v)}
          label="Thresh"
          color="hsl(var(--pedal-compressor))"
          size="sm"
        />
        <ParamControl
          value={params.ratio}
          min={1}
          max={20}
          step={1}
          onChange={(v) => onParamChange('ratio', v)}
          label="Ratio"
          color="hsl(var(--pedal-compressor))"
          size="sm"
          showPercentage={false}
        />
      </div>
    </PedalCase>
  );
}
