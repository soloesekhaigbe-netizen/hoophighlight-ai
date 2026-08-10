import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getProviderConfig } from '../../shared/processingProvider.ts';

// Callback endpoint for the external video processing service.
// Expects { secret, job_ref, status, progress, message, clips: [...], video_url }
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = (await req.json()) || {};
    const config = getProviderConfig();

    if (!config.webhookSecret || body.secret !== config.webhookSecret) {
      return Response.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    const job = await base44.asServiceRole.entities.ProcessingJob.get(body.job_ref);
    if (!job) return Response.json({ error: 'Unknown job' }, { status: 404 });

    const status = body.status || 'running';
    const progress = typeof body.progress === 'number' ? body.progress : job.progress;

    await base44.asServiceRole.entities.ProcessingJob.update(job.id, {
      status: status === 'failed' ? 'failed' : status === 'succeeded' ? 'succeeded' : 'running',
      progress,
      message: body.message || job.message
    });

    if (job.job_type === 'render' && job.tape_id) {
      await base44.asServiceRole.entities.HighlightTape.update(job.tape_id, {
        status: status === 'failed' ? 'error' : status === 'succeeded' ? 'ready' : 'rendering',
        video_url: body.video_url || '',
        export_mode: body.video_url ? 'rendered' : 'playlist',
        error_message: status === 'failed' ? (body.message || 'Render failed') : ''
      });
      return Response.json({ ok: true });
    }

    if (job.video_source_id) {
      if (status === 'failed') {
        await base44.asServiceRole.entities.VideoSource.update(job.video_source_id, {
          status: 'error', error_message: body.message || 'Processing failed', progress: 0
        });
        return Response.json({ ok: true });
      }

      const clips = Array.isArray(body.clips) ? body.clips : [];
      if (clips.length) {
        const source = await base44.asServiceRole.entities.VideoSource.get(job.video_source_id);
        const rows = clips.map((c, i) => ({
          project_id: job.project_id,
          game_id: source ? source.game_id : '',
          video_source_id: job.video_source_id,
          category: c.category,
          play_type: c.play_type || '',
          description: c.description || '',
          event_seconds: c.event_seconds || 0,
          start_seconds: typeof c.start_seconds === 'number' ? c.start_seconds : Math.max(0, (c.event_seconds || 0) - 4),
          end_seconds: typeof c.end_seconds === 'number' ? c.end_seconds : (c.event_seconds || 0) + 3,
          confidence: Math.round(c.confidence || 0),
          status: 'pending',
          order_index: i,
          detection_source: 'external'
        }));
        await base44.asServiceRole.entities.Clip.bulkCreate(rows);
      }

      const statusMap = {
        downloading: 'downloading', processing: 'processing', analysing: 'analysing',
        detecting_plays: 'detecting_plays', creating_clips: 'creating_clips'
      };
      await base44.asServiceRole.entities.VideoSource.update(job.video_source_id, {
        status: status === 'succeeded' ? 'ready' : (statusMap[body.stage] || 'processing'),
        progress: status === 'succeeded' ? 100 : progress,
        clips_detected: clips.length || undefined
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}