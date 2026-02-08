import { useAudioEngine } from '@/hooks/useAudioEngine';
import { TunerPedal } from '@/components/pedals/TunerPedal';
import { CompressorPedal } from '@/components/pedals/CompressorPedal';
import { DrivePedal } from '@/components/pedals/DrivePedal';
import { ChorusPedal } from '@/components/pedals/ChorusPedal';
import { TremoloPedal } from '@/components/pedals/TremoloPedal';
import { DelayPedal } from '@/components/pedals/DelayPedal';
import { WahPedal } from '@/components/pedals/WahPedal';
import { ReverbPedal } from '@/components/pedals/ReverbPedal';
import { VolumeMaster } from '@/components/VolumeMaster';
import { Metronome } from '@/components/Metronome';
import { Mic, MicOff, Guitar, Zap } from 'lucide-react';

const Index = () => {
  const {
    isConnected,
    isLoading,
    error,
    tunerData,
    pedalState,
    params,
    connect,
    disconnect,
    togglePedal,
    updateParam,
    setVolume,
  } = useAudioEngine();

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Guitar className="w-10 h-10 text-primary" />
              <Zap className="w-4 h-4 text-primary absolute -bottom-1 -right-1" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-black tracking-wider text-foreground">
                PEDALBOARD
              </h1>
              <p className="text-sm text-muted-foreground">
                Virtual Guitar Effects Processor
              </p>
            </div>
          </div>

          {/* Connection button */}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isLoading}
            className="flex items-center gap-3 px-6 py-3 rounded-xl font-display font-bold text-sm transition-all"
            style={{
              background: isConnected
                ? 'linear-gradient(180deg, hsl(0 70% 45%) 0%, hsl(0 75% 35%) 100%)'
                : 'linear-gradient(180deg, hsl(120 60% 40%) 0%, hsl(120 65% 30%) 100%)',
              boxShadow: isConnected
                ? '0 4px 20px rgba(200,50,50,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 4px 20px rgba(50,150,50,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              color: 'white',
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isConnected ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            {isLoading
              ? 'Conectando...'
              : isConnected
              ? 'Desconectar'
              : 'Conectar Guitarra'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive text-sm">
            {error}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Left sidebar - Volume and Metronome */}
          <div className="flex flex-col gap-6">
            <VolumeMaster
              volume={params.volume}
              onVolumeChange={setVolume}
              isConnected={isConnected}
            />
            <Metronome initialBpm={120} />
          </div>

          {/* Pedalboard */}
          <div className="flex-1">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(180deg, hsl(220 12% 11%) 0%, hsl(220 15% 8%) 50%, hsl(220 18% 5%) 100%)',
                boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.02)',
              }}
            >
              {/* Cable/signal path indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-1 rounded-full bg-metal-mid" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest px-2">
                  Signal Chain
                </span>
                <div className="flex-1 h-1 rounded-full bg-metal-mid" />
              </div>

              {/* Pedals grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <TunerPedal
                  isOn={pedalState.tuner}
                  onToggle={() => togglePedal('tuner')}
                  tunerData={tunerData}
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

              {/* Bottom indicator */}
              <div className="flex items-center gap-2 mt-6">
                <div className="flex-1 h-1 rounded-full bg-metal-mid" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest px-2">
                  Output
                </span>
                <div className="flex-1 h-1 rounded-full bg-metal-mid" />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!isConnected && (
          <div className="mt-8 p-6 rounded-xl border border-border/50 bg-card/50">
            <h2 className="font-display font-bold text-lg text-foreground mb-3">
              Como usar:
            </h2>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-display font-bold text-primary">1.</span>
                Conecte sua guitarra ao computador usando uma interface de áudio
              </li>
              <li className="flex items-start gap-2">
                <span className="font-display font-bold text-primary">2.</span>
                Clique em "Conectar Guitarra" e permita o acesso ao microfone
              </li>
              <li className="flex items-start gap-2">
                <span className="font-display font-bold text-primary">3.</span>
                Clique nos pedais para ativar/desativar os efeitos
              </li>
              <li className="flex items-start gap-2">
                <span className="font-display font-bold text-primary">4.</span>
                Ajuste os knobs arrastando para cima/baixo
              </li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
