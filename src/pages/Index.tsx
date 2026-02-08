import { useAudioEngine } from '@/hooks/useAudioEngine';
import { TunerPedal } from '@/components/pedals/TunerPedal';
import { CompressorPedal } from '@/components/pedals/CompressorPedal';
import { DrivePedal } from '@/components/pedals/DrivePedal';
import { ChorusPedal } from '@/components/pedals/ChorusPedal';
import { TremoloPedal } from '@/components/pedals/TremoloPedal';
import { DelayPedal } from '@/components/pedals/DelayPedal';
import { WahPedal } from '@/components/pedals/WahPedal';
import { ReverbPedal } from '@/components/pedals/ReverbPedal';
import { Metronome } from '@/components/Metronome';
import { VolumeMaster } from '@/components/VolumeMaster';
import { AlertCircle, Mic, MicOff, Cpu, HardDrive, Clock } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          {/* Connect Button */}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isLoading}
            className="flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all active:scale-95 min-w-[200px] justify-center"
            style={{
              background: isConnected
                ? 'linear-gradient(180deg, hsl(0 60% 45%) 0%, hsl(0 65% 35%) 100%)'
                : 'linear-gradient(180deg, hsl(142 60% 40%) 0%, hsl(142 65% 30%) 100%)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isConnected ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
            <span className="text-white text-lg">
              {isLoading ? 'CONECTANDO...' : isConnected ? 'DESCONECTAR' : 'CONECTAR'}
            </span>
          </button>

          {/* Input Level Meter */}
          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <span className="text-xs text-muted-foreground font-mono">IN</span>
            <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full level-meter transition-all duration-75"
                style={{ width: `${inputLevel * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono w-8 text-right">
              {Math.round(inputLevel * 100)}
            </span>
          </div>

          {/* Performance Stats */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Cpu className="w-4 h-4" />
              <span>{performanceStats.cpu}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span>{performanceStats.memory}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{performanceStats.latency}ms</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full transition-colors"
              style={{
                backgroundColor: isConnected ? 'hsl(var(--stage-active))' : 'hsl(var(--stage-inactive))',
                boxShadow: isConnected ? '0 0 10px hsl(var(--stage-active))' : 'none',
              }}
            />
            <span className="text-xs font-mono text-muted-foreground uppercase">
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-destructive/20 border border-destructive/50 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* Signal Chain Flow */}
        <div className="mb-6 flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
          <span>GUITAR</span>
          <span>→</span>
          <span className={pedalState.tuner ? 'text-[hsl(var(--pedal-tuner))]' : ''}>TUNER</span>
          <span>→</span>
          <span className={pedalState.compressor ? 'text-[hsl(var(--pedal-compressor))]' : ''}>COMP</span>
          <span>→</span>
          <span className={pedalState.drive ? 'text-[hsl(var(--pedal-drive))]' : ''}>DRIVE</span>
          <span>→</span>
          <span className={pedalState.chorus ? 'text-[hsl(var(--pedal-chorus))]' : ''}>CHORUS</span>
          <span>→</span>
          <span className={pedalState.tremolo ? 'text-[hsl(var(--pedal-tremolo))]' : ''}>TREM</span>
          <span>→</span>
          <span className={pedalState.delay ? 'text-[hsl(var(--pedal-delay))]' : ''}>DELAY</span>
          <span>→</span>
          <span className={pedalState.wah ? 'text-[hsl(var(--pedal-wah))]' : ''}>WAH</span>
          <span>→</span>
          <span className={pedalState.reverb ? 'text-[hsl(var(--pedal-reverb))]' : ''}>REVERB</span>
          <span>→</span>
          <span>AMP</span>
        </div>

        {/* Pedals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <TunerPedal
            isOn={pedalState.tuner}
            onToggle={() => togglePedal('tuner')}
            tunerData={tunerData}
            isConnected={isConnected}
          />
          <CompressorPedal
            isOn={pedalState.compressor}
            onToggle={() => togglePedal('compressor')}
            params={params.compressor}
            onParamChange={(param, value) => updateParam('compressor', param, value)}
          />
          <DrivePedal
            isOn={pedalState.drive}
            onToggle={() => togglePedal('drive')}
            params={params.drive}
            onParamChange={(param, value) => updateParam('drive', param, value)}
          />
          <ChorusPedal
            isOn={pedalState.chorus}
            onToggle={() => togglePedal('chorus')}
            params={params.chorus}
            onParamChange={(param, value) => updateParam('chorus', param, value)}
          />
          <TremoloPedal
            isOn={pedalState.tremolo}
            onToggle={() => togglePedal('tremolo')}
            params={params.tremolo}
            onParamChange={(param, value) => updateParam('tremolo', param, value)}
          />
          <DelayPedal
            isOn={pedalState.delay}
            onToggle={() => togglePedal('delay')}
            params={params.delay}
            onParamChange={(param, value) => updateParam('delay', param, value)}
          />
          <WahPedal
            isOn={pedalState.wah}
            onToggle={() => togglePedal('wah')}
            params={params.wah}
            onParamChange={(param, value) => updateParam('wah', param, value)}
          />
          <ReverbPedal
            isOn={pedalState.reverb}
            onToggle={() => togglePedal('reverb')}
            params={params.reverb}
            onParamChange={(param, value) => updateParam('reverb', param, value)}
          />
        </div>

        {/* Bottom Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Metronome />
          <VolumeMaster
            volume={params.volume}
            onChange={setVolume}
            level={inputLevel}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-3 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          GUITAR PEDALBOARD v1.0 • Conecte sua guitarra via interface de áudio (iRig, Focusrite, etc)
        </p>
      </footer>
    </div>
  );
};

export default Index;
