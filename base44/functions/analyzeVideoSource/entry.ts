import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getProviderConfig, requestAnalysis } from '../../shared/processingProvider.ts';

async function checkYoutubeAccess(videoId) {
  const res = await fetch('https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=' + videoId);
  if (res.status === 200) {
    const data = await res.json();
    return { accessible: true, title: data.title };
  }
  if (res.status === 401 || res.status === 403) {
    return { accessible: false, reason: 'This YouTube video is private or restricted, so it cannot be analysed. Make it unlisted or public, or upload the footage file directly.' };
  }
  return { accessible: false, reason: 'This YouTube video could not be found. It may have been deleted or the link is wrong.' };
}

// Honest pipeline: clips are NEVER created until the external processing provider
// returns them with a real playable clip_url via the webhook. With no provider
// configured the source is failed with a clear reason — no fake/estimated clips.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { video_source_id } = (await req.json()) || {};
    if (!video_source_id) return Response.json({ error: 'Missing video_source_id' }, { status: 400 });

    const source = await base44.entities.VideoSource.get(video_source_id);
    if (!source) return Response.json({ error: 'Video not found' }, { status: 404 });

    let project = null;
    try { project = await base44.entities.Project.get(source.project_id); } catch (_e) { project = null; }

    const fail = async (message) => {
      await base44.entities.VideoSource.update(source.id, { status: 'error', error_message: message, progress: 0 });
      await base44.entities.ProcessingJob.create({
        project_id: source.project_id, video_source_id: source.id, job_type: 'analysis',
        status: 'failed', message, progress: 0
      });
      return Response.json({ ok: false, error: message }, { status: 200 });
    };

    const config = getProviderConfig();
    if (!config.configured) {
      return await fail(
        'No video processing provider is connected. Add VIDEO_PROCESSOR_URL and VIDEO_PROCESSOR_API_KEY to enable real computer-vision analysis and clip extraction. Until then, clips cannot be created.'
      );
    }

    await base44.entities.VideoSource.update(source.id, { status: 'downloading', progress: 10, error_message: '' });

    let title = source.title || '';
    if (source.source_type === 'file') {
      title = source.title || 'Uploaded footage';
    } else if (source.source_type === 'youtube') {
      const access = await checkYoutubeAccess(source.external_id);
      if (!access.accessible) return await fail(access.reason);
      title = access.title;
    } else if (source.source_type === 'veo') {
      const res = await fetch(source.url, { method: 'GET' });
      if (res.status === 401 || res.status === 403) {
        return await fail('This Veo recording requires a login, so the processing provider cannot access it. Upload the footage file directly, or share a public link the provider can reach.');
      }
      if (res.status === 404) return await fail('This Veo recording could not be found. The link may be wrong or the match was removed.');
    } else {
      return await fail('This link type is not supported.');
    }

    const job = await base44.entities.ProcessingJob.create({
      project_id: source.project_id, video_source_id: source.id, job_type: 'analysis',
      status: 'queued', provider: 'external', message: 'Sent to processing provider', progress: 15
    });

    try {
      const result = await requestAnalysis(config, {
        video_url: source.file_url || source.url,
        source_type: source.source_type,
        job_ref: job.id,
        webhook_secret: config.webhookSecret,
        player: project ? {
          name: project.player_name, jersey_number: project.jersey_number,
          team: project.team_name, position: project.position, appearance: project.appearance_notes,
          reference_photos: Array.isArray(project.reference_photos) ? project.reference_photos : [],
          calibrated: project.calibrated !== false
        } : null,
        categories: ['buckets', 'rebounds', 'blocks', 'shooting'],
        context_windows: { buckets: { pre: 6, post: 4 }, rebounds: { pre: 5, post: 3 }, blocks: { pre: 5, post: 4 }, shooting: { pre: 5, post: 4 } }
      });
      await base44.entities.ProcessingJob.update(job.id, { status: 'running', provider_job_id: result.job_id || '', progress: 25 });
      await base44.entities.VideoSource.update(source.id, {
        status: 'processing', progress: 25, title, provider: 'external', provider_job_id: result.job_id || ''
      });
      return Response.json({ ok: true, mode: 'external', job_id: result.job_id || job.id });
    } catch (err) {
      await base44.entities.ProcessingJob.update(job.id, { status: 'failed', message: err.message });
      return await fail('The processing provider could not start this job: ' + err.message);
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}