import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { notifyPlayer } from '../../shared/emailProvider.ts';

// Public endpoint: a coach (no account) submits a contact form on a player's
// public portfolio. The inquiry is saved securely and the registered player is
// notified via the built-in SendEmail integration.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { project_id, coach_name, coach_email, school, message } = (await req.json()) || {};
    if (!project_id || !coach_name || !coach_email || !message) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }

    let project = null;
    try { project = await base44.entities.Project.get(project_id); } catch (_e) { project = null; }
    if (!project) return Response.json({ error: 'Portfolio not found.' }, { status: 404 });
    if (project.is_public === false) return Response.json({ error: 'This portfolio is not public.' }, { status: 403 });

    const player_id = project.owner_user_id || project.created_by_id || '';
    await base44.entities.CoachInquiry.create({
      project_id, player_id, coach_name, coach_email, school: school || '', message, status: 'new'
    });

    if (project.email) {
      await notifyPlayer(base44, project.email, 'New coach inquiry',
        `Hi ${project.player_name},\n\nCoach ${coach_name}${school ? ' (' + school + ')' : ''} contacted you through your portfolio:\n\n${message}\n\nReply to them at ${coach_email}.`);
    }

    try {
      await base44.entities.PortfolioEvent.create({
        project_id, player_id, event_type: 'coach_contact', visitor_hash: ''
      });
    } catch (_e) { /* analytics are best-effort */ }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}