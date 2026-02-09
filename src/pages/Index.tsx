import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useAuth } from '@/hooks/useAuth';
import { usePresets } from '@/hooks/usePresets';
import { useWakeLock } from '@/hooks/useWakeLock';
import { CompressorPedal } from '@/components/pedals/CompressorPedal';
import { DrivePedal } from '@/components/pedals/DrivePedal';
import { DistortionPedal } from '@/components/pedals/DistortionPedal';
import { ChorusPedal } from '@/components/pedals/ChorusPedal';
import { TremoloPedal } from '@/components/pedals/TremoloPedal';
import { DelayPedal } from '@/components/pedals/DelayPedal';
import { WahPedal } from '@/components/pedals/WahPedal';
import { ReverbPedal } from '@/components/pedals/ReverbPedal';
import { VidalLogo } from '@/components/VidalLogo';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertCircle, Mic, MicOff, Volume2, Settings, LogOut, Shield,
  Save, FolderOpen, Trash2, Sun, Moon
} from 'lucide-react';

interface IndexProps {
  onSignOut: () => void;
  isAdmin: boolean;
}

interface CustomPedalDB {
  id: string;
  name: string;
  subtitle: string | null;
  color: string;
  glow_color: string;
  params: any[];
  is_on_board: boolean;
  is_hidden: boolean;
  code: string;
}

const Index = ({ onSignOut, isAdmin }: IndexProps) => {
  const { user } = useAuth();
  const {
    isConnected, isLoading, error, inputLevel,
    pedalState, params, connect, disconnect,
    togglePedal, updateParam, setVolume,
  } = useAudioEngine();

  const { presets, savePreset, activatePreset, deletePreset } = usePresets(user?.id);
  const { isActive: wakeLockActive, request: requestWakeLock } = useWakeLock();

  const [customPedals, setCustomPedals] = useState<CustomPedalDB[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Fetch custom pedals from DB
  const fetchCustomPedals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('custom_pedals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_on_board', true)
      .eq('is_hidden', false);
    if (data) setCustomPedals(data as unknown as CustomPedalDB[]);
  }, [user]);

  useEffect(() => { fetchCustomPedals(); }, [fetchCustomPedals]);

  // Request wake lock on connect
  useEffect(() => {
    if (isConnected && !wakeLockActive) {
      requestWakeLock();
    }
  }, [isConnected, wakeLockActive, requestWakeLock]);

  // Save preset handler
  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    await savePreset(newPresetName.trim(), pedalState, params, {});
    setNewPresetName('');
  };

  // Load preset handler
  const handleLoadPreset = async (preset: any) => {
    await activatePreset(preset.id);
    // Apply preset values to audio engine
    if (preset.pedal_states) {
      Object.entries(preset.pedal_states).forEach(([key, value]) => {
        if (value !== pedalState[key as keyof typeof pedalState]) {
          togglePedal(key as any);
        }
      });
    }
    if (preset.pedal_params) {
      Object.entries(preset.pedal_params).forEach(([pedal, pedalParams]: [string, any]) => {
        if (pedal === 'volume' && typeof pedalParams === 'number') {
          setVolume(pedalParams);
        } else if (typeof pedalParams === 'object') {
          Object.entries(pedalParams).forEach(([param, value]) => {
            if (typeof value === 'number') {
              updateParam(pedal as any, param, value);
            }
          });
        }
      });
    }
    setShowPresets(false);
  };

  // Count visible pedals (max 8)
  const maxStandardPedals = 8;
  const standardPedalCount = 8; // comp, drive, dist, chorus, trem, delay, wah, reverb
  const customSlotsAvailable = maxStandardPedals - standardPedalCount;
  const visibleCustomPedals = customPedals.slice(0, Math.max(0, customSlotsAvailable));

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <VidalLogo />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Connect */}
            <button
              onClick={isConnected ? disconnect : connect}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
              style={{
                background: isConnected
                  ? 'linear-gradient(180deg, hsl(0, 60%, 45%) 0%, hsl(0, 65%, 35%) 100%)'
                  : 'linear-gradient(180deg, hsl(142, 60%, 40%) 0%, hsl(142, 65%, 30%) 100%)',
              }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isConnected ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4 text-white" />
              )}
              <span className="text-white text-xs">
                {isLoading ? 'CONECTANDO...' : isConnected ? 'OFF' : 'ON'}
              </span>
            </button>

            {/* Input Level */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground font-mono">IN</span>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full level-meter transition-all duration-75" style={{ width: `${inputLevel * 100}%` }} />
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="range" min="0" max="1" step="0.01"
                value={params.volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-2 bg-muted rounded-full appearance-none cursor-pointer touch-manipulation
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="text-[9px] font-mono text-foreground w-6">{Math.round(params.volume * 100)}%</span>
            </div>

            {/* Presets */}
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors touch-manipulation"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Presets</span>
            </button>

            {/* Pedal Manager */}
            <Link to="/pedals" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium hidden sm:inline">Pedais</span>
            </Link>

            {/* Admin */}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Status & Logout */}
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isConnected ? 'hsl(142, 70%, 45%)' : 'hsl(0, 0%, 25%)',
                  boxShadow: isConnected ? '0 0 6px hsl(142, 70%, 45%)' : 'none',
                }}
              />
              <button onClick={onSignOut} className="p-2 rounded-lg hover:bg-muted/80 transition-colors touch-manipulation">
                <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Presets Panel */}
      {showPresets && (
        <div className="bg-card border-b border-border px-3 py-3 flex-shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Save preset */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                placeholder="Nome do preset..."
                className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-95 touch-manipulation disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
            {/* Preset list */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {presets.map(p => (
                <div key={p.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleLoadPreset(p)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                      p.is_active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {p.name}
                  </button>
                  <button onClick={() => deletePreset(p.id)} className="p-1 text-destructive/50 hover:text-destructive touch-manipulation">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {presets.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum preset salvo</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mx-3 mt-2 p-3 rounded-xl bg-destructive/20 border border-destructive/50 flex items-center gap-2 flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Pedals Grid */}
      <main className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          <CompressorPedal
            isOn={pedalState.compressor} onToggle={() => togglePedal('compressor')}
            params={params.compressor} onParamChange={(p, v) => updateParam('compressor', p, v)}
          />
          <DrivePedal
            isOn={pedalState.drive} onToggle={() => togglePedal('drive')}
            params={params.drive} onParamChange={(p, v) => updateParam('drive', p, v)}
          />
          <DistortionPedal
            isOn={pedalState.distortion} onToggle={() => togglePedal('distortion')}
            params={params.distortion} onParamChange={(p, v) => updateParam('distortion', p, v)}
          />
          <ChorusPedal
            isOn={pedalState.chorus} onToggle={() => togglePedal('chorus')}
            params={params.chorus} onParamChange={(p, v) => updateParam('chorus', p, v)}
          />
          <TremoloPedal
            isOn={pedalState.tremolo} onToggle={() => togglePedal('tremolo')}
            params={params.tremolo} onParamChange={(p, v) => updateParam('tremolo', p, v)}
          />
          <DelayPedal
            isOn={pedalState.delay} onToggle={() => togglePedal('delay')}
            params={params.delay} onParamChange={(p, v) => updateParam('delay', p, v)}
          />
          <WahPedal
            isOn={pedalState.wah} onToggle={() => togglePedal('wah')}
            params={params.wah} onParamChange={(p, v) => updateParam('wah', p, v)}
          />
          <ReverbPedal
            isOn={pedalState.reverb} onToggle={() => togglePedal('reverb')}
            params={params.reverb} onParamChange={(p, v) => updateParam('reverb', p, v)}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
