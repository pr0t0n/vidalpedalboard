import { useAudioEngine } from '@/hooks/useAudioEngine';
import { StagePedal } from '@/components/StagePedal';
import { StageHeader } from '@/components/StageHeader';
import { StageTuner } from '@/components/StageTuner';
import { StageMetronome } from '@/components/StageMetronome';
import { AlertCircle } from 'lucide-react';

const Index = () => {
  const {
    isConnected,
    isLoading,
    error,
    inputLevel,
    tunerData,
    pedalState,
    params,
    performanceStats,
    connect,
    disconnect,
    togglePedal,
    updateParam,
    setVolume,
  } = useAudioEngine();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <StageHeader
        isConnected={isConnected}
        isLoading={isLoading}
        inputLevel={inputLevel}
        volume={params.volume}
        performanceStats={performanceStats}
        onConnect={connect}
        onDisconnect={disconnect}
        onVolumeChange={setVolume}
      />

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-destructive/20 border border-destructive/50 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Top Row: Tuner + Metronome */}
        <div className="grid grid-cols-2 gap-4">
          <StageTuner
            isOn={pedalState.tuner}
            onToggle={() => togglePedal('tuner')}
            tunerData={tunerData}
            isConnected={isConnected}
          />
          <StageMetronome />
        </div>

        {/* Pedals Grid - 2x4 for tablet */}
        <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-3">
          <StagePedal
            name="COMP"
            color="hsl(var(--pedal-compressor))"
            isOn={pedalState.compressor}
            onToggle={() => togglePedal('compressor')}
            params={[
              { label: 'THR', value: params.compressor.threshold, min: -60, max: 0, onChange: (v) => updateParam('compressor', 'threshold', v) },
              { label: 'RAT', value: params.compressor.ratio, min: 1, max: 20, onChange: (v) => updateParam('compressor', 'ratio', v) },
            ]}
          />
          <StagePedal
            name="DRIVE"
            color="hsl(var(--pedal-drive))"
            isOn={pedalState.drive}
            onToggle={() => togglePedal('drive')}
            params={[
              { label: 'GAIN', value: params.drive.gain, min: 0, max: 1, onChange: (v) => updateParam('drive', 'gain', v) },
              { label: 'TONE', value: params.drive.tone, min: 0, max: 1, onChange: (v) => updateParam('drive', 'tone', v) },
            ]}
          />
          <StagePedal
            name="CHORUS"
            color="hsl(var(--pedal-chorus))"
            isOn={pedalState.chorus}
            onToggle={() => togglePedal('chorus')}
            params={[
              { label: 'RATE', value: params.chorus.rate, min: 0.01, max: 8, onChange: (v) => updateParam('chorus', 'rate', v) },
              { label: 'DEPTH', value: params.chorus.depth, min: 0, max: 1, onChange: (v) => updateParam('chorus', 'depth', v) },
            ]}
          />
          <StagePedal
            name="TREM"
            color="hsl(var(--pedal-tremolo))"
            isOn={pedalState.tremolo}
            onToggle={() => togglePedal('tremolo')}
            params={[
              { label: 'SPEED', value: params.tremolo.rate, min: 0.5, max: 20, onChange: (v) => updateParam('tremolo', 'rate', v) },
              { label: 'DEPTH', value: params.tremolo.depth, min: 0, max: 1, onChange: (v) => updateParam('tremolo', 'depth', v) },
            ]}
          />
          <StagePedal
            name="DELAY"
            color="hsl(var(--pedal-delay))"
            isOn={pedalState.delay}
            onToggle={() => togglePedal('delay')}
            params={[
              { label: 'TIME', value: params.delay.time, min: 0.05, max: 1, onChange: (v) => updateParam('delay', 'time', v) },
              { label: 'MIX', value: params.delay.mix, min: 0, max: 1, onChange: (v) => updateParam('delay', 'mix', v) },
            ]}
          />
          <StagePedal
            name="WAH"
            color="hsl(var(--pedal-wah))"
            isOn={pedalState.wah}
            onToggle={() => togglePedal('wah')}
            params={[
              { label: 'FREQ', value: params.wah.frequency, min: 0, max: 1, onChange: (v) => updateParam('wah', 'frequency', v) },
              { label: 'RES', value: params.wah.resonance, min: 1, max: 30, onChange: (v) => updateParam('wah', 'resonance', v) },
            ]}
          />
          <StagePedal
            name="REVERB"
            color="hsl(var(--pedal-reverb))"
            isOn={pedalState.reverb}
            onToggle={() => togglePedal('reverb')}
            params={[
              { label: 'DECAY', value: params.reverb.decay, min: 0, max: 1, onChange: (v) => updateParam('reverb', 'decay', v) },
              { label: 'MIX', value: params.reverb.mix, min: 0, max: 1, onChange: (v) => updateParam('reverb', 'mix', v) },
            ]}
          />
          {/* Empty slot or future pedal */}
          <div className="rounded-xl border border-border/30 bg-card/30 flex items-center justify-center">
            <span className="text-muted-foreground/30 text-sm font-mono">EMPTY</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
