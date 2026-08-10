import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Clips play the real uploaded source file bounded to their segment, so no separate
// extraction step is needed. This endpoint simply ensures the clip references the
// source file and is marked ready for review (used by the "retry" action).
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
    if (!source || !source.file_url) {
      await base44.entities.Clip.update(clip.id, {
        processing_status: 'failed',
        extraction_error: 'The source video file is unavailable. Re-upload the footage.'
      });
      return Response.json({ ok: false, error: 'Source file unavailable.' }, { status: 200 });
    }

    await base44.entities.Clip.update(clip.id, {
      clip_url: source.file_url,
      processing_status: 'ready',
      extraction_error: ''
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}