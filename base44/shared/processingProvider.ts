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