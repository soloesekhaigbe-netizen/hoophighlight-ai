import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getProviderConfig, requestAnalysis } from '../../shared/processingProvider.ts';

async function checkYoutubeAccess(videoId) {
  const res = await fetch('https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=' + videoId);
  if (res.status === 200) {
    const data = await res.json();
    return { accessible: true, title: data.title };
  }
  if (res.status === 401 || res.status === 403) {
    return { accessible: false, reason: 'This YouTube video is private or restricted, so it cannot be analysed. Ask the owner to make it unlisted or public, or upload the footage elsewhere.' };
  }
  return { accessible: false, reason: 'This YouTube video could not be found. It may have been deleted or the link is wrong.' };
}

export default async function (req) {
  const started = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { video_source_id } = (await req.json()) || {};
    if (!video_source_id) return Response.json({ error: 'Missing video_source_id' }, { status: 400 });

    const source = await base44.entities.VideoSource.get(video_source_id);
    if (!source) return Response.json({ error: 'Video not found' }, { status: 404 });

    let project = null;
    try {
      project = await base44.entities.Project.get(source.project_id);
    } catch (_e) {
      project = null;
    }

    const fail = async (message) => {
      await base44.entities.VideoSource.update(source.id, { status: 'error', error_message: message, progress: 0 });
      await base44.entities.ProcessingJob.create({
        project_id: source.project_id, video_source_id: source.id, job_type: 'analysis',
        status: 'failed', message, progress: 0
      });
      return Response.json({ ok: false, error: message }, { status: 200 });
    };

    await base44.entities.VideoSource.update(source.id, { status: 'downloading', progress: 10, error_message: '' });

    let title = source.title || '';
    if (source.source_type === 'youtube') {
      const access = await checkYoutubeAccess(source.external_id);
      if (!access.accessible) return await fail(access.reason);
      title = access.title;
    } else if (source.source_type === 'veo') {
      const res = await fetch(source.url, { method: 'GET' });
      if (res.status === 401 || res.status === 403) {
        return await fail('This Veo recording requires a login, so the processing service cannot access it. Share a public Veo link, or export the match and host it somewhere the service can reach.');
      }
      if (res.status === 404) {
        return await fail('This Veo recording could not be found. The link may be wrong or the match was removed.');
      }
    } else {
      return await fail('This link type is not supported.');
    }

    const config = getProviderConfig();

    if (config.configured) {
      const job = await base44.entities.ProcessingJob.create({
        project_id: source.project_id, video_source_id: source.id, job_type: 'analysis',
        status: 'queued', provider: 'external', message: 'Sent to processing service', progress: 15
      });
      try {
        const result = await requestAnalysis(config, {
          video_url: source.url,
          source_type: source.source_type,
          job_ref: job.id,
          player: project ? {
            name: project.player_name, jersey_number: project.jersey_number,
            team: project.team_name, photo_url: project.photo_url, appearance: project.appearance_notes
          } : null,
          categories: ['buckets', 'rebounds', 'blocks', 'shooting'],
          pre_roll_seconds: 4,
          post_roll_seconds: 3
        });
        await base44.entities.ProcessingJob.update(job.id, { status: 'running', provider_job_id: result.job_id || '', progress: 25 });
        await base44.entities.VideoSource.update(source.id, {
          status: 'processing', progress: 25, title, provider: 'external', provider_job_id: result.job_id || ''
        });
        return Response.json({ ok: true, mode: 'external', job_id: result.job_id || job.id });
      } catch (err) {
        await base44.entities.ProcessingJob.update(job.id, { status: 'failed', message: err.message });
        return await fail('The video processing service could not start this job: ' + err.message);
      }
    }

    // No external processing service connected: run an assisted demo detection pass so the
    // review workflow is usable. Clips are clearly flagged as estimated, never as real analysis.
    await base44.entities.VideoSource.update(source.id, { status: 'analysing', progress: 45, title });
    const job = await base44.entities.ProcessingJob.create({
      project_id: source.project_id, video_source_id: source.id, job_type: 'analysis',
      status: 'running', provider: 'demo', message: 'No processing service connected - generating estimated events for review', progress: 45
    });

    const playerLine = project
      ? `${project.player_name}${project.jersey_number ? ' (#' + project.jersey_number + ')' : ''}${project.team_name ? ' of ' + project.team_name : ''}`
      : 'the selected player';

    const ai = await base44.integrations.Core.InvokeLLM({
      prompt: `Produce a realistic set of 10-16 candidate basketball highlight events for a full game video of ${playerLine}, titled "${title}". These are ESTIMATED placeholder timestamps for a review workflow, spread across a 40 to 90 minute recording. Categories must be one of: buckets, rebounds, blocks, shooting. Give each a short play description (e.g. "drives baseline for a layup"), an event timestamp in seconds, and a confidence between 40 and 96.`,
      response_json_schema: {
        type: 'object',
        properties: {
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                play_type: { type: 'string' },
                description: { type: 'string' },
                event_seconds: { type: 'number' },
                confidence: { type: 'number' }
              }
            }
          }
        }
      }
    });

    await base44.entities.VideoSource.update(source.id, { status: 'detecting_plays', progress: 70 });

    const valid = ['buckets', 'rebounds', 'blocks', 'shooting'];
    const events = (ai && ai.events ? ai.events : []).filter((e) => valid.includes(e.category));
    const clips = events.map((e, i) => {
      const t = Math.max(6, Math.round(e.event_seconds || 60 + i * 90));
      return {
        project_id: source.project_id,
        game_id: source.game_id || '',
        video_source_id: source.id,
        category: e.category,
        play_type: e.play_type || '',
        description: e.description || '',
        event_seconds: t,
        start_seconds: Math.max(0, t - 4),
        end_seconds: t + 3,
        confidence: Math.min(99, Math.max(20, Math.round(e.confidence || 60))),
        status: 'pending',
        order_index: i,
        detection_source: 'estimated'
      };
    });

    await base44.entities.VideoSource.update(source.id, { status: 'creating_clips', progress: 85 });
    if (clips.length) await base44.entities.Clip.bulkCreate(clips);

    await base44.entities.ProcessingJob.update(job.id, {
      status: 'succeeded', progress: 100,
      message: 'Estimated events created (' + clips.length + '). Connect a processing service for true computer-vision analysis.'
    });
    await base44.entities.VideoSource.update(source.id, {
      status: 'ready', progress: 100, clips_detected: clips.length, provider: 'demo'
    });

    return Response.json({ ok: true, mode: 'demo', clips: clips.length, ms: Date.now() - started });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}