import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Retry trigger for a clip. Uploaded-file clips are extracted into real video
// files in the player's browser (ClipExtractionRunner); this endpoint simply
// resets the clip to "extracting" so the runner picks it up again. Link clips
// play via embed and need no extraction.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { clip_id } = (await req.json()) || {};
    if (!clip_id) return Response.json({ error: 'Missing clip_id' }, { status: 400 });

    const clip = await base44.entities.Clip.get(clip_id);
    if (!clip) return Response.json({ error: 'Clip not found' }, { status: 404 });

    const source = clip.video_source_id ? await base44.entities.VideoSource.get(clip.video_source_id).catch(() => null) : null;
    if (source && source.source_type === 'file') {
      if (!source.file_url) {
        await base44.entities.Clip.update(clip.id, {
          processing_status: 'failed',
          extraction_error: 'The source video file is unavailable. Re-upload the footage.'
        });
        return Response.json({ ok: false, error: 'Source file unavailable.' }, { status: 200 });
      }
      await base44.entities.Clip.update(clip.id, {
        processing_status: 'extracting',
        clip_url: '',
        extraction_error: ''
      });
      return Response.json({ ok: true, extracting: true });
    }

    // Link source — playable via embed.
    await base44.entities.Clip.update(clip.id, { processing_status: 'ready', extraction_error: '' });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}