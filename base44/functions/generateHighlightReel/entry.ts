import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CAT_LABEL = { buckets: 'BUCKETS', rebounds: 'REBOUNDS', blocks: 'BLOCKS', shooting: 'SHOOTING', mix: 'MIX' };

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) || {};
    const { project_id, game_ids, clip_ids: manualClipIds, settings = {} } = body;
    if (!project_id) return Response.json({ error: 'Missing project_id' }, { status: 400 });

    const project = await base44.entities.Project.get(project_id);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    const [allClips, sources, games] = await Promise.all([
      base44.entities.Clip.filter({ project_id }),
      base44.entities.VideoSource.filter({ project_id }),
      base44.entities.Game.filter({ project_id })
    ]);
    const linkSrcIds = new Set(sources.filter((s) => s.source_type === 'youtube' || s.source_type === 'veo').map((s) => s.id));
    let accepted = allClips.filter((c) => c.status === 'accepted' && c.processing_status === 'ready' && (c.clip_url || linkSrcIds.has(c.video_source_id)));
    if (game_ids && game_ids.length) accepted = accepted.filter((c) => game_ids.includes(c.game_id));
    if (manualClipIds && manualClipIds.length) accepted = accepted.filter((c) => manualClipIds.includes(c.id));

    if (!accepted.length) return Response.json({ error: 'No accepted clips found for the selected games.' }, { status: 400 });

    const gameName = (gid) => (games.find((g) => g.id === gid) || {}).name || 'Game';
    const candidates = accepted.map((c) => ({
      id: c.id,
      cat: CAT_LABEL[c.category] || c.category,
      play: c.play_type || c.description || c.category,
      game: gameName(c.game_id),
      dur: Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0))
    }));

    const target = settings.reel_length || '60 seconds';
    const styleHint = settings.style || 'Professional Recruiting';
    const includes = settings.include_fields || {};

    const includeLine = [];
    if (includes.player_name) includeLine.push(`player name: ${project.player_name || ''}`);
    if (includes.position) includeLine.push(`position: ${project.position || ''}`);
    if (includes.jersey_number) includeLine.push(`jersey: ${project.jersey_number || ''}`);
    if (includes.team_name) includeLine.push(`team: ${project.team_name || ''}`);
    if (includes.opponent) includeLine.push('opponent on clip labels');
    if (includes.game_date) includeLine.push('game date on clip labels');

    const prompt = `You are an expert basketball highlight reel editor for a recruiting platform. Rank and sequence the following clips into one professional recruiting highlight reel.

Player: ${project.player_name || ''} — ${project.position || ''} — ${project.team_name || ''}${project.jersey_number ? ' #' + project.jersey_number : ''}
${includeLine.length ? 'Include on intro: ' + includeLine.join(', ') : ''}

Clips (JSON):
${JSON.stringify(candidates)}

Target reel length: ${target}
Style: ${styleHint}

Rules:
- Give each clip a highlight_score (0-100) for recruiting value: dunks, blocks, and-one, athletic plays rank highest; routine plays lower.
- Produce "sequence" — an ordered list of clip ids — that: opens with a strong play, ALTERNATES play types so similar plays are never consecutive, and places the single strongest clip near the end. Keep total duration within the target length.
- intro_text: one short professional intro line (player, position, team, "2026 HIGHLIGHTS").
- outro_text: one short closing line.

Return JSON matching the schema only.`;

    const llm = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          ranked: { type: 'array', items: { type: 'object', properties: {
            clip_id: { type: 'string' }, highlight_score: { type: 'number' }
          } } },
          sequence: { type: 'array', items: { type: 'string' } },
          intro_text: { type: 'string' },
          outro_text: { type: 'string' }
        }
      }
    });

    const ranked = (llm && Array.isArray(llm.ranked)) ? llm.ranked : [];
    const sequence = (llm && Array.isArray(llm.sequence) && llm.sequence.length) ? llm.sequence : accepted.map((c) => c.id);
    const introText = (llm && llm.intro_text) || `${project.player_name || ''} · ${project.position || ''} · ${project.team_name || ''} 2026 HIGHLIGHTS`;
    const outroText = (llm && llm.outro_text) || (project.player_name || 'Player');

    const byId = new Map(accepted.map((c) => [c.id, c]));
    const seen = new Set();
    const ordered = [];
    for (const id of sequence) { if (byId.has(id) && !seen.has(id)) { seen.add(id); ordered.push(byId.get(id)); } }
    for (const c of accepted) { if (!seen.has(c.id)) { seen.add(c.id); ordered.push(c); } }

    const targetSec = parseLen(target);
    let total = 0;
    const finalClips = [];
    for (const c of ordered) {
      const d = Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0));
      if (targetSec && total + d > targetSec + 6 && finalClips.length) break;
      total += d; finalClips.push(c);
    }

    const clip_ids = finalClips.map((c) => c.id);
    const duration = finalClips.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);

    const scoreMap = new Map(ranked.map((r) => [r.clip_id, r.highlight_score]));
    if (scoreMap.size) {
      const updates = accepted.filter((c) => scoreMap.has(c.id)).map((c) => ({ id: c.id, highlight_score: scoreMap.get(c.id) }));
      if (updates.length) { try { await base44.entities.Clip.bulkUpdate(updates); } catch (_) {} }
    }

    const tape = await base44.entities.HighlightTape.create({
      project_id,
      category: 'mix',
      title: `${project.player_name || 'Player'} — Highlight Reel`,
      clip_ids, clip_count: clip_ids.length, duration_seconds: duration,
      status: 'ready', export_mode: 'playlist',
      game_ids: (game_ids && game_ids.length) ? game_ids : games.map((g) => g.id),
      version_label: '', reel_length: target,
      selection_mode: settings.selection_mode || 'best', style: styleHint,
      include_fields: includes, intro_text: introText, outro_text: outroText,
      is_featured: false
    });

    return Response.json({ ok: true, tape_id: tape.id, clip_count: clip_ids.length, duration, intro_text: introText, outro_text: outroText });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function parseLen(s) {
  if (!s) return 0;
  if (String(s) === 'custom') return 0;
  const m = String(s).match(/(\d+)\s*(second|sec|minute|min)/i);
  if (!m) return 0;
  const n = Number(m[1]);
  return /min/i.test(m[2]) ? n * 60 : n;
}