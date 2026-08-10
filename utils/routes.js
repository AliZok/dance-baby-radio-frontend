/**
 * True for the main player (`/`) and `/play/...` pages.
 * Intentionally excludes `/playlists` (and similar) which also start with `/play`.
 */
export function isPlayerRoutePath(path = '') {
  return path === '/' || path === '/play' || path.startsWith('/play/')
}
