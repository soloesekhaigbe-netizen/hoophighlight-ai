import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { notifyPlayer } from '../../shared/emailProvider.ts';

const CAT_LABEL = { buckets: 'BUCKETS', rebounds: 'REBOUNDS', blocks: 'BLOCKS', shooting: 'SHOOTING' };

// Generates (or refreshes) the four highlight tapes — one per category — from the
// player's accepted clips. Tapes use "playlist" export mode: a real, playable
// experience that plays each approved clip's segment back-to-back from the real
// uploaded footage (no external render needed). The player is notified when ready.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { project_id, categories } = (await req.json()) || {};
    if (!project_id) return Response.json({ error: 'Missing project_id' }, { status: 400 });

    const project = await base44.entities.Project.get(project_id);
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

    const [allClips, sources] = await Promise.all([
      base44.entities.Clip.filter({ project_id }),
      base44.entities.VideoSource.filter({ project_id })
    ]);
    const linkSrcIds = new Set(sources.filter((s) => s.source_type === 'youtube' || s.source_type === 'veo').map((s) => s.id));
    const accepted = allClips.filter((c) => c.status === 'accepted' && c.processing_status === 'ready' && (c.clip_url || linkSrcIds.has(c.video_source_id)));
    const cats = categories && categories.length ? categories : ['buckets', 'rebounds', 'blocks', 'shooting'];

    const ready = [];
    for (const cat of cats) {
      const clips = accepted.filter((c) => c.category === cat).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      const clip_ids = clips.map((c) => c.id);
      const duration = clips.reduce((s, c) => s + Math.max(1, (c.end_seconds || 0) - (c.start_seconds || 0)), 0);
      const title = `${project.player_name || 'Player'} — ${CAT_LABEL[cat] || cat.toUpperCase()}`;
      const existing = (await base44.entities.HighlightTape.filter({ project_id, category: cat }))[0];
      if (existing) {
        await base44.entities.HighlightTape.update(existing.id, {
          title, clip_ids, clip_count: clip_ids.length, duration_seconds: duration,
          status: 'ready', export_mode: 'playlist', error_message: '', video_url: ''
        });
        ready.push(existing.id);
      } else if (clip_ids.length) {
        const tape = await base44.entities.HighlightTape.create({
          project_id, category: cat, title, clip_ids, clip_count: clip_ids.length,
          duration_seconds: duration, status: 'ready', export_mode: 'playlist'
        });
        ready.push(tape.id);
      }
    }

    if (project.email && ready.length) {
      await notifyPlayer(base44, project.email, 'Your highlight tapes are ready',
        `Hi ${project.player_name},\n\n${ready.length} highlight tape(s) have been generated and added to your recruiting portfolio.\n\nShare your portfolio link with coaches from your dashboard.`);
    }

    return Response.json({ ok: true, tapes: ready.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}