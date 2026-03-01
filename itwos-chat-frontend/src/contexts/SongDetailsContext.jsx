import { createContext, useContext, useState, useCallback } from 'react';

const SongDetailsContext = createContext({
  sound: null,
  openSongDetails: () => {},
  closeSongDetails: () => {},
});

export function SongDetailsProvider({ children }) {
  const [sound, setSound] = useState(null);

  const openSongDetails = useCallback((s) => {
    setSound(s ? { ...s, video_id: s.video_id ?? s.id, id: s.id ?? s.video_id } : null);
  }, []);

  const closeSongDetails = useCallback(() => {
    setSound(null);
  }, []);

  return (
    <SongDetailsContext.Provider value={{ sound, openSongDetails, closeSongDetails }}>
      {children}
    </SongDetailsContext.Provider>
  );
}

export function useSongDetails() {
  const ctx = useContext(SongDetailsContext);
  return ctx || { sound: null, openSongDetails: () => {}, closeSongDetails: () => {} };
}
