import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, appBaseUrl } = appParams;

//Create a client with authentication required
// Note: we intentionally do NOT pass `functionsVersion` so the client always
// invokes the latest deployed function version. The preview's baked-in
// version can lag behind newly edited functions (e.g. getPublicPortfolio's
// slug resolution), which breaks share links until a dev-server restart.
export const base44 = createClient({
  appId,
  token,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});