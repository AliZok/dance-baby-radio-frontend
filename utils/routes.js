/**
 * True for the main player (`/`) and `/play/...` pages.
 * Intentionally excludes `/playlists` (and similar) which also start with `/play`.
 */
export function isPlayerRoutePath(path = '') {
  return path === '/' || path === '/play' || path.startsWith('/play/')
}

/**
 * Routes where PlayerMain stays mounted (UI hidden) so audio does not tear down.
 * Only applies after the player was already opened — never forces player onto cold loads.
 */
export function isPlayerKeepAlivePath(path = '') {
  return path === '/login' || path === '/register' || path === '/playlists'
}
