import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public read: returns a sanitised portfolio bundle for a public portfolio.
// Looked up by slug (preferred) or project id. Private projects return 404.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { slug } = (await req.json()) || {};
    const key = (slug || '').toLowerCase();
    if (!key) return Response.json({ error: 'Portfolio not found' }, { status: 404 });

    let project = null;
    // Allow lookup by slug or by direct project id.
    if (key.length > 20) {
      try { project = await base44.asServiceRole.entities.Project.get(key); } catch (_e) { project = null; }
    }
    if (!project) {
      const list = await base44.asServiceRole.entities.Project.filter({ slug: key });
      project = list && list[0];
    }
    if (!project) return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    if (project.is_public === false) return Response.json({ error: 'Portfolio not found' }, { status: 404 });

    const projectId = project.id;
    const [clips, tapes, games] = await Promise.all([
      base44.asServiceRole.entities.Clip.filter({ project_id: projectId }),
      base44.asServiceRole.entities.HighlightTape.filter({ project_id: projectId }),
      base44.asServiceRole.entities.Game.filter({ project_id: projectId })
    ]);

    const player = {
      id: project.id, slug: project.slug,
      player_name: project.player_name, jersey_number: project.jersey_number,
      team_name: project.team_name, season: project.season, position: project.position,
      height: project.height, weight: project.weight, city: project.city, country: project.country,
      school: project.school, graduation_year: project.graduation_year,
      bio: project.bio, profile_photo: project.profile_photo || project.photo_url,
      academic_gpa: project.academic_gpa, academic_sat: project.academic_sat,
      academic_notes: project.academic_notes,
      email: project.show_email ? project.email : null
    };

    const readyClips = clips
      .filter((c) => c.status === 'accepted' && c.processing_status === 'ready' && c.clip_url)
      .map((c) => ({
        id: c.id, category: c.category, description: c.description,
        play_type: c.play_type, clip_url: c.clip_url, thumbnail_url: c.thumbnail_url,
        start_seconds: c.start_seconds, end_seconds: c.end_seconds, game_id: c.game_id,
        identity_confidence: c.identity_confidence, play_confidence: c.play_confidence
      }));

    const readyTapes = tapes
      .filter((t) => t.status === 'ready')
      .map((t) => ({
        id: t.id, category: t.category, title: t.title, clip_count: t.clip_count,
        duration_seconds: t.duration_seconds, video_url: t.video_url, export_mode: t.export_mode
      }));

    return Response.json({
      player,
      clips: readyClips,
      tapes: readyTapes,
      games: games.map((g) => ({ id: g.id, name: g.name, game_date: g.game_date, opponent: g.opponent }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}