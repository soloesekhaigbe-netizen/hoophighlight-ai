// Base44-native video analysis.
// Uses the built-in InvokeLLM integration with a vision-capable model to identify the
// target player (from reference photos + jersey + appearance notes) and detect
// basketball events with timestamps. No external service, no secrets, no API keys.

const VISION_MODEL = 'gemini_3_1_pro';

export function isAnalysisAvailable() {
  return true;
}

const CATEGORY_GUIDE = {
  buckets: 'made field goals: layups, dunks, putbacks, post scores, mid-range makes, three-point makes',
  rebounds: 'offensive rebounds and defensive rebounds by the target player',
  blocks: 'blocks, chase-down blocks, help-side blocks',
  shooting: 'three-point attempts/makes, mid-range attempts/makes, jump shots'
};

function buildPrompt(player) {
  const refNote = (player?.reference_photos?.length)
    ? `Reference photos of the target player are attached.`
    : `No reference photos were provided.`;
  return [
    'You are an expert basketball video analyst reviewing game footage.',
    'Identify ONE target player and detect only that player\'s events.',
    '',
    `Target player: name="${player?.name || 'unknown'}", jersey #${player?.jersey_number || '?'}, team="${player?.team || ''}", position="${player?.position || ''}".`,
    `Appearance notes: ${player?.appearance || 'none'}.`,
    refNote,
    'Use the jersey number, team uniform, body characteristics, position on court, and temporal consistency to identify the SAME player throughout. Do not rely on jersey number alone.',
    '',
    'Detect these event categories for the target player only:',
    `- buckets: ${CATEGORY_GUIDE.buckets}`,
    `- rebounds: ${CATEGORY_GUIDE.rebounds}`,
    `- blocks: ${CATEGORY_GUIDE.blocks}`,
    `- shooting: ${CATEGORY_GUIDE.shooting}`,
    '',
    'For each event, return the approximate start and end seconds (UTC timeline of the video), the event moment, a short description, and a confidence score 0-1.',
    'Prioritise PRECISION: only report events you are confident involve the target player. It is better to miss a play than to include a wrong player.',
    'If you cannot identify the target player with confidence, set player_identified=false and return an empty events array.',
    '',
    'Return JSON matching the provided schema.'
  ].join('\n');
}

const SCHEMA = {
  type: 'object',
  properties: {
    player_identified: { type: 'boolean' },
    identity_confidence: { type: 'number' },
    identity_note: { type: 'string' },
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['buckets', 'rebounds', 'blocks', 'shooting'] },
          play_type: { type: 'string' },
          start_seconds: { type: 'number' },
          end_seconds: { type: 'number' },
          event_seconds: { type: 'number' },
          confidence: { type: 'number' },
          description: { type: 'string' }
        },
        required: ['category', 'start_seconds', 'end_seconds']
      }
    }
  },
  required: ['player_identified', 'events']
};

export async function analyzeFootage(base44, { video_url, reference_photos, player }) {
  const file_urls = [video_url, ...(Array.isArray(reference_photos) ? reference_photos : [])].filter(Boolean);
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: buildPrompt(player),
    file_urls,
    model: VISION_MODEL,
    response_json_schema: SCHEMA
  });
  if (!result || typeof result !== 'object') return { player_identified: false, identity_confidence: 0, events: [] };
  return {
    player_identified: Boolean(result.player_identified),
    identity_confidence: Number(result.identity_confidence || 0),
    identity_note: result.identity_note || '',
    events: Array.isArray(result.events) ? result.events : []
  };
}

// ---------------------------------------------------------------------------
// YouTube analysis via public storyboard contact sheets.
//
// The vision model cannot read a YouTube URL directly (it only "recognises" the
// link from training, not the actual frames). YouTube, however, exposes public
// "storyboard" contact sheets: grid images of small frames taken ~2s apart that
// scrub the whole video. We extract those sheet URLs from the watch page, feed
// them (plus the player reference photos) to the vision model, and tell it the
// time range each sheet covers so it can locate events on the video timeline.
// No video download, no external service — only an HTTP fetch + InvokeLLM.
// ---------------------------------------------------------------------------

const MAX_SHEETS = 16;

function extractPlayerResponse(html) {
  const i = html.indexOf('ytInitialPlayerResponse');
  if (i < 0) return null;
  const eq = html.indexOf('=', i);
  let s = eq + 1;
  while (s < html.length && /\s/.test(html[s])) s++;
  if (html[s] !== '{') return null;
  let depth = 0, inStr = false, esc = false;
  for (let j = s; j < html.length; j++) {
    const c = html[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { try { return JSON.parse(html.slice(s, j + 1)); } catch (_e) { return null; } } }
    }
  }
  return null;
}

// Pick the storyboard level with the largest frame size (best for recognising
// jersey numbers / faces). Each level: [frameW, frameH, ?, cols, rows, ms, name, sigh].
function pickLevel(levels) {
  let best = null;
  levels.forEach((l, idx) => {
    const ms = Number(l[5] || 0);
    if (ms <= 0 || l[6] !== 'M$M') return;
    const fw = Number(l[0] || 0);
    if (!best || fw > best.fw) {
      best = { level: idx, cols: Number(l[3]), rows: Number(l[4]), ms, sigh: l[7], fw };
    }
  });
  return best;
}

function buildSheets(template, lvl, durationSec) {
  const framesPerSheet = lvl.cols * lvl.rows;
  const secPerSheet = (framesPerSheet * lvl.ms) / 1000;
  const total = Math.max(1, Math.ceil(durationSec / secPerSheet));
  const picks = [];
  if (total <= MAX_SHEETS) {
    for (let i = 0; i < total; i++) picks.push(i);
  } else {
    const stride = total / MAX_SHEETS;
    for (let k = 0; k < MAX_SHEETS; k++) picks.push(Math.floor(k * stride));
  }
  return picks.map((i) => ({
    index: i,
    start: i * secPerSheet,
    end: (i + 1) * secPerSheet,
    url: template.replace('$L', String(lvl.level)).replace('$N', 'M' + i) + '&sigh=' + lvl.sigh
  }));
}

// Refinement pass: the detection level uses the largest frames (best for identifying
// the player) but they are spaced ~10s apart, so a clip's start can be off by ~10s.
// YouTube also publishes denser storyboard levels (~2s apart). After a play is found
// coarsely, we fetch the dense sheet covering that moment and ask the model to point
// at the exact frame — tightening the clip to the real moment of the play.
function pickFinestLevel(levels) {
  let best = null;
  levels.forEach((l, idx) => {
    const ms = Number(l[5] || 0);
    if (ms <= 0 || l[6] !== 'M$M') return;
    if (!best || ms < best.ms) best = { level: idx, cols: Number(l[3]), rows: Number(l[4]), ms, sigh: l[7] };
  });
  return best;
}

function sheetForTime(template, lvl, t) {
  const framesPerSheet = lvl.cols * lvl.rows;
  const secPerSheet = (framesPerSheet * lvl.ms) / 1000;
  const idx = Math.max(0, Math.floor(t / secPerSheet));
  return {
    index: idx, start: idx * secPerSheet, end: (idx + 1) * secPerSheet,
    step: lvl.ms / 1000, cols: lvl.cols, rows: lvl.rows,
    url: template.replace('$L', String(lvl.level)).replace('$N', 'M' + idx) + '&sigh=' + lvl.sigh
  };
}

const REFINE_SCHEMA = {
  type: 'object',
  properties: {
    frame_index: { type: 'number' },
    exact_second: { type: 'number' },
    confidence: { type: 'number' }
  },
  required: ['exact_second']
};

async function refineEvent(base44, template, finest, ev) {
  const coarseT = Number(ev.event_seconds || ev.start_seconds || 0);
  if (!Number.isFinite(coarseT)) return null;
  const sheet = sheetForTime(template, finest, coarseT);
  const prompt = [
    'You are timing ONE basketball play precisely. The image is a single storyboard contact sheet from a basketball video.',
    'It is a ' + sheet.cols + 'x' + sheet.rows + ' grid of frames, ' + sheet.step + 's apart in reading order (left to right, top to bottom), covering ' + Math.round(sheet.start) + 's to ' + Math.round(sheet.end) + 's of the video.',
    'Locate this play: "' + (ev.description || ev.category) + '" (category: ' + ev.category + ').',
    'Find the frame that best captures the MOMENT of the play — the ball entering the hoop, the dunk, the shot release, the block, or the rebound grab.',
    'Return JSON: {frame_index (0-based position in reading order), exact_second (sheet start + frame_index x ' + sheet.step + '), confidence (0-1)}.',
    'If this play is not visible in the sheet, return {frame_index: -1, exact_second: ' + coarseT + ', confidence: 0}.'
  ].join('\n');
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt, file_urls: [sheet.url], model: VISION_MODEL, response_json_schema: REFINE_SCHEMA
    });
    if (res && typeof res.exact_second === 'number' && Number(res.frame_index) >= 0) {
      return { event: Math.max(0, Number(res.exact_second)) };
    }
  } catch (_e) {}
  return null;
}

// YouTube rate-limits / bot-blocks datacenter IPs on the watch page (HTTP 429).
// Send a realistic browser fingerprint + consent cookies and retry with backoff so
// a soft rate limit can clear. This is the only endpoint that returns the storyboard
// spec (the player API responds LOGIN_REQUIRED/UNPLAYABLE for server requests).
async function fetchWatchPage(videoId) {
  const url = 'https://www.youtube.com/watch?v=' + videoId + '&hl=en&gl=US&has_verified=1&bpctr=9999999999';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cookie': 'CONSENT=PENDING+354; GPS=1; PREF=f4=4000000; VISITOR_INFO1_LIVE=a'
  };
  let last = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((res) => setTimeout(res, 3000 * attempt));
    try {
      const r = await fetch(url, { headers });
      if (r.ok) return r;
      last = r.status;
      if (r.status === 429 || r.status === 503) continue;
      return r;
    } catch (_e) {}
  }
  return { ok: false, status: last || 0, text: async () => '' };
}

export async function analyzeYouTubeFootage(base44, { videoId, reference_photos, player }) {
  const r = await fetchWatchPage(videoId);
  if (!r.ok) throw new Error('YouTube rate-limited the server (HTTP ' + r.status + '). Please retry in a minute, or upload the video file for direct analysis.');
  const html = await r.text();
  const pr = extractPlayerResponse(html);
  if (!pr) throw new Error('Could not read YouTube player data — the video may be private or restricted.');
  const durationSec = Number(pr.videoDetails?.lengthSeconds || 0);
  const spec = pr.storyboards?.playerStoryboardSpecRenderer?.spec;
  if (!spec) throw new Error('No storyboard frames are available for this video.');
  const parts = spec.split('|');
  const template = parts[0];
  const lvl = pickLevel(parts.slice(1).filter(Boolean).map((l) => l.split('#')));
  if (!lvl) throw new Error('No timed storyboard frames are available for this video.');
  const sheets = buildSheets(template, lvl, durationSec);
  const step = lvl.ms / 1000;

  const frameDesc = 'Each image below is a contact sheet: a ' + lvl.cols + 'x' + lvl.rows +
    ' grid of small video frames, ' + step + 's apart in reading order (left to right, top to bottom).';
  const sheetDesc = sheets.map((s, i) =>
    'Image ' + (i + 1) + ': sheet #' + s.index + ', covers ' + Math.round(s.start) + 's to ' + Math.round(s.end) + 's.'
  ).join('\n');

  const prompt = [
    'You are an expert basketball video analyst. The images provided are STORYBOARD CONTACT SHEETS sampled from ONE YouTube basketball video. They are not one photo — each image is a grid of sequential frames from the game.',
    frameDesc,
    sheetDesc,
    '',
    'Target player: name="' + (player?.name || 'unknown') + '", jersey #' + (player?.jersey_number || '?') + ', team="' + (player?.team || '') + '", position="' + (player?.position || '') + '".',
    'Appearance notes: ' + (player?.appearance || 'none') + '.',
    (player?.reference_photos?.length ? 'Reference photos of the target player are attached AFTER the contact sheets.' : 'No reference photos were provided.'),
    '',
    'Identify ONLY the target player using jersey number, uniform colour, body type, and court position. Do not rely on jersey number alone.',
    'Detect these event categories for the target player only:',
    '- buckets: ' + CATEGORY_GUIDE.buckets,
    '- rebounds: ' + CATEGORY_GUIDE.rebounds,
    '- blocks: ' + CATEGORY_GUIDE.blocks,
    '- shooting: ' + CATEGORY_GUIDE.shooting,
    '',
    'For each event, estimate start_seconds and end_seconds on the video timeline: take the sheet that contains the frame, add (frame position in reading order x ' + step + 's) to that sheet start. Give a one-line description and confidence 0-1.',
    'Detect ALL notable basketball events you can see in these frames — made baskets, dunks, three-pointers, rebounds, and blocks — even if you cannot confirm the player is the target. The player will review and confirm each clip, so return every event you spot rather than none.',
    'For each event, note in the description whether the player appears to match the target (jersey number / uniform colour). Set player_identified=true only if you are confident you can recognise the target player; otherwise set it false — but still return the events you detected.',
    'Return JSON matching the provided schema.'
  ].join('\n');

  const file_urls = [...sheets.map((s) => s.url), ...(Array.isArray(reference_photos) ? reference_photos : [])].filter(Boolean);
  const result = await base44.integrations.Core.InvokeLLM({
    prompt, file_urls, model: VISION_MODEL, response_json_schema: SCHEMA
  });
  if (!result || typeof result !== 'object') return { player_identified: false, identity_confidence: 0, events: [] };

  const events = Array.isArray(result.events) ? result.events : [];
  // Refine each detected play's timestamp using the densest storyboard level
  // (only if it is finer than the detection level).
  // Refine each play's timestamp, then set a generous window around it. Storyboard
  // frames are ~10s apart, so a tight clip can miss the moment entirely — an 18s
  // window centered on the estimate reliably contains the play with a little lead-in.
  // Only trust a refinement that stays near the coarse estimate; a big jump means the
  // model found a different, similar play, so we keep the original detection.
  const refineLvl = pickFinestLevel(parts.slice(1).filter(Boolean).map((l) => l.split('#'))) || lvl;
  for (const ev of events.slice(0, 10)) {
    const coarseT = Number(ev.event_seconds || ev.start_seconds || 0);
    let center = coarseT;
    try {
      const refined = await refineEvent(base44, template, refineLvl, ev);
      if (refined && Math.abs(refined.event - coarseT) <= 15) center = refined.event;
    } catch (_e) {}
    ev.event_seconds = center;
    ev.start_seconds = Math.max(0, center - 10);
    ev.end_seconds = center + 8;
  }
  return {
    player_identified: Boolean(result.player_identified),
    identity_confidence: Number(result.identity_confidence || 0),
    identity_note: result.identity_note || '',
    events
  };
}