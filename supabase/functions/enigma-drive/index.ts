import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_SESSION_BYTES = 500 * 1024 * 1024;
const MAX_SINGLE_FILE_BYTES = 50 * 1024 * 1024;
const MAX_SESSION_FILES = 50;
const DRIVE_BUCKET = 'enigma-drive';
const TOKEN_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

type DriveCategory = 'image' | 'document' | 'archive' | 'text' | 'other';

interface DriveSessionRow {
  id: string;
  token: string;
  owner_user_id: string | null;
  password_salt: string | null;
  password_hash: string | null;
  has_password: boolean;
  duration_minutes: number;
  lockdown_mode: boolean;
  status: 'active' | 'ended';
  created_at: string;
  expires_at: string;
}

interface DriveFileRow {
  id: string;
  session_id: string;
  owner_user_id: string | null;
  file_name: string;
  mime_type: string;
  file_category: DriveCategory;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
}

interface DriveClipboardRow {
  id: string;
  session_id: string;
  owner_user_id: string | null;
  content: string;
  created_by: string;
  created_at: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hashPassword(password: string, saltHex?: string): Promise<{ salt: string; hash: string }> {
  const saltBytes = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return {
    salt: toHex(saltBytes),
    hash: toHex(new Uint8Array(derivedBits)),
  };
}

async function verifyPassword(password: string, saltHex: string, expectedHashHex: string): Promise<boolean> {
  const { hash } = await hashPassword(password, saltHex);
  return constantTimeEqual(fromHex(hash), fromHex(expectedHashHex));
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`enigma-drive:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signCapabilityToken(sessionId: string, expiresAtIso: string, secret: string): Promise<string> {
  const payload = JSON.stringify({ sid: sessionId, exp: expiresAtIso });
  const encodedPayload = toBase64Url(new TextEncoder().encode(payload));
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(sig))}`;
}

async function verifyCapabilityToken(
  token: string,
  secret: string
): Promise<{ sid: string; exp: string } | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  try {
    const key = await getHmacKey(secret);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(encodedSig),
      new TextEncoder().encode(encodedPayload)
    );
    if (!isValid) return null;

    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as {
      sid?: unknown;
      exp?: unknown;
    };
    if (typeof decoded.sid !== 'string' || typeof decoded.exp !== 'string') {
      return null;
    }
    return { sid: decoded.sid, exp: decoded.exp };
  } catch {
    return null;
  }
}

function generateSessionToken(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += TOKEN_ALPHABET[bytes[i] % TOKEN_ALPHABET.length];
  }
  return result;
}

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop()?.trim() || 'file';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  return cleaned || 'file';
}

function classifyFileCategory(fileName: string, mimeType: string): DriveCategory {
  const lowerName = fileName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();
  if (lowerMime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/.test(lowerName)) {
    return 'image';
  }
  if (
    lowerMime.includes('pdf') ||
    lowerMime.includes('word') ||
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('presentation') ||
    /\.(pdf|docx?|xlsx?|pptx?|odt|rtf|csv)$/.test(lowerName)
  ) {
    return 'document';
  }
  if (
    lowerMime.includes('zip') ||
    lowerMime.includes('tar') ||
    lowerMime.includes('compressed') ||
    /\.(zip|tar|gz|tgz|7z|rar)$/.test(lowerName)
  ) {
    return 'archive';
  }
  if (
    lowerMime.startsWith('text/') ||
    lowerMime.includes('json') ||
    lowerMime.includes('javascript') ||
    lowerMime.includes('xml') ||
    /\.(txt|md|json|ts|tsx|js|jsx|py|rs|go|css|html|xml|yml|yaml|log|env|sql)$/.test(lowerName)
  ) {
    return 'text';
  }
  return 'other';
}

function toPublicSession(row: DriveSessionRow) {
  return {
    id: row.id,
    token: row.token,
    hasPassword: row.has_password,
    durationMinutes: row.duration_minutes,
    lockdownMode: row.lockdown_mode,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function toPublicFile(row: DriveFileRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileCategory: row.file_category,
    sizeBytes: Number(row.size_bytes),
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

function toPublicClipboardItem(row: DriveClipboardRow) {
  return {
    id: row.id,
    sessionId: row.session_id,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

async function resolveOptionalUserId(supabaseAdmin: SupabaseClient, req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const jwt = authHeader.slice(7).trim();
  if (!jwt || jwt.split('.').length !== 3) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(jwt);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

async function cleanupSessionResources(supabaseAdmin: SupabaseClient, sessionId: string): Promise<void> {
  const { data: files } = await supabaseAdmin
    .from('drive_files')
    .select('storage_path')
    .eq('session_id', sessionId);

  if (files && files.length > 0) {
    const paths = files.map((f: { storage_path: string }) => f.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabaseAdmin.storage.from(DRIVE_BUCKET).remove(paths);
    }
  }

  await supabaseAdmin.from('drive_sessions').update({ status: 'ended' }).eq('id', sessionId);
}

async function fetchSnapshot(supabaseAdmin: SupabaseClient, session: DriveSessionRow) {
  const [filesRes, clipRes] = await Promise.all([
    supabaseAdmin
      .from('drive_files')
      .select('id, session_id, owner_user_id, file_name, mime_type, file_category, size_bytes, storage_path, uploaded_by, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('drive_clipboard_items')
      .select('id, session_id, owner_user_id, content, created_by, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    session: toPublicSession(session),
    files: ((filesRes.data as DriveFileRow[] | null) ?? []).map(toPublicFile),
    clipboardItems: ((clipRes.data as DriveClipboardRow[] | null) ?? []).map(toPublicClipboardItem),
  };
}

async function requireActiveSession(
  supabaseAdmin: SupabaseClient,
  capabilityToken: unknown,
  secret: string
): Promise<{ session: DriveSessionRow } | { response: Response }> {
  if (typeof capabilityToken !== 'string' || !capabilityToken.trim()) {
    return { response: jsonResponse({ error: 'Missing active session capability token.' }, 401) };
  }

  const verified = await verifyCapabilityToken(capabilityToken.trim(), secret);
  if (!verified) {
    return { response: jsonResponse({ error: 'Invalid or tampered session capability token.' }, 401) };
  }

  const { data: session, error } = await supabaseAdmin
    .from('drive_sessions')
    .select('*')
    .eq('id', verified.sid)
    .maybeSingle();

  if (error || !session) {
    return { response: jsonResponse({ error: 'Drive session not found.' }, 404) };
  }

  const typed = session as DriveSessionRow;
  if (typed.status !== 'active' || new Date(typed.expires_at).getTime() <= Date.now()) {
    if (typed.status === 'active') {
      await cleanupSessionResources(supabaseAdmin, typed.id);
    }
    return { response: jsonResponse({ error: 'Drive session has ended or expired.' }, 410) };
  }

  return { session: typed };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Server storage environment is not configured.' }, 500);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';

    if (action === 'start') {
      const durationRaw = Number(body.durationMinutes);
      if (!Number.isInteger(durationRaw) || durationRaw < 1 || durationRaw > 1440) {
        return jsonResponse({ error: 'Session duration must be between 1 and 1440 minutes.' }, 400);
      }

      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length > 128) {
        return jsonResponse({ error: 'Session password cannot exceed 128 characters.' }, 400);
      }

      const lockdownMode = Boolean(body.lockdownMode);
      const ownerUserId = await resolveOptionalUserId(supabaseAdmin, req);

      let passwordSalt: string | null = null;
      let passwordHash: string | null = null;
      const hasPassword = password.length > 0;
      if (hasPassword) {
        const hashed = await hashPassword(password);
        passwordSalt = hashed.salt;
        passwordHash = hashed.hash;
      }

      const now = Date.now();
      const expiresAtIso = new Date(now + durationRaw * 60 * 1000).toISOString();

      let createdSession: DriveSessionRow | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const token = generateSessionToken(6);
        const { data, error } = await supabaseAdmin
          .from('drive_sessions')
          .insert({
            token,
            owner_user_id: ownerUserId,
            password_salt: passwordSalt,
            password_hash: passwordHash,
            has_password: hasPassword,
            duration_minutes: durationRaw,
            lockdown_mode: lockdownMode,
            status: 'active',
            expires_at: expiresAtIso,
          })
          .select('*')
          .single();

        if (!error && data) {
          createdSession = data as DriveSessionRow;
          break;
        }
      }

      if (!createdSession) {
        return jsonResponse({ error: 'Could not allocate a unique session token. Please try again.' }, 500);
      }

      const capabilityToken = await signCapabilityToken(
        createdSession.id,
        createdSession.expires_at,
        serviceRoleKey
      );

      return jsonResponse(
        {
          capabilityToken,
          session: toPublicSession(createdSession),
          files: [],
          clipboardItems: [],
        },
        201
      );
    }

    if (action === 'access') {
      const token = typeof body.token === 'string' ? body.token.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';

      if (!token) {
        return jsonResponse({ error: 'Please enter a session token.' }, 400);
      }

      const { data: sessionData, error } = await supabaseAdmin
        .from('drive_sessions')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (error || !sessionData) {
        return jsonResponse({ error: 'Session token not found. Check the code and try again.' }, 404);
      }

      const session = sessionData as DriveSessionRow;
      if (session.status !== 'active' || new Date(session.expires_at).getTime() <= Date.now()) {
        if (session.status === 'active') {
          await cleanupSessionResources(supabaseAdmin, session.id);
        }
        return jsonResponse({ error: 'This Drive session has expired or ended.' }, 410);
      }

      if (session.has_password) {
        if (!password) {
          return jsonResponse({ error: 'This session requires a password.' }, 401);
        }
        if (!session.password_salt || !session.password_hash) {
          return jsonResponse({ error: 'Session credentials are invalid.' }, 500);
        }
        const ok = await verifyPassword(password, session.password_salt, session.password_hash);
        if (!ok) {
          return jsonResponse({ error: 'Incorrect session password.' }, 401);
        }
      }

      const capabilityToken = await signCapabilityToken(session.id, session.expires_at, serviceRoleKey);
      const snapshot = await fetchSnapshot(supabaseAdmin, session);
      return jsonResponse({
        capabilityToken,
        ...snapshot,
      });
    }

    const authCheck = await requireActiveSession(supabaseAdmin, body.capabilityToken, serviceRoleKey);
    if ('response' in authCheck) {
      return authCheck.response;
    }
    const { session } = authCheck;

    if (action === 'sync') {
      const snapshot = await fetchSnapshot(supabaseAdmin, session);
      return jsonResponse(snapshot);
    }

    if (action === 'create-upload-url') {
      const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
      const mimeType = typeof body.mimeType === 'string' && body.mimeType.trim()
        ? body.mimeType.trim()
        : 'application/octet-stream';
      const sizeBytes = Number(body.sizeBytes);

      if (!fileName) {
        return jsonResponse({ error: 'File name is required.' }, 400);
      }
      if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_SINGLE_FILE_BYTES) {
        return jsonResponse({ error: 'Each uploaded file must be 50 MB or smaller.' }, 400);
      }

      const { data: existingFiles } = await supabaseAdmin
        .from('drive_files')
        .select('size_bytes')
        .eq('session_id', session.id);

      const currentCount = existingFiles?.length ?? 0;
      const currentBytes = (existingFiles ?? []).reduce(
        (sum: number, row: { size_bytes: number }) => sum + Number(row.size_bytes),
        0
      );

      if (currentCount >= MAX_SESSION_FILES) {
        return jsonResponse({ error: 'Session limit of 50 files reached.' }, 400);
      }
      if (currentBytes + sizeBytes > MAX_SESSION_BYTES) {
        return jsonResponse({ error: 'Session storage quota of 500.00 MB exceeded.' }, 400);
      }

      const safeName = sanitizeFileName(fileName);
      const storagePath = `${session.id}/${crypto.randomUUID()}-${safeName}`;
      const { data, error } = await supabaseAdmin.storage
        .from(DRIVE_BUCKET)
        .createSignedUploadUrl(storagePath);

      if (error || !data) {
        return jsonResponse({ error: error?.message ?? 'Failed to initialize upload.' }, 500);
      }

      return jsonResponse({
        storagePath,
        signedUrl: data.signedUrl,
        uploadToken: data.token,
        fileCategory: classifyFileCategory(fileName, mimeType),
      });
    }

    if (action === 'commit-file') {
      const fileName = typeof body.fileName === 'string' ? body.fileName.trim().slice(0, 255) : '';
      const mimeType = typeof body.mimeType === 'string' && body.mimeType.trim()
        ? body.mimeType.trim()
        : 'application/octet-stream';
      const sizeBytes = Number(body.sizeBytes);
      const storagePath = typeof body.storagePath === 'string' ? body.storagePath.trim() : '';
      const uploadedBy = typeof body.uploadedBy === 'string' && body.uploadedBy.trim()
        ? body.uploadedBy.trim().slice(0, 80)
        : 'Device';

      if (!fileName || !storagePath.startsWith(`${session.id}/`)) {
        return jsonResponse({ error: 'Invalid upload metadata.' }, 400);
      }
      if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_SINGLE_FILE_BYTES) {
        return jsonResponse({ error: 'File exceeds the 50 MB per-file limit.' }, 400);
      }

      const { data: existingFiles } = await supabaseAdmin
        .from('drive_files')
        .select('size_bytes')
        .eq('session_id', session.id);

      const currentCount = existingFiles?.length ?? 0;
      const currentBytes = (existingFiles ?? []).reduce(
        (sum: number, row: { size_bytes: number }) => sum + Number(row.size_bytes),
        0
      );

      if (currentCount >= MAX_SESSION_FILES || currentBytes + sizeBytes > MAX_SESSION_BYTES) {
        await supabaseAdmin.storage.from(DRIVE_BUCKET).remove([storagePath]);
        return jsonResponse({ error: 'Session storage or file count limit reached.' }, 400);
      }

      const ownerUserId = await resolveOptionalUserId(supabaseAdmin, req);
      const fileCategory = classifyFileCategory(fileName, mimeType);
      const { error: insertError } = await supabaseAdmin.from('drive_files').insert({
        session_id: session.id,
        owner_user_id: ownerUserId ?? session.owner_user_id,
        file_name: fileName,
        mime_type: mimeType,
        file_category: fileCategory,
        size_bytes: Math.round(sizeBytes),
        storage_path: storagePath,
        uploaded_by: uploadedBy,
      });

      if (insertError) {
        return jsonResponse({ error: insertError.message }, 400);
      }

      const snapshot = await fetchSnapshot(supabaseAdmin, session);
      return jsonResponse(snapshot, 201);
    }

    if (action === 'download-file') {
      const fileId = typeof body.fileId === 'string' ? body.fileId.trim() : '';
      if (!fileId) {
        return jsonResponse({ error: 'File ID is required.' }, 400);
      }

      const { data: fileRow, error } = await supabaseAdmin
        .from('drive_files')
        .select('*')
        .eq('id', fileId)
        .eq('session_id', session.id)
        .maybeSingle();

      if (error || !fileRow) {
        return jsonResponse({ error: 'File not found in this session.' }, 404);
      }

      const typedFile = fileRow as DriveFileRow;
      const { data: signed, error: urlError } = await supabaseAdmin.storage
        .from(DRIVE_BUCKET)
        .createSignedUrl(typedFile.storage_path, 120, { download: typedFile.file_name });

      if (urlError || !signed) {
        return jsonResponse({ error: urlError?.message ?? 'Could not generate download link.' }, 500);
      }

      return jsonResponse({ downloadUrl: signed.signedUrl, fileName: typedFile.file_name });
    }

    if (action === 'delete-file') {
      const fileId = typeof body.fileId === 'string' ? body.fileId.trim() : '';
      if (!fileId) {
        return jsonResponse({ error: 'File ID is required.' }, 400);
      }

      const { data: fileRow } = await supabaseAdmin
        .from('drive_files')
        .select('*')
        .eq('id', fileId)
        .eq('session_id', session.id)
        .maybeSingle();

      if (!fileRow) {
        return jsonResponse({ error: 'File not found in this session.' }, 404);
      }

      const typedFile = fileRow as DriveFileRow;
      await supabaseAdmin.storage.from(DRIVE_BUCKET).remove([typedFile.storage_path]);
      await supabaseAdmin.from('drive_files').delete().eq('id', typedFile.id).eq('session_id', session.id);

      const snapshot = await fetchSnapshot(supabaseAdmin, session);
      return jsonResponse(snapshot);
    }

    if (action === 'add-clipboard') {
      const content = typeof body.content === 'string' ? body.content.trim() : '';
      const createdBy = typeof body.createdBy === 'string' && body.createdBy.trim()
        ? body.createdBy.trim().slice(0, 80)
        : 'Device';

      if (!content || content.length > 20000) {
        return jsonResponse({ error: 'Clipboard text must be between 1 and 20,000 characters.' }, 400);
      }

      const ownerUserId = await resolveOptionalUserId(supabaseAdmin, req);
      const { error: insertError } = await supabaseAdmin.from('drive_clipboard_items').insert({
        session_id: session.id,
        owner_user_id: ownerUserId ?? session.owner_user_id,
        content,
        created_by: createdBy,
      });

      if (insertError) {
        return jsonResponse({ error: insertError.message }, 400);
      }

      const snapshot = await fetchSnapshot(supabaseAdmin, session);
      return jsonResponse(snapshot, 201);
    }

    if (action === 'delete-clipboard') {
      const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
      if (!itemId) {
        return jsonResponse({ error: 'Clipboard item ID is required.' }, 400);
      }

      await supabaseAdmin
        .from('drive_clipboard_items')
        .delete()
        .eq('id', itemId)
        .eq('session_id', session.id);

      const snapshot = await fetchSnapshot(supabaseAdmin, session);
      return jsonResponse(snapshot);
    }

    if (action === 'end') {
      if (session.lockdown_mode) {
        return jsonResponse(
          { error: 'Lockdown Mode prevents manual termination until the session timer expires.' },
          403
        );
      }

      await cleanupSessionResources(supabaseAdmin, session.id);
      return jsonResponse({ ended: true });
    }

    return jsonResponse({ error: 'Unsupported Enigma Drive action.' }, 400);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Unable to process Enigma Drive request.' },
      400
    );
  }
});
