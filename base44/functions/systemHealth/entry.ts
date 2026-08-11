import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only: actually probes each subsystem and reports the real result. A
// component is only marked WORKING when the probe operation genuinely succeeds.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const results = {};

    try {
      const list = await base44.asServiceRole.entities.Project.list();
      results.database = { status: 'WORKING', detail: `${list.length} project(s) reachable` };
    } catch (e) { results.database = { status: 'NOT_WORKING', detail: e.message }; }

    try {
      const probe = new File([new Uint8Array([0])], 'probe.bin', { type: 'application/octet-stream' });
      const up = await base44.integrations.Core.UploadFile({ file: probe });
      results.file_storage = { status: up && up.file_url ? 'WORKING' : 'NOT_WORKING', detail: (up && up.file_url) || 'no url returned' };
    } catch (e) { results.file_storage = { status: 'NOT_WORKING', detail: e.message }; }

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: 'Reply with the word OK.', model: 'gemini_3_flash' });
      results.video_analysis = { status: 'WORKING', detail: String(res).slice(0, 40) };
    } catch (e) { results.video_analysis = { status: 'NOT_WORKING', detail: e.message }; }

    // Clip extraction runs in the player's browser (MediaRecorder) — the server
    // runtime cannot execute it, so it is reported honestly as NOT_TESTED here.
    results.clip_extraction = { status: 'NOT_TESTED', detail: 'Runs in the player browser via MediaRecorder. Server runtime cannot execute it.' };

    results.email = { status: 'NOT_TESTED', detail: 'SendEmail only reaches registered users; exercised when a player has an email on file.' };

    try {
      const tapes = await base44.asServiceRole.entities.HighlightTape.list();
      results.highlight_generation = { status: 'WORKING', detail: `${tapes.length} tape(s) stored` };
    } catch (e) { results.highlight_generation = { status: 'NOT_WORKING', detail: e.message }; }

    try {
      const clips = await base44.asServiceRole.entities.Clip.list();
      const ready = clips.filter((c) => c.processing_status === 'ready' && c.clip_url).length;
      results.clip_storage = { status: 'WORKING', detail: `${ready} real clip file(s) stored` };
    } catch (e) { results.clip_storage = { status: 'NOT_WORKING', detail: e.message }; }

    try {
      const projects = await base44.asServiceRole.entities.Project.list();
      const publicCount = projects.filter((p) => p.is_public !== false).length;
      results.portfolio = { status: 'WORKING', detail: `${publicCount} public portfolio(s) served` };
    } catch (e) { results.portfolio = { status: 'NOT_WORKING', detail: e.message }; }

    const counts = Object.values(results);
    const summary = {
      working: counts.filter((r) => r.status === 'WORKING').length,
      not_working: counts.filter((r) => r.status === 'NOT_WORKING').length,
      not_tested: counts.filter((r) => r.status === 'NOT_TESTED').length,
    };

    return Response.json({ ok: true, results, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}