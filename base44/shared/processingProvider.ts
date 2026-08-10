// Modular adapter for the external video processing / computer-vision service.
// Swap the provider by changing the secrets below - nothing else in the app changes.
import { secrets } from 'base44:runtime';

function safeSecret(name) {
  try {
    const v = secrets.get(name);
    return v || null;
  } catch (_e) {
    return null;
  }
}

export function getProviderConfig() {
  const baseUrl = safeSecret('VIDEO_PROCESSOR_URL');
  const apiKey = safeSecret('VIDEO_PROCESSOR_API_KEY');
  const webhookSecret = safeSecret('VIDEO_PROCESSOR_WEBHOOK_SECRET');
  return { baseUrl, apiKey, webhookSecret, configured: Boolean(baseUrl && apiKey) };
}

async function postJson(config, path, payload) {
  const res = await fetch(config.baseUrl.replace(/\/$/, '') + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.apiKey },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_e) { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(data.message || data.error || ('Processing service responded with ' + res.status));
  }
  return data;
}

// Ask the external service to download + analyse the footage and call our webhook when done.
export async function requestAnalysis(config, payload) {
  return postJson(config, '/analyze', payload);
}

// Ask the external service to extract a single clip segment to a stored file.
export async function requestExtraction(config, payload) {
  return postJson(config, '/extract', payload);
}

export async function requestRender(config, payload) {
  return postJson(config, '/render', payload);
}