import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// With the Base44-native pipeline, analysis runs synchronously inside
// analyzeVideoSource and there is no external provider to call back. This endpoint
// is kept for compatibility and is a no-op that acknowledges receipt.
export default async function (req) {
  return Response.json({ ok: true, note: 'No external webhook required — analysis is Base44-native.' });
}