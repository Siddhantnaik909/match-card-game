/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { sound } from '../services/sound';

export function useAudioManager() {
  const [sfxEnabled, setSfxEnabledState] = useState(sound.sfxEnabled);
  const [musicEnabled, setMusicEnabledState] = useState(sound.musicEnabled);
  const [sfxVolume, setSfxVolumeState] = useState(sound.sfxVolume);

  // Sync state if changed externally
  useEffect(() => {
    setSfxEnabledState(sound.sfxEnabled);
    setMusicEnabledState(sound.musicEnabled);
    setSfxVolumeState(sound.sfxVolume);
  }, []);

  const toggleSfx = useCallback(() => {
    const next = !sound.sfxEnabled;
    sound.setSfxEnabled(next);
    setSfxEnabledState(next);
    if (next) {
      sound.playButtonClick();
    }
  }, []);

  const toggleMusic = useCallback(() => {
    const next = !sound.musicEnabled;
    sound.setMusicEnabled(next);
    setMusicEnabledState(next);
  }, []);

  const setSfxVolume = useCallback((val: number) => {
    sound.setSfxVolume(val);
    setSfxVolumeState(val);
  }, []);

  return {
    sfxEnabled,
    musicEnabled,
    sfxVolume,
    toggleSfx,
    toggleMusic,
    setSfxVolume,
    playCardSelect: () => sound.playCardSelect(),
    playCardPass: () => sound.playCardPass(),
    playCardReceive: () => sound.playCardReceive(),
    playCountdown: () => sound.playCountdown(),
    playUrgentTick: () => sound.playUrgentTick(),
    playGoBuzzer: () => sound.playGoBuzzer(),
    playDealCascade: () => sound.playDealCascade(),
    playButtonClick: () => sound.playButtonClick(),
    playVictory: () => sound.playVictory(),
  };
}
