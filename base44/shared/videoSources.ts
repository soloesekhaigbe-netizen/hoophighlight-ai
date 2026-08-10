// Parsing + validation of supported video source URLs.
// Keep provider-agnostic: only recognises the URL, never bypasses access controls.

export function parseVideoUrl(rawUrl) {
  const url = (rawUrl || '').trim();
  if (!url) return { ok: false, error: 'Please enter a video link.' };

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_e) {
    return { ok: false, error: 'That does not look like a valid link. Include https:// at the start.' };
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  if (host.endsWith('youtube.com') || host === 'youtu.be' || host.endsWith('youtube-nocookie.com')) {
    let id = '';
    if (host === 'youtu.be') id = parsed.pathname.slice(1);
    else if (parsed.searchParams.get('v')) id = parsed.searchParams.get('v');
    else {
      const m = parsed.pathname.match(/\/(embed|shorts|live|v)\/([A-Za-z0-9_-]{6,})/);
      if (m) id = m[2];
    }
    if (!id) return { ok: false, error: 'Could not find a YouTube video id in that link.' };
    return { ok: true, source_type: 'youtube', external_id: id };
  }

  if (host.endsWith('veo.co') || host.includes('veo')) {
    const m = parsed.pathname.match(/\/matches\/([^/?#]+)/);
    return { ok: true, source_type: 'veo', external_id: m ? m[1] : parsed.pathname };
  }

  return {
    ok: false,
    error: 'Only Veo and YouTube links are supported right now. Paste a public Veo match link or a YouTube link you are authorised to use.'
  };
}

export const CATEGORIES = ['buckets', 'rebounds', 'blocks', 'shooting'];