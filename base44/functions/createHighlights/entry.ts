import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getProviderConfig, requestRender } from '../../shared/processingProvider.ts';
import { CATEGORIES } from '../../shared/videoSources.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id, categories } = (await req.json()) || {};
    if (!project_id) return Response.json({ error: 'Missing project' }, { status: 400 });

    const project = await base44.entities.Project.get(project_id);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    const wanted = Array.isArray(categories) && categories.length ? categories : CATEGORIES;
    const allClips = await base44.entities.Clip.filter({ project_id, status: 'accepted' });
    const existing = await base44.entities.HighlightTape.filter({ project_id });
    const config = getProviderConfig();
    const results = [];

    for (const category of wanted) {
      const clips = allClips
        .filter((c) => c.category === category)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      const duration = clips.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);
      const title = `${project.player_name} — ${category.toUpperCase()}`;
      const prev = existing.find((t) => t.category === category);

      const base = {
        project_id, category, title,
        clip_ids: clips.map((c) => c.id),
        clip_count: clips.length,
        duration_seconds: Math.round(duration),
        status: clips.length ? 'ready' : 'draft',
        export_mode: 'playlist',
        video_url: '',
        error_message: clips.length ? '' : 'No accepted clips in this category yet.'
      };

      let tape = prev
        ? await base44.entities.HighlightTape.update(prev.id, base)
        : await base44.entities.HighlightTape.create(base);
      tape = tape || { ...base, id: prev ? prev.id : undefined };

      if (clips.length && config.configured) {
        const job = await base44.entities.ProcessingJob.create({
          project_id, tape_id: tape.id, job_type: 'render', provider: 'external',
          status: 'queued', message: 'Render requested', progress: 0
        });
        try {
          const sources = await base44.entities.VideoSource.filter({ project_id });
          const payload = {
            job_ref: job.id,
            title,
            intro: project.intro_enabled ? {
              player_name: project.player_name, jersey_number: project.jersey_number,
              team: project.team_name, season: project.season, position: project.position, height: project.height
            } : null,
            outro: project.outro_enabled ? { text: project.outro_text || project.player_name } : null,
            clips: clips.map((c) => {
              const s = sources.find((v) => v.id === c.video_source_id);
              return { url: s ? s.url : '', start: c.start_seconds, end: c.end_seconds, label: c.description || '' };
            })
          };
          const result = await requestRender(config, payload);
          await base44.entities.ProcessingJob.update(job.id, { status: 'running', provider_job_id: result.job_id || '' });
          await base44.entities.HighlightTape.update(tape.id, { status: 'rendering', provider_job_id: result.job_id || '' });
        } catch (err) {
          await base44.entities.ProcessingJob.update(job.id, { status: 'failed', message: err.message });
          await base44.entities.HighlightTape.update(tape.id, {
            status: 'ready', export_mode: 'playlist',
            error_message: 'Video rendering failed (' + err.message + '). The tape is still playable in the app.'
          });
        }
      }

      results.push({ category, clips: clips.length });
    }

    return Response.json({ ok: true, rendered: config.configured, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}