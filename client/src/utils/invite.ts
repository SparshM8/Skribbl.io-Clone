/**
 * Robust helper to extract a room code from query params or URL hash.
 * Handles formats like:
 * - /?room=EM9NF
 * - /?room=#EM9NF
 * - /#EM9NF
 * - /#room=EM9NF
 * - /#EM9NF
 */
export function extractInviteRoomCode(): string | null {
  try {
    // 1. Check query parameter ?room=XYZ
    const params = new URLSearchParams(window.location.search);
    const qRoom = params.get('room');
    if (qRoom) {
      const clean = qRoom.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (clean.length >= 4 && clean.length <= 8) return clean;
    }

    // 2. Check hash fragment
    const hash = window.location.hash || '';
    if (hash) {
      const trimmedHash = hash.replace(/^#\/?/, '');
      const hashParams = new URLSearchParams(trimmedHash);
      const hRoom = hashParams.get('room');
      if (hRoom) {
        const clean = hRoom.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (clean.length >= 4 && clean.length <= 8) return clean;
      }

      // Bare hash like #EM9NF
      const bareClean = trimmedHash.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (bareClean.length >= 4 && bareClean.length <= 8) {
        return bareClean;
      }
    }
  } catch {}
  return null;
}
