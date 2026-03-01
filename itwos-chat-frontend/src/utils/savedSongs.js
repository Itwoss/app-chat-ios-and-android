import { getApiUrl } from './apiUrl';
import { getAuthToken } from './auth';

const STORAGE_KEY = 'savedSongs';

/**
 * Normalize a track/sound to stored shape (video_id, title, artist, thumbnail, preview_url, source).
 * @param {Object} track - From search or post.sound
 * @returns {Object}
 */
export function normalizeSound(track) {
  const id = track.id ?? track.video_id;
  if (!id) return null;
  return {
    id,
    video_id: id,
    title: track.title ?? '',
    artist: track.artist ?? '',
    thumbnail: track.thumbnail ?? null,
    preview_url: track.preview_url ?? (id ? `https://www.youtube.com/embed/${id}` : null),
    source: track.source ?? 'youtube',
    startTime: track.startTime ?? 0,
    endTime: track.endTime ?? null,
  };
}

function getBaseUrl() {
  const base = getApiUrl();
  return base ? base.replace(/\/$/, '') : '';
}

/**
 * Get saved songs. Uses API when user is logged in, otherwise localStorage.
 * @returns {Promise<Array>}
 */
export async function getSavedSongs() {
  const token = getAuthToken();
  if (token) {
    try {
      const base = getBaseUrl();
      const url = base ? `${base}/api/music/saved` : '/api/music/saved';
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) return data.data;
      return [];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Save a song. Uses API when logged in, otherwise localStorage.
 * @param {Object} track
 * @returns {Promise<void>}
 */
export async function saveSong(track) {
  const sound = normalizeSound(track);
  if (!sound) return;
  const token = getAuthToken();
  if (token) {
    try {
      const base = getBaseUrl();
      const url = base ? `${base}/api/music/saved` : '/api/music/saved';
      await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: sound.id,
          video_id: sound.video_id,
          title: sound.title,
          artist: sound.artist,
          thumbnail: sound.thumbnail,
          preview_url: sound.preview_url,
          source: sound.source,
          startTime: sound.startTime,
          endTime: sound.endTime,
        }),
      });
    } catch (_) {}
    return;
  }
  const list = await getSavedSongs();
  if (list.some((s) => (s.id || s.video_id) === sound.id)) return;
  list.unshift(sound);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

/**
 * Unsave a song by video_id. Uses API when logged in, otherwise localStorage.
 * @param {string} videoId
 * @returns {Promise<void>}
 */
export async function unsaveSong(videoId) {
  const token = getAuthToken();
  if (token) {
    try {
      const base = getBaseUrl();
      const url = base ? `${base}/api/music/saved/${encodeURIComponent(videoId)}` : `/api/music/saved/${encodeURIComponent(videoId)}`;
      await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {}
    return;
  }
  const list = (await getSavedSongs()).filter((s) => (s.id || s.video_id) !== videoId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

/**
 * Check if a song is saved. Prefer using the list from getSavedSongs() in components
 * (e.g. savedSongs.some(s => (s.id || s.video_id) === videoId)) so UI stays in sync.
 * This helper is for one-off checks when you don't have the list (e.g. after opening sheet).
 * @param {string} videoId
 * @returns {Promise<boolean>}
 */
export async function isSongSavedAsync(videoId) {
  const list = await getSavedSongs();
  return list.some((s) => (s.id || s.video_id) === videoId);
}
