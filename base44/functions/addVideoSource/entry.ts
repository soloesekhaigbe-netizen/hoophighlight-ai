import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { parseVideoUrl } from '../../shared/videoSources.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { project_id, game_id, urls } = body || {};
    if (!project_id) return Response.json({ error: 'Missing project' }, { status: 400 });

    const list = Array.isArray(urls) ? urls : [urls];
    const created = [];
    const rejected = [];

    for (const raw of list) {
      const parsed = parseVideoUrl(raw);
      if (!parsed.ok) {
        rejected.push({ url: raw, error: parsed.error });
        continue;
      }
      const source = await base44.entities.VideoSource.create({
        project_id,
        game_id: game_id || '',
        url: (raw || '').trim(),
        source_type: parsed.source_type,
        external_id: parsed.external_id,
        status: 'queued',
        progress: 0
      });
      created.push(source);
    }

    return Response.json({ created, rejected });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}