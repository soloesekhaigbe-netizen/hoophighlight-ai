import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { analyzeFootage, analyzeYouTubeFootage } from '../../shared/processingProvider.ts';
import { notifyPlayer } from '../../shared/emailProvider.ts';

const CONTEXT = { buckets: { pre: 6, post: 4 }, rebounds: { pre: 5, post: 3 }, blocks: { pre: 5, post: 4 }, shooting: { pre: 5, post: 4 } };

// Base44-native analysis pipeline (no external provider):
//   1. Validate the source — uploaded files and public YouTube links only. Veo and
//      private/unsupported sources fall back to manual mode honestly.
//   2. Run vision analysis via InvokeLLM to identify the player + detect events.
//   3. Create a Clip per detected event with honest processing_status:
//        - uploaded file  -> processing_status = "extracting" (the real clip file is
//          then produced in the player's browser by ClipExtractionRunner).
//        - youtube link   -> processing_status = "ready" (plays via the embed,
//          bounded to the detected segment — the only honest way to play a link).
//   No clip is ever marked READY for a file source until the real file exists.
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
      if (project && project.email) {
        await notifyPlayer(base44, project.email, 'Processing failed', `Hi ${project.player_name},\n\nProcessing failed for "${source.title || source.url}":\n${message}\n\nYou can fix the source or add clips manually from the Games tab.`);
      }
      return Response.json({ ok: false, error: message }, { status: 200 });
    };

    const playerObj = project ? {
      name: project.player_name, jersey_number: project.jersey_number,
      team: project.team_name, position: project.position,
      appearance: project.appearance_notes,
      reference_photos: project.reference_photos
    } : null;
    const refPhotos = (project && project.reference_photos) || [];

    // Veo / unsupported links cannot be read by the server — honest manual fallback.
    if (source.source_type !== 'file' && source.source_type !== 'youtube') {
      await base44.entities.VideoSource.update(source.id, { status: 'ready', progress: 100, clips_detected: 0 });
      if (project && project.email) {
        await notifyPlayer(base44, project.email, 'Link ready for manual clips',
          `Hi ${project.player_name},\n\nAutomatic analysis isn't available for "${source.title || source.url}". The source is ready: add clips manually by marking start/end timestamps from the Games tab.`);
      }
      return Response.json({ ok: true, clips: 0, manual: true });
    }
    if (source.source_type === 'file' && !source.file_url) {
      return await fail('No playable source file found for this video.');
    }

    await base44.entities.VideoSource.update(source.id, { status: 'processing', progress: 15, error_message: '' });
    const job = await base44.entities.ProcessingJob.create({
      project_id: source.project_id, video_source_id: source.id, job_type: 'analysis',
      status: 'running',
      message: source.source_type === 'youtube' ? 'Validating link' : 'Validating footage',
      progress: 15
    });

    const setStage = async (status, message, progress) => {
      await base44.entities.VideoSource.update(source.id, { status, progress, error_message: '' });
      await base44.entities.ProcessingJob.update(job.id, { message, progress });
    };

    await setStage('analysing', source.source_type === 'youtube' ? 'Scanning footage frames' : 'Running vision analysis', 30);

    let analysis;
    try {
      analysis = source.source_type === 'youtube'
        ? await analyzeYouTubeFootage(base44, { videoId: source.external_id, reference_photos: refPhotos, player: playerObj })
        : await analyzeFootage(base44, { video_url: source.file_url, reference_photos: refPhotos, player: playerObj });
    } catch (err) {
      await base44.entities.ProcessingJob.update(job.id, { status: 'failed', message: err.message });
      if (source.source_type !== 'file') {
        await base44.entities.VideoSource.update(source.id, { status: 'ready', progress: 100, clips_detected: 0, error_message: 'Auto-analysis failed: ' + err.message });
        if (project && project.email) {
          await notifyPlayer(base44, project.email, 'Link ready for manual clips',
            `Hi ${project.player_name},\n\nAutomatic analysis wasn't possible for "${source.title || source.url}" — the footage couldn't be scanned automatically. The source is ready: add clips manually by marking start/end timestamps from the Games tab.`);
        }
        return Response.json({ ok: true, clips: 0, manual: true });
      }
      return await fail('The analysis model could not process this video: ' + err.message + ' You can still add clips manually from the Games tab.');
    }

    await setStage('detecting_plays', 'Detecting plays', 70);

    const ctx = (cat) => CONTEXT[cat] || { pre: 5, post: 4 };
    const events = analysis.events || [];
    const created = [];
    const isLink = source.source_type !== 'file';

    await setStage('creating_clips', 'Creating clip records', 85);

    // Retry-safe: remove any previously auto-detected clips for this source so a
    // re-analysis never creates duplicates. Manually-added clips are preserved.
    try {
      await base44.entities.Clip.deleteMany({ video_source_id: source.id, detection_source: 'ai-vision' });
    } catch (_e) { /* best-effort */ }

    for (const ev of events) {
      const pre = ctx(ev.category).pre;
      const post = ctx(ev.category).post;
      const start = Number(ev.start_seconds ?? (ev.event_seconds - pre));
      const end = Number(ev.end_seconds ?? (ev.event_seconds + post));
      const clip = await base44.entities.Clip.create({
        player_id: (project && project.owner_user_id) || user.id,
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
        highlight_score: Math.min(100, Math.round((Number(ev.confidence || 0) * 100) + (ev.category === 'blocks' ? 8 : ev.category === 'buckets' ? 4 : 0))),
        player_confirmed: 'unconfirmed',
        player_track_id: '',
        status: 'pending',
        detection_source: 'ai-vision',
        // Uploaded files get a real clip file only after browser extraction; links
        // play via embed. Never fake a clip_url here.
        clip_url: '',
        thumbnail_url: '',
        processing_status: isLink ? 'ready' : 'extracting'
      });
      created.push(clip.id);
    }

    const reviewRequired = !analysis.player_identified;
    await base44.entities.ProcessingJob.update(job.id, {
      status: 'succeeded', progress: 100,
      message: reviewRequired
        ? 'Analysis complete — confirm player identity'
        : (isLink ? `Analysis complete — ${created.length} clips` : `Analysis complete — ${created.length} clips ready to extract`)
    });
    await base44.entities.VideoSource.update(source.id, {
      status: 'ready', progress: 100, clips_detected: created.length
    });

    if (project && project.email) {
      if (created.length > 0) {
        const note = isLink
          ? 'Your clips are ready to review.'
          : 'Open your dashboard and tap "Extract clips" to turn the detected plays into real video files.';
        await notifyPlayer(base44, project.email, 'Highlights ready for review',
          `Hi ${project.player_name},\n\n${created.length} clips were detected in "${source.title || 'your footage'}".\n${reviewRequired ? 'Please confirm which clips feature you before they are added to your highlight tapes.\n' : ''}${note}`);
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