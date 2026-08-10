import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getProviderConfig, requestExtraction } from '../../shared/processingProvider.ts';
import { UNPROCESSABLE_MESSAGE } from '../../shared/videoSources.ts';

// Re-attempt extraction for a single clip. For uploaded file sources the segment is
// playable directly from the source file (the browser plays only the requested range),
// so we just mark it ready. For YouTube/Veo without an external provider the clip is
// flagged unprocessable. With a provider connected, a real extraction job is requested.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { clip_id } = (await req.json()) || {};
    if (!clip_id) return Response.json({ error: 'Missing clip_id' }, { status: 400 });

    const clip = await base44.entities.Clip.get(clip_id);
    if (!clip) return Response.json({ error: 'Clip not found' }, { status: 404 });

    const source = await base44.entities.VideoSource.get(clip.video_source_id);
    if (!source) return Response.json({ error: 'Source video not found' }, { status: 404 });

    await base44.entities.Clip.update(clip.id, {
      processing_status: 'extracting',
      extraction_error: ''
    });

    const playableUrl = source.file_url || source.url;
    const canExtractSegment = source.source_type === 'file' && Boolean(playableUrl);
    const config = getProviderConfig();

    if (config.configured) {
      const job = await base44.entities.ProcessingJob.create({
        project_id: clip.project_id, video_source_id: source.id, tape_id: '',
        job_type: 'render', provider: 'external',
        status: 'queued', message: 'Extracting clip', progress: 10
      });
      try {
        const result = await requestExtraction(config, {
          job_ref: job.id,
          video_url: playableUrl,
          source_type: source.source_type,
          start: clip.start_seconds,
          end: clip.end_seconds,
          clip_id: clip.id
        });
        await base44.entities.ProcessingJob.update(job.id, {
          status: 'running', provider_job_id: result.job_id || ''
        });
        return Response.json({ ok: true, mode: 'external', job_id: result.job_id || job.id });
      } catch (err) {
        await base44.entities.ProcessingJob.update(job.id, { status: 'failed', message: err.message });
        await base44.entities.Clip.update(clip.id, {
          processing_status: 'failed',
          extraction_error: 'Extraction failed: ' + err.message
        });
        return Response.json({ ok: false, error: err.message }, { status: 200 });
      }
    }

    if (canExtractSegment) {
      await base44.entities.Clip.update(clip.id, {
        processing_status: 'ready',
        clip_url: playableUrl,
        extraction_error: ''
      });
      return Response.json({ ok: true, mode: 'segment' });
    }

    await base44.entities.Clip.update(clip.id, {
      processing_status: 'unprocessable',
      extraction_error: UNPROCESSABLE_MESSAGE
    });
    return Response.json({ ok: false, mode: 'unprocessable', error: UNPROCESSABLE_MESSAGE }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}