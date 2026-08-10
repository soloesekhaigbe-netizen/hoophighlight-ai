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

  // Direct, downloadable video file — the only source we can truly extract a segment from
  // without an external processing service (the browser plays just the requested range).
  if (/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(parsed.pathname)) {
    return { ok: true, source_type: 'file', external_id: '' };
  }

  return {
    ok: false,
    error: 'Only Veo, YouTube or a direct video file link (.mp4 / .webm) are supported right now. For true clip extraction, upload the footage or paste a direct file link.'
  };
}

export const CATEGORIES = ['buckets', 'rebounds', 'blocks', 'shooting'];

// Context window (seconds before / after the event) per category, so each clip shows the
// full sequence of the play — not just the moment the ball goes through the hoop.
export const CATEGORY_CONTEXT = {
  buckets: { pre: 6, post: 4 },
  rebounds: { pre: 5, post: 3 },
  blocks: { pre: 5, post: 4 },
  shooting: { pre: 5, post: 4 }
};

export function contextFor(category) {
  return CATEGORY_CONTEXT[category] || { pre: 5, post: 3 };
}

export const UNPROCESSABLE_MESSAGE =
  'This video cannot currently be processed. Please provide a video source that the processing service is authorised to access — upload the footage file directly, or connect an authorised video processing provider.';