import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { analyzeFootage, analyzeYouTubeFootage } from '../../shared/processingProvider.ts';
import { notifyPlayer } from '../../shared/emailProvider.ts';

const CONTEXT = { buckets: { pre: 6, post: 4 }, rebounds: { pre: 5, post: 3 }, blocks: { pre: 5, post: 4 }, shooting: { pre: 5, post: 4 } };

// Base44-native analysis pipeline (no external provider):
//   1. Verify the source is an uploaded file we can actually read (YouTube/Veo links
//      that the environment cannot fetch are rejected honestly — upload the file).
//   2. Run vision analysis via InvokeLLM to identify the player + detect events.
//   3. Create a Clip per detected event. Each clip references the real uploaded
//      video file and is played back bounded to its segment (real footage, no
//      redirects, no fake URLs).
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
      if (project?.email) {
        await notifyPlayer(base44, project.email, 'Processing failed', `Hi ${project.player_name},\n\nProcessing failed for "${source.title || source.url}":\n${message}\n\nYou can fix the source or add clips manually from the Games tab.`);
      }
      return Response.json({ ok: false, error: message }, { status: 200 });
    };

    // File uploads are analysed directly. YouTube links are scanned by extracting the
    // video's public storyboard contact-sheets and feeding those frames to the vision
    // model. Veo links can't be read server-side, so they fall back to manual mode.
    const playerObj = project ? {
      name: project.player_name, jersey_number: project.jersey_number,
      team: project.team_name, position: project.position,
      appearance: project.appearance_notes,
      reference_photos: project.reference_photos
    } : null;
    const refPhotos = project?.reference_photos || [];

    if (source.source_type !== 'file' && source.source_type !== 'youtube') {
      await base44.entities.VideoSource.update(source.id, { status: 'ready', progress: 100, clips_detected: 0 });
      if (project?.email) {
        await notifyPlayer(base44, project.email, 'Link ready for manual clips',
          `Hi ${project.player_name},\n\nAutomatic analysis isn't available for "${source.title || source.url}". The source is ready: add clips manually by marking start/end timestamps from the Games tab.`);
      }
      return Response.json({ ok: true, clips: 0, manual: true });
    }
    if (source.source_type === 'file' && !source.file_url) {
      return await fail('No playable source file found for this video.');
    }

    await base44.entities.VideoSource.update(source.id, { status: 'analysing', progress: 20, error_message: '' });

    const job = await base44.entities.ProcessingJob.create({
      project_id: source.project_id, video_source_id: source.id, job_type: 'analysis',
      status: 'running',
      message: source.source_type === 'youtube' ? 'Scanning YouTube footage frames' : 'Running computer-vision analysis',
      progress: 30
    });

    let analysis;
    try {
      analysis = source.source_type === 'youtube'
        ? await analyzeYouTubeFootage(base44, { videoId: source.external_id, reference_photos: refPhotos, player: playerObj })
        : await analyzeFootage(base44, { video_url: source.file_url, reference_photos: refPhotos, player: playerObj });
    } catch (err) {
      await base44.entities.ProcessingJob.update(job.id, { status: 'failed', message: err.message });
      if (source.source_type !== 'file') {
        await base44.entities.VideoSource.update(source.id, { status: 'ready', progress: 100, clips_detected: 0 });
        if (project?.email) {
          await notifyPlayer(base44, project.email, 'Link ready for manual clips',
            `Hi ${project.player_name},\n\nAutomatic analysis wasn't possible for "${source.title || source.url}" — the footage couldn't be scanned automatically. The source is ready: add clips manually by marking start/end timestamps from the Games tab.`);
        }
        return Response.json({ ok: true, clips: 0, manual: true });
      }
      return await fail('The analysis model could not process this video: ' + err.message + ' You can still add clips manually from the Games tab.');
    }

    const ctx = (cat) => CONTEXT[cat] || { pre: 5, post: 4 };
    const events = analysis.events || [];
    const created = [];
    for (const ev of events) {
      const pre = ctx(ev.category).pre;
      const post = ctx(ev.category).post;
      const start = Number(ev.start_seconds ?? (ev.event_seconds - pre));
      const end = Number(ev.end_seconds ?? (ev.event_seconds + post));
      const clip = await base44.entities.Clip.create({
        player_id: project?.owner_user_id || user.id,
        project_id: source.project_id,
        game_id: source.game_id || '',
        video_source_id: source.id,
        category: ev.category,
        play_type: ev.play_type || '',
        description: ev.description || '',
        event_seconds: Number(ev.event_seconds || (start + end) / 2),
        start_seconds: Math.max(0, start),
        end_seconds: end,
        confidence: Number(ev.confidence || 0),
        play_confidence: Number(ev.confidence || 0),
        identity_confidence: Number(analysis.identity_confidence || 0),
        player_confirmed: analysis.player_identified ? 'unconfirmed' : 'unconfirmed',
        player_track_id: '',
        status: 'pending',
        detection_source: 'ai-vision',
        clip_url: source.source_type === 'file' ? source.file_url : '',
        thumbnail_url: '',
        processing_status: 'ready'
      });
      created.push(clip.id);
    }

    const reviewRequired = !analysis.player_identified;
    await base44.entities.ProcessingJob.update(job.id, {
      status: 'succeeded', progress: 100,
      message: reviewRequired ? 'Analysis complete — confirm player identity' : `Analysis complete — ${created.length} clips`
    });
    await base44.entities.VideoSource.update(source.id, {
      status: 'ready', progress: 100, clips_detected: created.length
    });

    if (project?.email) {
      if (created.length > 0) {
        await notifyPlayer(base44, project.email, 'Highlights ready for review',
          `Hi ${project.player_name},\n\n${created.length} clips were detected in "${source.title || 'your footage'}" and are ready for your review.\n${reviewRequired ? 'Please confirm which clips feature you before they are added to your highlight tapes.' : ''}\n\nOpen your dashboard to review them.`);
      } else {
        await notifyPlayer(base44, project.email, 'Analysis finished',
          `Hi ${project.player_name},\n\nNo confident events were detected in "${source.title || 'your footage'}". You can add clips manually from the Games tab.`);
      }
    }

    return Response.json({ ok: true, clips: created.length, player_identified: analysis.player_identified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}