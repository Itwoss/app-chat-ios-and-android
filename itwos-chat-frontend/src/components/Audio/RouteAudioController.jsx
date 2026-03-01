import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudioManager } from '../../contexts/AudioManagerContext';

/**
 * RouteAudioController - Stops feed/post audio when leaving feed; allows story viewer to play its own audio.
 */
const PATHS_WHERE_AUDIO_CAN_PLAY = [
  '/user/home',
  '/user/feed',
  '/user/stories/view',  // Story viewer plays its own song – don't stop it
];

export default function RouteAudioController() {
  const location = useLocation();
  const { stopAll } = useAudioManager();

  useEffect(() => {
    const currentPath = location.pathname;
    const canPlayAudio = PATHS_WHERE_AUDIO_CAN_PLAY.some(
      path => currentPath === path || currentPath.startsWith(path + '/')
    );

    if (!canPlayAudio) {
      stopAll();
    }
  }, [location.pathname, stopAll]);

  // Stop audio when tab becomes hidden (bonus feature)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[RouteAudioController] Tab hidden, stopping all audio');
        stopAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopAll]);

  // This component doesn't render anything
  return null;
}

