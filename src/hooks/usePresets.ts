import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PedalState, PedalParams } from '@/hooks/useAudioEngine';

export interface Preset {
  id: string;
  name: string;
  pedal_states: PedalState;
  pedal_params: PedalParams;
  pedal_visibility: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
}

export function usePresets(userId: string | undefined) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPresets = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('presets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        pedal_states: d.pedal_states as PedalState,
        pedal_params: d.pedal_params as PedalParams,
        pedal_visibility: (d.pedal_visibility || {}) as Record<string, boolean>,
        is_active: d.is_active,
        created_at: d.created_at,
      }));
      setPresets(mapped);
      const active = mapped.find(p => p.is_active);
      if (active) setActivePreset(active);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  const savePreset = useCallback(async (
    name: string,
    pedalState: PedalState,
    pedalParams: PedalParams,
    pedalVisibility: Record<string, boolean>
  ) => {
    if (!userId) return;
    const { error } = await supabase.from('presets').insert({
      user_id: userId,
      name,
      pedal_states: pedalState as any,
      pedal_params: pedalParams as any,
      pedal_visibility: pedalVisibility as any,
    });
    if (!error) fetchPresets();
    return { error };
  }, [userId, fetchPresets]);

  const activatePreset = useCallback(async (presetId: string) => {
    if (!userId) return;
    // Deactivate all
    await supabase.from('presets').update({ is_active: false }).eq('user_id', userId);
    // Activate selected
    await supabase.from('presets').update({ is_active: true }).eq('id', presetId);
    fetchPresets();
  }, [userId, fetchPresets]);

  const deletePreset = useCallback(async (presetId: string) => {
    await supabase.from('presets').delete().eq('id', presetId);
    fetchPresets();
  }, [fetchPresets]);

  return { presets, activePreset, isLoading, savePreset, activatePreset, deletePreset, fetchPresets };
}
