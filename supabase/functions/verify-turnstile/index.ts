import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_ACTIONS = new Set(['login', 'register']);

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const secret = (Deno.env.get('TURNSTILE_SECRET') ?? '').trim();
  if (!secret) {
    return jsonResponse(
      { error: 'Cloudflare Turnstile secret is not configured on the server yet.' },
      503
    );
  }

  const hostnamesEnv = (Deno.env.get('TURNSTILE_HOSTNAMES') ?? 'localhost,127.0.0.1').trim();
  const expectedHostnames = new Set(
    hostnamesEnv
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
  );

  try {
    const payload = (await req.json()) as { token?: unknown; action?: unknown };
    const token = payload.token;
    const requestedAction = typeof payload.action === 'string' ? payload.action : 'login';

    if (
      typeof token !== 'string' ||
      token.length === 0 ||
      token.length > 2048 ||
      expectedHostnames.size === 0 ||
      !ALLOWED_ACTIONS.has(requestedAction)
    ) {
      return jsonResponse({ error: 'Bot verification failed. Please complete the Cloudflare challenge.' }, 403);
    }

    const clientIp =
      req.headers.get('cf-connecting-ip')?.trim() ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '';

    const form = new URLSearchParams({
      secret,
      response: token,
    });
    if (clientIp) {
      form.set('remoteip', clientIp);
    }

    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: form,
    });

    if (!verifyResponse.ok) {
      return jsonResponse({ error: 'Verification service rejected request.' }, 403);
    }

    const result = (await verifyResponse.json()) as {
      success?: boolean;
      action?: string;
      hostname?: string;
    };

    if (
      !result.success ||
      result.action !== requestedAction ||
      !result.hostname ||
      !expectedHostnames.has(result.hostname)
    ) {
      return jsonResponse(
        { error: 'Cloudflare security verification failed. Please retry the challenge.' },
        403
      );
    }

    return jsonResponse({ verified: true });
  } catch {
    return jsonResponse({ error: 'Unable to verify Cloudflare security token.' }, 403);
  }
});
