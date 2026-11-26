import { isSupabaseConfigured, supabase } from '../lib/supabase';

export const DRIVE_STORAGE_QUOTA_BYTES = 500 * 1024 * 1024; // 500.00 MB
export const DRIVE_MAX_SINGLE_FILE_BYTES = 50 * 1024 * 1024; // 50.00 MB per object
export const DRIVE_MAX_FILES = 50;

const ACTIVE_DRIVE_STORAGE_KEY = 'enigma96_active_drive_session';
const DEVICE_ID_STORAGE_KEY = 'enigma96_drive_device_id';

export type DriveFileCategory = 'image' | 'document' | 'archive' | 'text' | 'other';

export interface DriveSession {
  id: string;
  token: string;
  hasPassword: boolean;
  durationMinutes: number;
  lockdownMode: boolean;
  status: 'active' | 'ended';
  createdAt: string;
  expiresAt: string;
}

export interface DriveFile {
  id: string;
  sessionId: string;
  fileName: string;
  mimeType: string;
  fileCategory: DriveFileCategory;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

export interface DriveClipboardItem {
  id: string;
  sessionId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface DriveSnapshot {
  session: DriveSession;
  files: DriveFile[];
  clipboardItems: DriveClipboardItem[];
}

export interface ActiveDriveState extends DriveSnapshot {
  capabilityToken: string;
  sessionPassword: string;
}

export interface DriveConnectedDevice {
  deviceId: string;
  deviceName: string;
  userLabel: string;
  joinedAt: string;
  isCurrentDevice?: boolean;
}

export function detectDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';

  let os = 'Desktop';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return `${browser} • ${os}`;
}

interface StartSessionPayload {
  durationMinutes: number;
  password: string;
  lockdownMode: boolean;
}

interface AccessSessionPayload {
  token: string;
  password: string;
}

export function formatMegabytes(bytes: number): string {
  return (Math.max(0, bytes) / (1024 * 1024)).toFixed(2);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function getOrCreateDriveDeviceId(): string {
  if (typeof window === 'undefined') return 'device-ssr';
  try {
    const existing = window.sessionStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const created =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `device-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return `device-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function loadStoredDriveSession(): ActiveDriveState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_DRIVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveDriveState>;
    if (
      !parsed ||
      typeof parsed.capabilityToken !== 'string' ||
      !parsed.session ||
      typeof parsed.session.id !== 'string' ||
      typeof parsed.session.token !== 'string'
    ) {
      return null;
    }
    if (new Date(parsed.session.expiresAt).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(ACTIVE_DRIVE_STORAGE_KEY);
      return null;
    }
    return {
      capabilityToken: parsed.capabilityToken,
      sessionPassword: typeof parsed.sessionPassword === 'string' ? parsed.sessionPassword : '',
      session: parsed.session,
      files: Array.isArray(parsed.files) ? parsed.files : [],
      clipboardItems: Array.isArray(parsed.clipboardItems) ? parsed.clipboardItems : [],
    };
  } catch {
    return null;
  }
}

export function saveStoredDriveSession(state: ActiveDriveState): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(ACTIVE_DRIVE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredDriveSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(ACTIVE_DRIVE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === 'object') {
    const maybeContext = (error as { context?: unknown }).context;
    if (maybeContext && typeof (maybeContext as Response).json === 'function') {
      try {
        const body = (await (maybeContext as Response).clone().json()) as { error?: unknown };
        if (typeof body?.error === 'string' && body.error.trim()) {
          return body.error;
        }
      } catch {
        // Fall through to generic message
      }
    }
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
  }
  return 'Unable to communicate with Enigma Drive service.';
}

async function invokeDrive<T>(body: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase configuration is missing. Connect Supabase to use Enigma Drive.');
  }

  const { data, error } = await supabase.functions.invoke<T>('enigma-drive', {
    body,
  });

  if (error) {
    const detail = await extractFunctionErrorMessage(error);
    throw new Error(detail);
  }

  if (!data) {
    throw new Error('Empty response received from Enigma Drive service.');
  }

  return data;
}

export async function startDriveSession(
  payload: StartSessionPayload
): Promise<ActiveDriveState> {
  const res = await invokeDrive<DriveSnapshot & { capabilityToken: string }>({
    action: 'start',
    durationMinutes: payload.durationMinutes,
    password: payload.password,
    lockdownMode: payload.lockdownMode,
  });

  const active: ActiveDriveState = {
    capabilityToken: res.capabilityToken,
    sessionPassword: payload.password,
    session: res.session,
    files: res.files ?? [],
    clipboardItems: res.clipboardItems ?? [],
  };
  saveStoredDriveSession(active);
  return active;
}

export async function accessDriveSession(
  payload: AccessSessionPayload
): Promise<ActiveDriveState> {
  const res = await invokeDrive<DriveSnapshot & { capabilityToken: string }>({
    action: 'access',
    token: payload.token.trim().toLowerCase(),
    password: payload.password,
  });

  const active: ActiveDriveState = {
    capabilityToken: res.capabilityToken,
    sessionPassword: payload.password,
    session: res.session,
    files: res.files ?? [],
    clipboardItems: res.clipboardItems ?? [],
  };
  saveStoredDriveSession(active);
  return active;
}

export async function syncDriveSession(capabilityToken: string): Promise<DriveSnapshot> {
  return invokeDrive<DriveSnapshot>({
    action: 'sync',
    capabilityToken,
  });
}

export async function uploadDriveFile(
  capabilityToken: string,
  file: File,
  uploadedBy: string
): Promise<DriveSnapshot> {
  if (file.size > DRIVE_MAX_SINGLE_FILE_BYTES) {
    throw new Error(`"${file.name}" exceeds the 50.00 MB per-file upload limit.`);
  }

  const init = await invokeDrive<{
    storagePath: string;
    signedUrl: string;
    uploadToken: string;
  }>({
    action: 'create-upload-url',
    capabilityToken,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  });

  const { error: uploadError } = await supabase.storage
    .from('enigma-drive')
    .uploadToSignedUrl(init.storagePath, init.uploadToken, file, {
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    throw new Error(uploadError.message || `Failed to upload "${file.name}".`);
  }

  return invokeDrive<DriveSnapshot>({
    action: 'commit-file',
    capabilityToken,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    storagePath: init.storagePath,
    uploadedBy,
  });
}

export async function getDriveFileDownloadUrl(
  capabilityToken: string,
  fileId: string
): Promise<{ downloadUrl: string; fileName: string }> {
  return invokeDrive<{ downloadUrl: string; fileName: string }>({
    action: 'download-file',
    capabilityToken,
    fileId,
  });
}

export async function deleteDriveFile(
  capabilityToken: string,
  fileId: string
): Promise<DriveSnapshot> {
  return invokeDrive<DriveSnapshot>({
    action: 'delete-file',
    capabilityToken,
    fileId,
  });
}

export async function addDriveClipboardItem(
  capabilityToken: string,
  content: string,
  createdBy: string
): Promise<DriveSnapshot> {
  return invokeDrive<DriveSnapshot>({
    action: 'add-clipboard',
    capabilityToken,
    content,
    createdBy,
  });
}

export async function deleteDriveClipboardItem(
  capabilityToken: string,
  itemId: string
): Promise<DriveSnapshot> {
  return invokeDrive<DriveSnapshot>({
    action: 'delete-clipboard',
    capabilityToken,
    itemId,
  });
}

export async function endDriveSession(capabilityToken: string): Promise<void> {
  await invokeDrive<{ ended: boolean }>({
    action: 'end',
    capabilityToken,
  });
  clearStoredDriveSession();
}
