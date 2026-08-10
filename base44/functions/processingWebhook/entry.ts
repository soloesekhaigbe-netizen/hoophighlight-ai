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

    // Single-clip extraction callback — update the specific clip.
    if (job.job_type === 'render' && body.clip_id) {
      const clipStatus = status === 'failed' ? 'failed' : status === 'succeeded' ? 'ready' : 'extracting';
      await base44.asServiceRole.entities.Clip.update(body.clip_id, {
        processing_status: clipStatus,
        clip_url: body.video_url || '',
        thumbnail_url: body.thumbnail_url || '',
        extraction_error: status === 'failed' ? (body.message || 'Extraction failed') : ''
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
        const rows = clips.map((c, i) => {
          const playConf = Math.round(c.play_confidence || c.confidence || 0);
          const idConf = Math.round(c.identity_confidence || playConf);
          return {
            project_id: job.project_id,
            game_id: source ? source.game_id : '',
            video_source_id: job.video_source_id,
            category: c.category,
            play_type: c.play_type || '',
            description: c.description || '',
            event_seconds: c.event_seconds || 0,
            start_seconds: typeof c.start_seconds === 'number' ? c.start_seconds : Math.max(0, (c.event_seconds || 0) - 4),
            end_seconds: typeof c.end_seconds === 'number' ? c.end_seconds : (c.event_seconds || 0) + 3,
            confidence: playConf,
            play_confidence: playConf,
            identity_confidence: idConf,
            player_confirmed: 'unconfirmed',
            player_track_id: c.player_track_id || ('track_' + i),
            status: 'pending',
            order_index: i,
            detection_source: 'external',
            clip_url: c.clip_url || '',
            thumbnail_url: c.thumbnail_url || '',
            processing_status: c.clip_url ? 'ready' : 'extracting',
            extraction_error: ''
          };
        });
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