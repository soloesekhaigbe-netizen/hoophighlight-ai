// Transactional email helper.
// - Registered app users (players) are reached with the built-in Core.SendEmail
//   integration, which is wired through the base44 client passed into each function.
// - External recipients (coaches) require an authorised email provider. This module
//   reads EMAIL_PROVIDER_* secrets and POSTs a Resend-compatible request. Swap the
//   request shape here if you use a different provider — nothing else changes.
import { secrets } from 'base44:runtime';

function safeSecret(name) {
  try { return secrets.get(name) || null; } catch (_e) { return null; }
}

export function getEmailConfig() {
  const apiUrl = safeSecret('EMAIL_PROVIDER_API_URL');
  const apiKey = safeSecret('EMAIL_PROVIDER_API_KEY');
  const fromAddress = safeSecret('EMAIL_FROM_ADDRESS');
  return { apiUrl, apiKey, fromAddress, configured: Boolean(apiUrl && apiKey && fromAddress) };
}

// Send to an external address via the configured provider (Resend-compatible).
export async function sendExternalEmail(config, { to, subject, html, text }) {
  const res = await fetch(config.apiUrl.replace(/\/$/, '') + '/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.apiKey },
    body: JSON.stringify({ from: config.fromAddress, to, subject, html, text: text || '' })
  });
  const body = await res.text();
  if (!res.ok) throw new Error('Email provider error (' + res.status + '): ' + body.slice(0, 300));
  return { ok: true };
}

// Notify a registered player. Uses the built-in integration via the passed client.
export async function notifyPlayer(base44, toEmail, subject, body) {
  if (!toEmail) return { ok: false, reason: 'no email' };
  try {
    await base44.integrations.Core.SendEmail({ to: toEmail, subject, body });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}