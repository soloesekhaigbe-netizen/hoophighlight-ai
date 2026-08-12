import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public read of a player's recruiting portfolio. Bypasses RLS via the service role
// and only returns data when the project is public. Email is hidden unless the
// player opted in (show_email). Records a portfolio_view analytics event.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const project_id = (body.project_id || new URL(req.url).pathname.split('/').pop() || '').trim();

    let project = null;
    if (project_id) {
      try {
        project = await base44.asServiceRole.entities.Project.get(project_id);
      } catch (_e) { project = null; }
      // Shared links may use the project's slug instead of its id — resolve it.
      if (!project) {
        try {
          const bySlug = await base44.asServiceRole.entities.Project.filter({ slug: project_id });
          project = bySlug && bySlug.length ? bySlug[0] : null;
        } catch (_e) { project = null; }
      }
    }
    if (!project) return Response.json({ error: `Portfolio not found for "${project_id}"` }, { status: 404 });
    if (project.is_public === false) return Response.json({ error: 'This portfolio is private' }, { status: 403 });

    const [games, clips, tapes, sources] = await Promise.all([
      base44.asServiceRole.entities.Game.filter({ project_id }),
      base44.asServiceRole.entities.Clip.filter({ project_id }),
      base44.asServiceRole.entities.HighlightTape.filter({ project_id }),
      base44.asServiceRole.entities.VideoSource.filter({ project_id })
    ]);
    const sourceById = Object.fromEntries(sources.map((s) => [s.id, s]));

    const accepted = clips
      .filter((c) => c.status === 'accepted' && c.processing_status === 'ready')
      .map((c) => {
        const src = c.video_source_id ? sourceById[c.video_source_id] : null;
        return {
          id: c.id, category: c.category, play_type: c.play_type, description: c.description,
          start_seconds: c.start_seconds, end_seconds: c.end_seconds, game_id: c.game_id,
          video_source_id: c.video_source_id,
          clip_url: c.clip_url || '',
          source_type: src?.source_type || (c.clip_url ? 'file' : ''),
          external_id: src?.external_id || '',
          identity_confidence: c.identity_confidence, play_confidence: c.play_confidence
        };
      })
      .filter((c) => c.clip_url || c.source_type === 'youtube' || c.source_type === 'veo');

    const publicTapes = tapes.filter((t) => t.status === 'ready').map((t) => ({
      id: t.id, category: t.category, title: t.title, clip_count: t.clip_count,
      duration_seconds: t.duration_seconds, clip_ids: t.clip_ids || [],
      is_featured: !!t.is_featured, version_label: t.version_label,
      intro_text: t.intro_text || '', outro_text: t.outro_text || '',
      include_fields: t.include_fields || {}
    }));

    const player_id = project.owner_user_id || project.created_by_id || '';
    try {
      await base44.asServiceRole.entities.PortfolioEvent.create({
        project_id, player_id, event_type: 'portfolio_view', visitor_hash: ''
      });
    } catch (_e) { /* best-effort */ }

    const safeProject = {
      id: project.id,
      player_name: project.player_name,
      first_name: project.first_name,
      last_name: project.last_name,
      jersey_number: project.jersey_number,
      team_name: project.team_name,
      season: project.season,
      position: project.position,
      height: project.height,
      weight: project.weight,
      school: project.school,
      graduation_year: project.graduation_year,
      city: project.city,
      country: project.country,
      bio: project.bio,
      profile_photo: project.profile_photo || project.photo_url || '',
      academic_gpa: project.academic_gpa,
      academic_sat: project.academic_sat,
      academic_notes: project.academic_notes,
      email: project.show_email ? project.email : ''
    };

    return Response.json({ project: safeProject, games, clips: accepted, tapes: publicTapes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}