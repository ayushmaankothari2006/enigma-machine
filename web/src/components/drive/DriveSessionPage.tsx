import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Check,
  Clipboard,
  Copy,
  Download,
  Eye,
  EyeOff,
  File as FileIcon,
  FileText,
  Folder,
  HardDrive,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Lock,
  Monitor,
  Plus,
  Search,
  Smartphone,
  Square,
  Timer,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  DRIVE_MAX_FILES,
  DRIVE_STORAGE_QUOTA_BYTES,
  formatCountdown,
  formatFileSize,
  formatMegabytes,
  type DriveClipboardItem,
  type DriveConnectedDevice,
  type DriveFile,
  type DriveFileCategory,
  type DriveSession,
} from '../../services/driveService';
import { FileTypeDropdown, type FileCategoryFilter } from './FileTypeDropdown';

export type DriveSidebarTab = 'home' | 'files' | 'board';

interface DriveSessionPageProps {
  session: DriveSession;
  sessionPassword: string;
  files: DriveFile[];
  clipboardItems: DriveClipboardItem[];
  connectedDevices: DriveConnectedDevice[];
  remainingMs: number;
  isEnding: boolean;
  onEndSession: () => Promise<void>;
  onUploadFiles: (fileList: File[]) => Promise<void>;
  onDownloadFile: (fileId: string) => Promise<void>;
  onDeleteFile: (fileId: string) => Promise<void>;
  onAddClipboard: (content: string) => Promise<void>;
  onDeleteClipboard: (itemId: string) => Promise<void>;
}

function formatDeviceLoggedTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Just now';
  }
}

function formatSharerNameOnly(createdBy: string): string {
  const trimmed = createdBy.trim();
  if (!trimmed || /^guest/i.test(trimmed)) return 'Guest';
  if (trimmed.includes('@')) {
    return trimmed.split('@')[0] || 'User';
  }
  return trimmed.split(/\s+/)[0] || trimmed;
}

function getFileIcon(category: DriveFileCategory) {
  switch (category) {
    case 'image':
      return <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />;
    case 'document':
      return <FileText className="w-4 h-4 text-blue-700 shrink-0" />;
    case 'archive':
      return <Archive className="w-4 h-4 text-orange-600 shrink-0" />;
    case 'text':
      return <FileText className="w-4 h-4 text-emerald-600 shrink-0" />;
    default:
      return <FileIcon className="w-4 h-4 text-slate-500 shrink-0" />;
  }
}

export const DriveSessionPage: React.FC<DriveSessionPageProps> = ({
  session,
  sessionPassword,
  files,
  clipboardItems,
  connectedDevices,
  remainingMs,
  isEnding,
  onEndSession,
  onUploadFiles,
  onDownloadFile,
  onDeleteFile,
  onAddClipboard,
  onDeleteClipboard,
}) => {
  const activeDevices = Math.max(1, connectedDevices.length);
  const [activeTab, setActiveTab] = useState<DriveSidebarTab>('home');
  const [copiedToken, setCopiedToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Files tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FileCategoryFilter>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [busyFileId, setBusyFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Board tab state
  const [clipboardDraft, setClipboardDraft] = useState('');
  const [isAddingClipboard, setIsAddingClipboard] = useState(false);
  const [busyClipboardId, setBusyClipboardId] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const copyTokenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyItemTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTokenTimerRef.current) clearTimeout(copyTokenTimerRef.current);
      if (copyItemTimerRef.current) clearTimeout(copyItemTimerRef.current);
    };
  }, []);

  const totalBytesUsed = useMemo(
    () => files.reduce((sum, f) => sum + f.sizeBytes, 0),
    [files]
  );
  const bytesFree = Math.max(0, DRIVE_STORAGE_QUOTA_BYTES - totalBytesUsed);
  const storagePercent = Math.min(
    100,
    Math.round((totalBytesUsed / DRIVE_STORAGE_QUOTA_BYTES) * 100)
  );
  const filesPercent = Math.min(
    100,
    Math.round((files.length / DRIVE_MAX_FILES) * 100)
  );
  const remainingFileSlots = Math.max(0, DRIVE_MAX_FILES - files.length);

  const filteredFiles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return files.filter((file) => {
      const matchesCategory = categoryFilter === 'all' || file.fileCategory === categoryFilter;
      const matchesSearch = !query || file.fileName.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [files, searchQuery, categoryFilter]);

  const handleCopyToken = async () => {
    setActionError(null);
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(session.token);
      setCopiedToken(true);
      if (copyTokenTimerRef.current) clearTimeout(copyTokenTimerRef.current);
      copyTokenTimerRef.current = setTimeout(() => setCopiedToken(false), 1800);
    } catch {
      setActionError('Unable to copy session token automatically. Please copy it manually.');
    }
  };

  const handleEndClick = async () => {
    setActionError(null);
    try {
      await onEndSession();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to end session.');
    }
  };

  const processFileUpload = async (fileList: FileList | File[]) => {
    const picked = Array.from(fileList);
    if (picked.length === 0) return;

    setActionError(null);
    setIsUploading(true);
    try {
      await onUploadFiles(picked);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClipboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = clipboardDraft.trim();
    if (!text) return;

    setActionError(null);
    setIsAddingClipboard(true);
    try {
      await onAddClipboard(text);
      setClipboardDraft('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add clipboard item.');
    } finally {
      setIsAddingClipboard(false);
    }
  };

  const handleCopyItem = async (item: DriveClipboardItem) => {
    setActionError(null);
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(item.content);
      setCopiedItemId(item.id);
      if (copyItemTimerRef.current) clearTimeout(copyItemTimerRef.current);
      copyItemTimerRef.current = setTimeout(() => setCopiedItemId(null), 1600);
    } catch {
      setActionError('Unable to copy clipboard item automatically. Please copy it manually.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {actionError && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50/95 border border-red-200 px-4 py-2.5 text-xs font-medium text-red-700"
        >
          {actionError}
        </div>
      )}

      {/* Main 2-Column Session Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-stretch">
        {/* Left Sidebar: Timer, End, Navigation */}
        <aside className="clay-card p-4 sm:p-5 flex flex-col justify-start gap-4">
          <div className="text-center space-y-2 pb-4 border-b border-blue-100/90">
            <Timer className="w-8 h-8 text-blue-800 mx-auto" />
            <div>
              <div
                aria-label="Session time remaining"
                className="text-2xl sm:text-3xl font-bold text-blue-950 tracking-wider tabular-nums"
              >
                {formatCountdown(remainingMs)}
              </div>
              <p className="text-xs font-normal text-slate-500 mt-0.5">time left</p>
            </div>

            <button
              type="button"
              onClick={handleEndClick}
              disabled={session.lockdownMode || isEnding}
              title={
                session.lockdownMode
                  ? 'Lockdown Mode prevents manual termination until timer expiration'
                  : 'End active session'
              }
              className="clay-btn-orange w-full py-2.5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isEnding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Ending...</span>
                </>
              ) : session.lockdownMode ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-white" />
                  <span>Locked</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 fill-white text-white" />
                  <span>End</span>
                </>
              )}
            </button>
          </div>

          {/* Sidebar Nav Tabs */}
          <nav
            role="tablist"
            aria-label="Enigma Drive sections"
            className="grid grid-cols-3 lg:grid-cols-1 gap-1.5"
          >
            {(
              [
                { id: 'home', label: 'Home', icon: Home, count: 0 },
                { id: 'files', label: 'Files', icon: Folder, count: files.length },
                { id: 'board', label: 'Board', icon: LayoutGrid, count: clipboardItems.length },
              ] as const
            ).map(({ id, label, icon: Icon, count }) => {
              const selected = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center justify-center lg:justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-blue-50/95 border border-blue-200/90 text-blue-700 shadow-sm'
                      : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-blue-900'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        selected ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    />
                    <span>{label}</span>
                  </span>
                  {count > 0 && (
                    <span className="clay-pill-blue px-2 py-0.5 text-[10px] leading-none">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Panel: Home / Files / Board */}
        <section className="clay-card p-5 sm:p-6 flex flex-col min-h-[420px] min-w-0">
          {activeTab === 'home' && (
            <div className="flex-1 flex flex-col space-y-5">
              {/* Session Details Header with Token Copy on Right */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="w-1.5 h-6 rounded-full bg-blue-600 shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-blue-950">Session Details</h2>
                  {session.lockdownMode && (
                    <span className="clay-pill-orange px-2.5 py-0.5 text-[10px] inline-flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3" />
                      Lockdown
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="clay-btn-white flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-left shrink-0"
                  aria-label={`Copy session token ${session.token}`}
                  title="Tap to copy session token"
                >
                  <div className="leading-tight min-w-[11ch]">
                    <div className="text-xs sm:text-sm font-bold text-blue-950 tracking-wide">
                      {session.token}
                    </div>
                    <div
                      className={`text-[10px] font-medium whitespace-nowrap ${
                        copiedToken ? 'text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      {copiedToken ? 'Copied!' : 'Tap to copy'}
                    </div>
                  </div>
                  {copiedToken ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-blue-800 shrink-0" />
                  )}
                </button>
              </div>

              {/* Password Field Row */}
              <div className="clay-well px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-950 shrink-0">
                    <Lock className="w-4 h-4 text-blue-900" />
                    <span>Password</span>
                  </div>
                  <span
                    data-testid="drive-session-password-value"
                    className="text-xs sm:text-sm font-medium text-blue-950 truncate tracking-wide"
                  >
                    {!session.hasPassword
                      ? 'No password set'
                      : showPassword
                      ? sessionPassword || 'Password protected'
                      : '•••••••••••••'}
                  </span>
                </div>

                {session.hasPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-blue-800 hover:bg-white cursor-pointer transition-colors shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Active Devices + Storage Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 flex-1">
                {/* Active Devices Bay */}
                <div className="clay-bay p-4 sm:p-5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Monitor className="w-5 h-5 text-blue-800 shrink-0" />
                      <h3 className="text-sm sm:text-base font-bold text-blue-950">Active Devices</h3>
                    </div>
                    <span className="text-xl font-black text-blue-950 tabular-nums">
                      {activeDevices}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
                      <span
                        aria-hidden="true"
                        className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                      />
                      <span>
                        {activeDevices} {activeDevices === 1 ? 'Device' : 'Devices'} connected
                      </span>
                    </div>

                    <ul
                      aria-label="Logged devices"
                      className="max-h-[140px] overflow-y-auto space-y-1.5 pr-0.5"
                    >
                      {connectedDevices.map((device) => {
                        const isMobile = /iOS|Android/i.test(device.deviceName);
                        const DeviceIcon = isMobile ? Smartphone : Monitor;
                        return (
                          <li
                            key={device.deviceId}
                            className="clay-well px-3 py-2 rounded-xl flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                aria-hidden="true"
                                className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                              />
                              <DeviceIcon className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <div className="min-w-0 leading-tight">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-bold text-blue-950 truncate">
                                    {device.deviceName}
                                  </span>
                                  {device.isCurrentDevice && (
                                    <span className="clay-pill-blue px-1.5 py-0.5 text-[9px] shrink-0">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-normal text-slate-500 truncate">
                                  {device.userLabel}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-semibold text-slate-500 shrink-0 tabular-nums">
                              {formatDeviceLoggedTime(device.joinedAt)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Storage Bay */}
                <div className="clay-bay p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <HardDrive className="w-5 h-5 text-blue-800 shrink-0" />
                    <h3 className="text-sm sm:text-base font-bold text-blue-950">Storage</h3>
                  </div>

                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                        <span>Storage Used</span>
                        <span>{storagePercent}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-blue-100/80 overflow-hidden border border-blue-200/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                          style={{ width: `${storagePercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        {formatMegabytes(totalBytesUsed)} MB of 500.00 MB | {formatMegabytes(bytesFree)} MB free
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                        <span>Files Count</span>
                        <span>{filesPercent}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-blue-100/80 overflow-hidden border border-blue-200/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${filesPercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] font-normal text-slate-500">
                        {files.length} of {DRIVE_MAX_FILES} files | {remainingFileSlots} remaining
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="flex-1 flex flex-col space-y-4">
              <h2 className="sr-only">Session Files</h2>
              {/* Top Search, Custom Clay Type Dropdown & Upload Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <div className="clay-well flex-1 px-3.5 py-2 flex items-center gap-2 focus-within:border-blue-400">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for files"
                    aria-label="Search for files"
                    className="w-full bg-transparent text-xs sm:text-sm font-medium text-blue-950 placeholder:text-slate-400 focus:outline-none select-text"
                  />
                </div>

                <FileTypeDropdown value={categoryFilter} onChange={setCategoryFilter} />

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      void processFileUpload(e.target.files);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="clay-btn-blue px-4 py-2 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-white" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>

              {/* Files Dropzone / List */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.length) {
                    void processFileUpload(e.dataTransfer.files);
                  }
                }}
                className={`clay-well p-4 sm:p-6 flex-1 min-h-[290px] flex flex-col transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50/70' : ''
                }`}
              >
                {filteredFiles.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3">
                    <div className="relative">
                      <svg
                        viewBox="0 0 96 80"
                        className="w-24 h-20 drop-shadow-[0_10px_18px_rgba(37,99,235,0.2)]"
                        aria-hidden="true"
                      >
                        <rect x="8" y="10" width="12" height="12" rx="3" fill="#dbeafe" />
                        <rect x="76" y="14" width="11" height="11" rx="3" fill="#bfdbfe" />
                        <rect x="64" y="4" width="8" height="8" rx="2" fill="#e0e7ff" />
                        <path
                          d="M18 22h22l6 7h30a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6Z"
                          fill="#60a5fa"
                        />
                        <rect x="12" y="30" width="70" height="39" rx="7" fill="#93c5fd" />
                      </svg>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-blue-950">
                      {files.length === 0 ? 'No files here' : 'No matching files'}
                    </p>
                    <p className="text-[11px] font-normal text-slate-500">
                      {files.length === 0
                        ? 'Drag and drop files here or click Upload (max 50 MB per file).'
                        : 'Try clearing your search or changing the Type filter.'}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {filteredFiles.map((file) => {
                      const isBusy = busyFileId === file.id;
                      return (
                        <li
                          key={file.id}
                          className="clay-bay px-3.5 py-2.5 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {getFileIcon(file.fileCategory)}
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-blue-950 truncate">
                                {file.fileName}
                              </p>
                              <p className="text-[11px] font-normal text-slate-500">
                                {formatFileSize(file.sizeBytes)} • {file.uploadedBy}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setActionError(null);
                                setBusyFileId(file.id);
                                try {
                                  await onDownloadFile(file.id);
                                } catch (err) {
                                  setActionError(
                                    err instanceof Error ? err.message : 'Download failed.'
                                  );
                                } finally {
                                  setBusyFileId(null);
                                }
                              }}
                              className="clay-btn-white px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>Download</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setActionError(null);
                                setBusyFileId(file.id);
                                try {
                                  await onDeleteFile(file.id);
                                } catch (err) {
                                  setActionError(
                                    err instanceof Error ? err.message : 'Delete failed.'
                                  );
                                } finally {
                                  setBusyFileId(null);
                                }
                              }}
                              aria-label={`Delete ${file.fileName}`}
                              className="clay-btn-white p-1.5 text-orange-600 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'board' && (
            <div className="flex-1 flex flex-col space-y-4 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="w-1.5 h-6 rounded-full bg-blue-600 shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-blue-950">Add to Clipboard</h2>
                </div>
              </div>

              {/* Clipboard Input Bar */}
              <form onSubmit={handleClipboardSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <div className="clay-well flex-1 px-3.5 py-2 focus-within:border-blue-400">
                  <textarea
                    rows={2}
                    value={clipboardDraft}
                    onChange={(e) => setClipboardDraft(e.target.value)}
                    placeholder="Type or paste snippet to sync across devices..."
                    aria-label="Clipboard snippet text"
                    className="w-full bg-transparent text-xs sm:text-sm font-medium text-blue-950 placeholder:text-slate-400 resize-none focus:outline-none select-text"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!clipboardDraft.trim() || isAddingClipboard}
                  className="clay-btn-blue px-4 py-2.5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingClipboard ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-white" />
                      <span>Add Item</span>
                    </>
                  )}
                </button>
              </form>

              {/* Clipboard Items Container */}
              <div className="clay-well p-4 sm:p-6 flex-1 min-h-[240px] flex flex-col min-w-0">
                {clipboardItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-3">
                    <div className="relative">
                      <Clipboard className="w-14 h-14 text-blue-600 stroke-[2.2]" />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-blue-950">
                      No clipboard items yet.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5 min-w-0 w-full">
                    {clipboardItems.map((item, index) => {
                      const isCopied = copiedItemId === item.id;
                      const isExpanded = Boolean(expandedItems[item.id]);
                      return (
                        <li
                          key={item.id}
                          className="clay-bay px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2.5 min-w-0 w-full"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedItems((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                            aria-expanded={isExpanded}
                            title={isExpanded ? 'Click to collapse' : 'Click to expand full text'}
                            className={`min-w-0 flex-1 overflow-hidden text-left cursor-pointer focus:outline-none py-0.5 flex ${
                              isExpanded ? 'items-start' : 'items-center'
                            } gap-2`}
                          >
                            <span className="text-xs sm:text-sm font-bold text-blue-600 shrink-0 tabular-nums">
                              {index + 1}.
                            </span>
                            {isExpanded ? (
                              <span className="text-xs sm:text-sm font-medium text-blue-950 whitespace-pre-wrap break-all sm:break-words select-text flex-1 min-w-0">
                                {item.content}
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm font-medium text-blue-950 block flex-1 min-w-0 truncate select-text">
                                {item.content}
                              </span>
                            )}
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleCopyItem(item);
                              }}
                              aria-label={isCopied ? 'Copied clipboard item' : 'Copy clipboard item'}
                              title={isCopied ? 'Copied!' : 'Copy'}
                              className="clay-btn-white p-2 rounded-xl text-blue-700 inline-flex items-center justify-center cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-blue-700" />
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={busyClipboardId === item.id}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setActionError(null);
                                setBusyClipboardId(item.id);
                                try {
                                  await onDeleteClipboard(item.id);
                                } catch (err) {
                                  setActionError(
                                    err instanceof Error
                                      ? err.message
                                      : 'Unable to delete clipboard item.'
                                  );
                                } finally {
                                  setBusyClipboardId(null);
                                }
                              }}
                              aria-label="Delete clipboard item"
                              title="Delete"
                              className="clay-btn-white p-2 rounded-xl text-blue-700 cursor-pointer disabled:opacity-50"
                            >
                              {busyClipboardId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-blue-700" />
                              )}
                            </button>

                            <div className="pl-1.5 border-l border-blue-100/90 text-right leading-tight shrink-0">
                              <div className="text-[11px] font-bold text-blue-950 truncate max-w-[84px]">
                                {formatSharerNameOnly(item.createdBy)}
                              </div>
                              <div className="text-[10px] font-normal text-slate-500 tabular-nums">
                                {formatDeviceLoggedTime(item.createdAt)}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
