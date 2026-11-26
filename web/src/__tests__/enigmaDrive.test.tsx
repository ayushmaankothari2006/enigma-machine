// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

vi.setConfig({ testTimeout: 15000 });

const {
  mockInvoke,
  mockUploadToSignedUrl,
  mockChannel,
  mockRemoveChannel,
  mockChannelSend,
  mockChannelTrack,
  mockPresenceState,
} = vi.hoisted(() => {
  const channelSend = vi.fn().mockResolvedValue('ok');
  const channelTrack = vi.fn().mockResolvedValue('ok');
  const presenceState = vi.fn().mockReturnValue({ d1: [{}] });
  const channelObj: Record<string, unknown> = {
    on: vi.fn(),
    subscribe: vi.fn(),
    send: channelSend,
    track: channelTrack,
    presenceState,
  };
  (channelObj.on as ReturnType<typeof vi.fn>).mockReturnValue(channelObj);
  (channelObj.subscribe as ReturnType<typeof vi.fn>).mockImplementation((cb?: (s: string) => void) => {
    cb?.('SUBSCRIBED');
    return channelObj;
  });

  return {
    mockInvoke: vi.fn(),
    mockUploadToSignedUrl: vi.fn(),
    mockChannel: vi.fn().mockReturnValue(channelObj),
    mockRemoveChannel: vi.fn(),
    mockChannelSend: channelSend,
    mockChannelTrack: channelTrack,
    mockPresenceState: presenceState,
  };
});

vi.mock('../lib/supabase', async () => {
  const actual = await vi.importActual<typeof import('../lib/supabase')>('../lib/supabase');
  return {
    ...actual,
    isSupabaseConfigured: true,
    supabase: {
      functions: {
        invoke: mockInvoke,
      },
      storage: {
        from: () => ({
          uploadToSignedUrl: mockUploadToSignedUrl,
        }),
      },
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
  };
});

import { EnigmaDrive } from '../components/drive';

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-uuid-1',
    token: 'anedoo',
    hasPassword: true,
    durationMinutes: 30,
    lockdownMode: false,
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

describe('Enigma Drive Two-Page Workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    mockPresenceState.mockReturnValue({ d1: [{}] });
    mockUploadToSignedUrl.mockResolvedValue({ data: { path: 'session-uuid-1/test.txt' }, error: null });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders unified wavy duration slider, strength outline, mutually exclusive cards, and updated Page 2 controls', async () => {
    const activeSession = makeSession();
    const uploadedFile = {
      id: 'file-1',
      sessionId: activeSession.id,
      fileName: 'secret-notes.txt',
      mimeType: 'text/plain',
      fileCategory: 'text' as const,
      sizeBytes: 2048,
      uploadedBy: 'ada@example.com',
      createdAt: new Date().toISOString(),
    };
    const clipboardItem = {
      id: 'clip-1',
      sessionId: activeSession.id,
      content: 'ENIGMA-KEY-A16-B32',
      createdBy: 'ada@example.com',
      createdAt: new Date().toISOString(),
    };

    mockInvoke.mockImplementation(async (_fn: string, { body }: { body: Record<string, unknown> }) => {
      switch (body.action) {
        case 'start':
          return {
            data: {
              capabilityToken: 'cap-token-1',
              session: activeSession,
              files: [],
              clipboardItems: [],
            },
            error: null,
          };
        case 'sync':
          return {
            data: {
              session: activeSession,
              files: [],
              clipboardItems: [],
            },
            error: null,
          };
        case 'create-upload-url':
          return {
            data: {
              storagePath: 'session-uuid-1/u1-secret-notes.txt',
              signedUrl: 'https://storage.example.test/upload',
              uploadToken: 'signed-upload-token',
            },
            error: null,
          };
        case 'commit-file':
          return {
            data: {
              session: activeSession,
              files: [uploadedFile],
              clipboardItems: [],
            },
            error: null,
          };
        case 'delete-file':
          return {
            data: {
              session: activeSession,
              files: [],
              clipboardItems: [],
            },
            error: null,
          };
        case 'add-clipboard':
          return {
            data: {
              session: activeSession,
              files: [],
              clipboardItems: [clipboardItem],
            },
            error: null,
          };
        case 'delete-clipboard':
          return {
            data: {
              session: activeSession,
              files: [],
              clipboardItems: [],
            },
            error: null,
          };
        case 'end':
          return { data: { ended: true }, error: null };
        default:
          return { data: null, error: { message: 'Unexpected action' } };
      }
    });

    const { container } = render(<EnigmaDrive userLabel="ada@example.com" />);

    // Sync Ready and Active badges and 30 mins pill are removed
    expect(screen.queryByText(/Sync Ready/i)).toBeNull();
    expect(screen.queryByText(/^Active$/i)).toBeNull();
    expect(screen.queryByText('30 mins')).toBeNull();
    expect(screen.getByText(/Transfer files\. Share text\. Open a session/i)).toBeTruthy();

    // Mutually exclusive cards + default cursor focus on active card's primary field
    const durationSlider = screen.getByRole('slider', { name: /Session Duration/i }) as HTMLInputElement;
    expect(document.activeElement).toBe(durationSlider);
    const tokenInput = screen.getByLabelText(/Session Token/i) as HTMLInputElement;
    expect(tokenInput.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Switch to Access Session/i }));
    expect(tokenInput.disabled).toBe(false);
    await waitFor(() => {
      expect(document.activeElement).toBe(tokenInput);
    });
    const startPassInput = container.querySelector('#drive-start-password') as HTMLInputElement;
    expect(startPassInput.disabled).toBe(true);
    expect(startPassInput.placeholder).toContain('no password sessions also available');

    // Switch back to Start Your Session -> focuses duration slider
    fireEvent.click(screen.getByRole('button', { name: /Switch to Start Your Session/i }));
    expect(startPassInput.disabled).toBe(false);
    expect(tokenInput.disabled).toBe(true);
    await waitFor(() => {
      expect(document.activeElement).toBe(durationSlider);
    });

    // Unified wavy Session Duration slider + ticks
    expect(durationSlider.getAttribute('aria-valuetext')).toBe('30 mins');
    fireEvent.click(screen.getByRole('button', { name: '1h' }));
    expect(durationSlider.getAttribute('aria-valuetext')).toBe('1 hr');
    fireEvent.change(durationSlider, { target: { value: '1' } });
    expect(durationSlider.getAttribute('aria-valuetext')).toBe('30 mins');

    // Password strength border colors (red -> orange -> green -> weak still creatable)
    const passwordBox = screen.getByTestId('drive-start-password-box');
    fireEvent.change(startPassInput, { target: { value: 'abc' } });
    expect(screen.getByTestId('password-strength-label').textContent).toBe('Weak');
    expect(passwordBox.className).toContain('border-red-500');

    fireEvent.change(startPassInput, { target: { value: 'Abc123' } });
    expect(screen.getByTestId('password-strength-label').textContent).toBe('Medium');
    expect(passwordBox.className).toContain('border-orange-500');

    fireEvent.change(startPassInput, { target: { value: 'StrongPass#96' } });
    expect(screen.getByTestId('password-strength-label').textContent).toBe('Strong');
    expect(passwordBox.className).toContain('border-emerald-500');

    // Submit even with a weak password
    fireEvent.change(startPassInput, { target: { value: 'weak1' } });
    expect(screen.getByTestId('password-strength-label').textContent).toBe('Weak');
    fireEvent.click(screen.getByRole('button', { name: /^Start$/i }));

    // Page 2: Active Session top strip is removed; token button lives in Session Details right side
    expect(await screen.findByRole('heading', { name: /Session Details/i })).toBeTruthy();
    expect(screen.queryByText('Active Session')).toBeNull();
    expect(screen.getByText('anedoo')).toBeTruthy();
    expect(screen.getByText('Tap to copy')).toBeTruthy();
    expect(screen.getByText('1 Device connected')).toBeTruthy();
    const devicesList = screen.getByRole('list', { name: /Logged devices/i });
    expect(devicesList.textContent).toContain('ada@example.com');
    expect(devicesList.textContent).toContain('You');
    expect(devicesList.textContent).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    expect(mockChannelTrack).toHaveBeenCalled();

    // Reveal password in Session Details
    const pwdDisplay = screen.getByTestId('drive-session-password-value');
    expect(pwdDisplay.textContent).toBe('•••••••••••••');
    fireEvent.click(screen.getByRole('button', { name: /Show password/i }));
    expect(pwdDisplay.textContent).toBe('weak1');

    // Copy token inside Session Details header
    fireEvent.click(screen.getByRole('button', { name: /Copy session token anedoo/i }));
    expect(await screen.findByText('Copied!')).toBeTruthy();

    // Switch to Files tab and test custom Type dropdown UI + Upload
    fireEvent.click(screen.getByRole('tab', { name: /^Files/i }));
    expect(await screen.findByText('No files here')).toBeTruthy();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['hello enigma'], 'secret-notes.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    expect(await screen.findByText('secret-notes.txt')).toBeTruthy();
    expect(mockUploadToSignedUrl).toHaveBeenCalled();

    // Open custom Type dropdown listbox and filter by Images (hides text file), then All Types
    fireEvent.click(screen.getByRole('button', { name: /Filter files by type/i }));
    expect(await screen.findByRole('listbox', { name: /File categories/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: /^Images$/i }));
    expect(await screen.findByText('No matching files')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Filter files by type/i }));
    fireEvent.click(screen.getByRole('option', { name: /^All Types$/i }));
    expect(await screen.findByText('secret-notes.txt')).toBeTruthy();

    // Delete file
    fireEvent.click(screen.getByRole('button', { name: /Delete secret-notes\.txt/i }));
    expect(await screen.findByText('No files here')).toBeTruthy();

    // Switch to Board tab -> copy button is icon-only (no text)
    fireEvent.click(screen.getByRole('tab', { name: /^Board/i }));
    expect(await screen.findByText('No clipboard items yet.')).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Clipboard snippet text/i), {
      target: { value: 'ENIGMA-KEY-A16-B32' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Item/i }));

    expect(await screen.findByText('ENIGMA-KEY-A16-B32')).toBeTruthy();
    // Serial number (1.), sharer name-only (ada) + 12h AM/PM time shown beside dustbin, collapsed to 1 line by default
    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('ada')).toBeTruthy();
    const itemToggle = screen.getByRole('button', { name: /1\.\s*ENIGMA-KEY-A16-B32/i });
    expect(itemToggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/Shared by/i)).toBeNull();
    fireEvent.click(itemToggle);
    expect(itemToggle.getAttribute('aria-expanded')).toBe('true');

    const copyButton = screen.getByRole('button', { name: /Copy clipboard item/i });
    expect(copyButton.textContent?.trim()).toBe('');
    expect(copyButton.className).toContain('text-blue-700');
    fireEvent.click(copyButton);
    expect(await screen.findByRole('button', { name: /Copied clipboard item/i })).toBeTruthy();
    expect(screen.queryByText(/^Copy$/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Delete clipboard item/i }));
    expect(await screen.findByText('No clipboard items yet.')).toBeTruthy();

    // End session returns to Page 1
    fireEvent.click(screen.getByRole('button', { name: /^End$/i }));
    expect(await screen.findByRole('heading', { name: /Start Your Session/i })).toBeTruthy();
    expect(mockChannelSend).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'session-ended' })
    );
  });

  it('validates Access Session, handles access error, and enforces Lockdown Mode on End button', async () => {
    const lockedSession = makeSession({ lockdownMode: true, hasPassword: false });

    mockInvoke.mockImplementation(async (_fn: string, { body }: { body: Record<string, unknown> }) => {
      if (body.action === 'access' && body.password === 'wrong') {
        return {
          data: null,
          error: { message: 'Incorrect session password.' },
        };
      }
      if (body.action === 'access') {
        return {
          data: {
            capabilityToken: 'cap-locked',
            session: lockedSession,
            files: [],
            clipboardItems: [],
          },
          error: null,
        };
      }
      if (body.action === 'sync') {
        return {
          data: { session: lockedSession, files: [], clipboardItems: [] },
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const { container } = render(<EnigmaDrive />);

    // Activate Access Session card first
    fireEvent.click(screen.getByRole('button', { name: /Switch to Access Session/i }));

    // Missing token inline error
    fireEvent.click(screen.getByRole('button', { name: /^Access$/i }));
    expect(await screen.findByText(/Please enter a session token\./i)).toBeTruthy();

    // Wrong password error
    fireEvent.change(screen.getByLabelText(/Session Token/i), {
      target: { value: 'anedoo' },
    });
    const accessPassInput = container.querySelector('#drive-access-password') as HTMLInputElement;
    fireEvent.change(accessPassInput, {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Access$/i }));
    expect(await screen.findByText(/Incorrect session password\./i)).toBeTruthy();

    // Successful join enters Lockdown session where manual End is disabled
    fireEvent.change(accessPassInput, {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Access$/i }));

    expect(await screen.findByRole('heading', { name: /Session Details/i })).toBeTruthy();
    await waitFor(() => {
      const lockedButton = screen.getByRole('button', { name: /Locked/i }) as HTMLButtonElement;
      expect(lockedButton.disabled).toBe(true);
    });
  });
});
