// Base44-native email helper. Registered players are notified via the built-in
// Core.SendEmail integration. No external email provider or secrets required.
// (Outbound mail to non-registered external addresses is not available natively,
//  so coach outreach is handled as an in-app CRM + the public coach-contact form
//  which notifies the registered player.)

export async function notifyPlayer(base44, toEmail, subject, body) {
  if (!toEmail) return { ok: false, reason: 'no email' };
  try {
    await base44.integrations.Core.SendEmail({ to: toEmail, subject, body });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// External coach-outbound email is not available natively (Core.SendEmail only
// reaches registered app users). These stubs keep sendCoachEmail from crashing
// when no external provider is configured — it returns an honest error instead.
export function getEmailConfig() {
  return { configured: false, reason: 'No external email provider configured. Coach outreach is an in-app CRM.' };
}

export async function sendExternalEmail(_config, _msg) {
  throw new Error('External email is not configured. Coach outreach stays in-app.');
}