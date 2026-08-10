import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function hashVisitor(req) {
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anon').split(',')[0].trim();
  let h = 0; for (let i = 0; i < ip.length; i++) { h = (h * 31 + ip.charCodeAt(i)) | 0; }
  return 'v_' + Math.abs(h).toString(36);
}

// Public endpoint: record a portfolio analytics event (view, highlight play, link click).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = (await req.json()) || {};
    const { project_id, event_type, category } = body;
    if (!project_id || !event_type) return Response.json({ error: 'Missing fields' }, { status: 400 });

    let project = null;
    try { project = await base44.asServiceRole.entities.Project.get(project_id); } catch (_e) { project = null; }
    if (!project) return Response.json({ ok: false });
    if (project.is_public === false) return Response.json({ ok: false });

    await base44.asServiceRole.entities.PortfolioEvent.create({
      project_id, player_id: project.owner_user_id || project.created_by_id,
      event_type, category: category || '', visitor_hash: hashVisitor(req)
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}