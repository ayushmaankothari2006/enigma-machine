import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  accessDriveSession,
  addDriveClipboardItem,
  clearStoredDriveSession,
  deleteDriveClipboardItem,
  deleteDriveFile,
  detectDeviceName,
  endDriveSession,
  getDriveFileDownloadUrl,
  getOrCreateDriveDeviceId,
  loadStoredDriveSession,
  saveStoredDriveSession,
  startDriveSession,
  syncDriveSession,
  uploadDriveFile,
  type ActiveDriveState,
  type DriveConnectedDevice,
  type DriveSnapshot,
} from '../../services/driveService';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { DriveEntryPage } from './DriveEntryPage';
import { DriveSessionPage } from './DriveSessionPage';

interface EnigmaDriveProps {
  userLabel?: string;
}

function buildLocalDevice(userLabel: string, joinedAt: string): DriveConnectedDevice {
  return {
    deviceId: getOrCreateDriveDeviceId(),
    deviceName: detectDeviceName(),
    userLabel,
    joinedAt,
    isCurrentDevice: true,
  };
}

export const EnigmaDrive: React.FC<EnigmaDriveProps> = ({ userLabel = 'Device' }) => {
  const [activeState, setActiveState] = useState<ActiveDriveState | null>(() =>
    loadStoredDriveSession()
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const localJoinedAtRef = useRef<string>(
    loadStoredDriveSession()?.session.createdAt ?? new Date().toISOString()
  );
  const [connectedDevices, setConnectedDevices] = useState<DriveConnectedDevice[]>(() => [
    buildLocalDevice(userLabel, localJoinedAtRef.current),
  ]);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const session = activeState?.session ?? null;
  const sessionId = session?.id ?? null;
  const capabilityToken = activeState?.capabilityToken ?? null;

  const applySnapshot = useCallback((snapshot: DriveSnapshot) => {
    setActiveState((prev) => {
      if (!prev) return prev;
      const next: ActiveDriveState = {
        ...prev,
        session: snapshot.session,
        files: snapshot.files,
        clipboardItems: snapshot.clipboardItems,
      };
      saveStoredDriveSession(next);
      return next;
    });
  }, []);

  const broadcastEvent = useCallback(async (eventName: 'drive-update' | 'session-ended') => {
    const channel = channelRef.current;
    if (!channel) return;
    try {
      await channel.send({
        type: 'broadcast',
        event: eventName,
        payload: { timestamp: Date.now() },
      });
    } catch {
      // Ignore transient broadcast failures
    }
  }, []);

  // Keep local device entry synced when userLabel changes
  useEffect(() => {
    const localId = getOrCreateDriveDeviceId();
    setConnectedDevices((prev) => {
      const hasLocal = prev.some((d) => d.deviceId === localId);
      if (!hasLocal) {
        return [buildLocalDevice(userLabel, localJoinedAtRef.current), ...prev];
      }
      return prev.map((d) =>
        d.deviceId === localId
          ? { ...d, userLabel, deviceName: detectDeviceName(), isCurrentDevice: true }
          : d
      );
    });
  }, [userLabel]);

  // Countdown tick & automatic expiration
  useEffect(() => {
    if (!session) return;

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (new Date(session.expiresAt).getTime() <= current) {
        clearStoredDriveSession();
        setActiveState(null);
        setConnectedDevices([buildLocalDevice(userLabel, new Date().toISOString())]);
        setSessionNotice('Your Drive session expired and its files were cleared.');
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session, userLabel]);

  // Supabase Realtime Presence + Broadcast sync across devices
  useEffect(() => {
    if (!sessionId || !capabilityToken || !isSupabaseConfigured) return;
    if (typeof supabase.channel !== 'function') return;

    let cancelled = false;
    const deviceId = getOrCreateDriveDeviceId();
    const deviceName = detectDeviceName();
    const joinedAt = localJoinedAtRef.current;

    const channel = supabase.channel(`enigma-drive:${sessionId}`, {
      config: { presence: { key: deviceId } },
    });
    channelRef.current = channel;

    const refreshFromServer = async () => {
      if (cancelled) return;
      try {
        const snapshot = await syncDriveSession(capabilityToken);
        if (!cancelled) {
          applySnapshot(snapshot);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : '';
        if (
          !cancelled &&
          (msg.includes('ended') || msg.includes('expired') || msg.includes('not found'))
        ) {
          clearStoredDriveSession();
          setActiveState(null);
          setConnectedDevices([buildLocalDevice(userLabel, new Date().toISOString())]);
          setSessionNotice('The active Drive session has ended.');
        }
      }
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        if (cancelled) return;
        const presenceState = channel.presenceState<Record<string, unknown>>();
        const list: DriveConnectedDevice[] = [];
        for (const [key, entries] of Object.entries(presenceState)) {
          const meta: Record<string, unknown> =
            Array.isArray(entries) && entries.length > 0 ? entries[0] : {};
          const entryId = typeof meta.deviceId === 'string' ? meta.deviceId : key;
          list.push({
            deviceId: entryId,
            deviceName:
              typeof meta.deviceName === 'string' ? meta.deviceName : 'Connected Device',
            userLabel: typeof meta.userLabel === 'string' ? meta.userLabel : 'Device',
            joinedAt: typeof meta.joinedAt === 'string' ? meta.joinedAt : joinedAt,
            isCurrentDevice: entryId === deviceId,
          });
        }
        if (list.length === 0) {
          list.push({
            deviceId,
            deviceName,
            userLabel,
            joinedAt,
            isCurrentDevice: true,
          });
        } else {
          list.sort((a, b) => Number(Boolean(b.isCurrentDevice)) - Number(Boolean(a.isCurrentDevice)));
        }
        setConnectedDevices(list);
      })
      .on('broadcast', { event: 'drive-update' }, () => {
        void refreshFromServer();
      })
      .on('broadcast', { event: 'session-ended' }, () => {
        if (cancelled) return;
        clearStoredDriveSession();
        setActiveState(null);
        setConnectedDevices([buildLocalDevice(userLabel, new Date().toISOString())]);
        setSessionNotice('The active Drive session was ended.');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel.track({
            deviceId,
            deviceName,
            userLabel,
            joinedAt,
          });
        }
      });

    void refreshFromServer();

    const syncInterval = window.setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        void refreshFromServer();
      }
    }, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(syncInterval);
      channelRef.current = null;
      if (typeof supabase.removeChannel === 'function') {
        void supabase.removeChannel(channel);
      }
    };
  }, [sessionId, capabilityToken, userLabel, applySnapshot]);

  const handleStartSession = async (params: {
    durationMinutes: number;
    password: string;
    lockdownMode: boolean;
  }) => {
    setSessionNotice(null);
    const created = await startDriveSession(params);
    const joinedAt = new Date().toISOString();
    localJoinedAtRef.current = joinedAt;
    setNowMs(Date.now());
    setConnectedDevices([buildLocalDevice(userLabel, joinedAt)]);
    setActiveState(created);
  };

  const handleAccessSession = async (params: { token: string; password: string }) => {
    setSessionNotice(null);
    const joined = await accessDriveSession(params);
    const joinedAt = new Date().toISOString();
    localJoinedAtRef.current = joinedAt;
    setNowMs(Date.now());
    setConnectedDevices([buildLocalDevice(userLabel, joinedAt)]);
    setActiveState(joined);
  };

  const handleEndSession = async () => {
    if (!activeState) return;
    setIsEnding(true);
    try {
      await endDriveSession(activeState.capabilityToken);
      await broadcastEvent('session-ended');
      clearStoredDriveSession();
      setActiveState(null);
      setConnectedDevices([buildLocalDevice(userLabel, new Date().toISOString())]);
    } finally {
      setIsEnding(false);
    }
  };

  const handleUploadFiles = async (fileList: File[]) => {
    if (!activeState) return;
    let latestSnapshot: DriveSnapshot | null = null;
    for (const file of fileList) {
      latestSnapshot = await uploadDriveFile(activeState.capabilityToken, file, userLabel);
    }
    if (latestSnapshot) {
      applySnapshot(latestSnapshot);
      await broadcastEvent('drive-update');
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    if (!activeState) return;
    const { downloadUrl, fileName } = await getDriveFileDownloadUrl(
      activeState.capabilityToken,
      fileId
    );
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!activeState) return;
    const snapshot = await deleteDriveFile(activeState.capabilityToken, fileId);
    applySnapshot(snapshot);
    await broadcastEvent('drive-update');
  };

  const handleAddClipboard = async (content: string) => {
    if (!activeState) return;
    const snapshot = await addDriveClipboardItem(
      activeState.capabilityToken,
      content,
      userLabel
    );
    applySnapshot(snapshot);
    await broadcastEvent('drive-update');
  };

  const handleDeleteClipboard = async (itemId: string) => {
    if (!activeState) return;
    const snapshot = await deleteDriveClipboardItem(activeState.capabilityToken, itemId);
    applySnapshot(snapshot);
    await broadcastEvent('drive-update');
  };

  if (!activeState) {
    return (
      <div className="space-y-3">
        {sessionNotice && (
          <div
            role="status"
            className="max-w-5xl mx-auto rounded-2xl bg-blue-50/95 border border-blue-200 px-4 py-2 text-xs font-medium text-blue-900 flex items-center justify-between gap-3"
          >
            <span>{sessionNotice}</span>
            <button
              type="button"
              onClick={() => setSessionNotice(null)}
              className="text-blue-700 font-bold hover:underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
        <DriveEntryPage
          onStartSession={handleStartSession}
          onAccessSession={handleAccessSession}
        />
      </div>
    );
  }

  const remainingMs = Math.max(0, new Date(activeState.session.expiresAt).getTime() - nowMs);

  return (
    <DriveSessionPage
      session={activeState.session}
      sessionPassword={activeState.sessionPassword}
      files={activeState.files}
      clipboardItems={activeState.clipboardItems}
      connectedDevices={connectedDevices}
      remainingMs={remainingMs}
      isEnding={isEnding}
      onEndSession={handleEndSession}
      onUploadFiles={handleUploadFiles}
      onDownloadFile={handleDownloadFile}
      onDeleteFile={handleDeleteFile}
      onAddClipboard={handleAddClipboard}
      onDeleteClipboard={handleDeleteClipboard}
    />
  );
};
