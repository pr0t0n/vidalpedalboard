import { PedalCase } from '@/components/PedalCase';
import { ParamSlider } from '@/components/ParamSlider';
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
      <ParamSlider value={params.threshold} min={-60} max={0} onChange={(v) => onParamChange('threshold', v)} label="Thresh" color="hsl(var(--pedal-compressor))" />
      <ParamSlider value={params.ratio} min={1} max={20} onChange={(v) => onParamChange('ratio', v)} label="Ratio" color="hsl(var(--pedal-compressor))" />
      <ParamSlider value={params.attack * 1000} min={0} max={100} onChange={(v) => onParamChange('attack', v / 1000)} label="Attack" color="hsl(var(--pedal-compressor))" />
      <ParamSlider value={params.release * 1000} min={10} max={1000} onChange={(v) => onParamChange('release', v / 1000)} label="Release" color="hsl(var(--pedal-compressor))" />
    </PedalCase>
  );
}
