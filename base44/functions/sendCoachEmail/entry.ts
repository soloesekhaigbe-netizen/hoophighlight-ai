import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getEmailConfig, sendExternalEmail } from '../../shared/emailProvider.ts';

// Authenticated: a player sends a prepared outreach email to an external coach.
// Requires the EMAIL_PROVIDER_* secrets to be configured.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) || {};
    const { coach_id, coach_email, subject, body: emailBody } = body;
    if (!coach_email || !subject || !emailBody) {
      return Response.json({ error: 'Missing email fields' }, { status: 400 });
    }

    let project = null;
    if (coach_id) {
      const coach = await base44.entities.Coach.get(coach_id);
      if (!coach) return Response.json({ error: 'Coach not found' }, { status: 404 });
      project = await base44.entities.Project.get(coach.project_id);
    } else {
      const projects = await base44.entities.Project.filter({ owner_user_id: user.id });
      project = projects && projects[0];
    }
    if (!project) return Response.json({ error: 'Player profile not found' }, { status: 404 });

    const config = getEmailConfig();
    if (!config.configured) {
      return Response.json({ error: 'No email provider configured. Add EMAIL_PROVIDER_API_URL, EMAIL_PROVIDER_API_KEY and EMAIL_FROM_ADDRESS to send outreach.' }, { status: 400 });
    }

    await sendExternalEmail(config, { to: coach_email, subject, html: emailBody.replace(/\n/g, '<br>') });

    if (coach_id) {
      await base44.entities.Coach.update(coach_id, { status: 'sent', notes: (project.notes || '') });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}