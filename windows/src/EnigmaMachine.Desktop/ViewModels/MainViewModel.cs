using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Input;
using System.Windows.Threading;
using EnigmaMachine.Core.Engine;
using EnigmaMachine.Core.Export;
using EnigmaMachine.Desktop.Services;

namespace EnigmaMachine.Desktop.ViewModels;

public enum NotificationSeverity
{
    Info,
    Success,
    Warning,
    Error
}

public sealed class MainViewModel : ViewModelBase
{
    private string _inputText = string.Empty;
    private string _outputText = string.Empty;
    private bool _hasUnsupportedChars;
    private bool _isProcessing;
    private bool _isCopied;
    private string _copyButtonText = "Copy";
    private string _calculationTime = "0.00 ms";
    private string _statusMessage = "Ready - Offline Local CPU Processing";
    private ReflectorId _selectedReflector = ReflectorId.A;

    // InfoBar Notification Properties
    private bool _isNotificationVisible;
    private NotificationSeverity _notificationSeverity = NotificationSeverity.Info;
    private string _notificationTitle = string.Empty;
    private string _notificationMessage = string.Empty;

    private readonly DispatcherTimer _copyTimer;
    private readonly DispatcherTimer _debounceTimer;
    private readonly Random _random = new();
    private readonly IClipboardService _clipboardService;
    private CancellationTokenSource? _encryptionCts;

    public string InputText
    {
        get => _inputText;
        set
        {
            if (SetProperty(ref _inputText, value))
            {
                OnPropertyChanged(nameof(InputCharCount));
                ScheduleProcessEnigma();
            }
        }
    }

    public string OutputText
    {
        get => _outputText;
        private set
        {
            if (SetProperty(ref _outputText, value))
            {
                OnPropertyChanged(nameof(OutputCharCount));
            }
        }
    }

    public int InputCharCount => _inputText.Length;
    public int OutputCharCount => _outputText.Length;

    public bool HasUnsupportedChars
    {
        get => _hasUnsupportedChars;
        private set => SetProperty(ref _hasUnsupportedChars, value);
    }

    public bool IsProcessing
    {
        get => _isProcessing;
        private set => SetProperty(ref _isProcessing, value);
    }

    public bool IsCopied
    {
        get => _isCopied;
        private set => SetProperty(ref _isCopied, value);
    }

    public string CopyButtonText
    {
        get => _copyButtonText;
        private set => SetProperty(ref _copyButtonText, value);
    }

    public string CalculationTime
    {
        get => _calculationTime;
        private set => SetProperty(ref _calculationTime, value);
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public ReflectorId SelectedReflector
    {
        get => _selectedReflector;
        set
        {
            if (SetProperty(ref _selectedReflector, value))
            {
                ScheduleProcessEnigma();
            }
        }
    }

    public bool IsNotificationVisible
    {
        get => _isNotificationVisible;
        set => SetProperty(ref _isNotificationVisible, value);
    }

    public NotificationSeverity NotificationSeverity
    {
        get => _notificationSeverity;
        set => SetProperty(ref _notificationSeverity, value);
    }

    public string NotificationTitle
    {
        get => _notificationTitle;
        set => SetProperty(ref _notificationTitle, value);
    }

    public string NotificationMessage
    {
        get => _notificationMessage;
        set => SetProperty(ref _notificationMessage, value);
    }

    public IReadOnlyList<ReflectorId> AvailableReflectors { get; } = Enum.GetValues<ReflectorId>();

    public RotorSlotViewModel LeftRotor { get; }
    public RotorSlotViewModel MiddleRotor { get; }
    public RotorSlotViewModel RightRotor { get; }

    public AppTheme CurrentTheme => ThemeService.CurrentTheme;
    public string ThemeButtonText => CurrentTheme == AppTheme.Dark ? "Light" : "Dark";

    public ICommand ClearInputCommand { get; }
    public ICommand LoadSampleCommand { get; }
    public ICommand CopyOutputCommand { get; }
    public ICommand UseOutputAsInputCommand { get; }
    public ICommand ResetSettingsCommand { get; }
    public ICommand RandomizeSettingsCommand { get; }
    public ICommand DismissNotificationCommand { get; }
    public ICommand ToggleThemeCommand { get; }
    public ICommand ExportPdfCommand { get; }

    public MainViewModel() : this(null)
    {
    }

    public MainViewModel(IClipboardService? clipboardService)
    {
        _clipboardService = clipboardService ?? new WindowsClipboardService();

        ThemeService.ThemeChanged += _ =>
        {
            OnPropertyChanged(nameof(CurrentTheme));
            OnPropertyChanged(nameof(ThemeButtonText));
        };

        _copyTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(2)
        };
        _copyTimer.Tick += (_, _) =>
        {
            _copyTimer.Stop();
            IsCopied = false;
            CopyButtonText = "Copy";
        };

        // Debounce timer (35ms) to ensure smooth 60Hz-144Hz typing without dropping frames
        _debounceTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(35)
        };
        _debounceTimer.Tick += async (_, _) =>
        {
            _debounceTimer.Stop();
            await ExecuteProcessEnigmaAsync();
        };

        LeftRotor = new RotorSlotViewModel(RotorSlot.Left, RotorId.I, defaultPos: 0, defaultRing: 0, ScheduleProcessEnigma);
        MiddleRotor = new RotorSlotViewModel(RotorSlot.Middle, RotorId.II, defaultPos: 0, defaultRing: 0, ScheduleProcessEnigma);
        RightRotor = new RotorSlotViewModel(RotorSlot.Right, RotorId.III, defaultPos: 0, defaultRing: 0, ScheduleProcessEnigma);

        ClearInputCommand = new RelayCommand(ClearInput);
        LoadSampleCommand = new RelayCommand(LoadSample);
        CopyOutputCommand = new RelayCommand(CopyOutput);
        UseOutputAsInputCommand = new RelayCommand(UseOutputAsInput);
        ResetSettingsCommand = new RelayCommand(ResetSettings);
        RandomizeSettingsCommand = new RelayCommand(RandomizeSettings);
        DismissNotificationCommand = new RelayCommand(DismissNotification);
        ToggleThemeCommand = new RelayCommand(ToggleTheme);
        ExportPdfCommand = new RelayCommand(ExportPdf);

        // Initial sample
        LoadSample();
    }

    private void ToggleTheme()
    {
        var nextTheme = ThemeService.CurrentTheme == AppTheme.Dark ? AppTheme.Light : AppTheme.Dark;
        ThemeService.ApplyTheme(nextTheme);
    }

    public void ScheduleProcessEnigma()
    {
        _debounceTimer.Stop();
        _debounceTimer.Start();
    }

    public async Task ExecuteProcessEnigmaAsync()
    {
        // Cancel any pending or in-flight background encryption
        _encryptionCts?.Cancel();
        _encryptionCts?.Dispose();
        _encryptionCts = new CancellationTokenSource();
        var token = _encryptionCts.Token;

        string currentInput = _inputText;

        if (string.IsNullOrEmpty(currentInput))
        {
            OutputText = string.Empty;
            HasUnsupportedChars = false;
            CalculationTime = "0.00 ms";
            StatusMessage = "Ready - Offline Local CPU Processing";
            IsProcessing = false;
            return;
        }

        // Validate payload limits
        if (currentInput.Length > EnigmaValidator.MaxRecommendedPayloadLength)
        {
            ShowNotification(
                NotificationSeverity.Warning,
                "Large Payload Warning",
                $"Input length ({currentInput.Length:N0} characters) exceeds recommended bounds. Processing may take longer."
            );
        }

        var config = new EnigmaMachineConfig(
            Reflector: SelectedReflector,
            LeftRotor: LeftRotor.ToConfig(),
            MiddleRotor: MiddleRotor.ToConfig(),
            RightRotor: RightRotor.ToConfig()
        );

        // Validate configuration against physical machine constraints
        var report = EnigmaValidator.Validate(config);
        if (report.Diagnostics.Count > 0)
        {
            var firstWarning = report.Diagnostics.FirstOrDefault(d => d.Severity == ConfigWarningSeverity.Warning);
            if (firstWarning != null)
            {
                ShowNotification(NotificationSeverity.Warning, "Machine Configuration", firstWarning.Message);
            }
        }

        IsProcessing = true;

        try
        {
            // Offload input sanitization AND cipher calculations to ThreadPool async task
            // This prevents UI frame drops during massive pastes (10,000+ to 100,000+ chars)
            var (processResult, sanitizeResult) = await Task.Run(() =>
            {
                token.ThrowIfCancellationRequested();
                var sanitize = Alphabet.Sanitize(currentInput);
                token.ThrowIfCancellationRequested();
                var engine = new EnigmaEngine(config);
                var processed = engine.ProcessText(sanitize.SanitizedText, token);
                return (processed, sanitize);
            }, token);

            if (token.IsCancellationRequested) return;

            HasUnsupportedChars = sanitizeResult.HasUnsupportedChars;
            if (sanitizeResult.HasUnsupportedChars && !_isNotificationVisible)
            {
                string sampleChars = string.Join(", ", sanitizeResult.DistinctUnsupportedChars.Take(5).Select(c => $"'{c}'"));
                ShowNotification(
                    NotificationSeverity.Warning,
                    "Input Sanitized",
                    $"Filtered {sanitizeResult.UnsupportedCharCount} characters outside 96-char alphabet ({sampleChars}). Enigma 96 only encodes ASCII 32..126 and Enter."
                );
            }

            // Back on UI thread: update properties
            OutputText = processResult.Ciphertext;
            CalculationTime = $"{processResult.ElapsedMilliseconds:F2} ms";
            StatusMessage = $"Encrypted {processResult.Ciphertext.Length:N0} chars in {processResult.ElapsedMilliseconds:F2} ms on CPU (100% Reciprocal)";
        }
        catch (OperationCanceledException)
        {
            // Ignored: superseded by newer keystroke or setting change
        }
        catch (Exception ex)
        {
            ShowNotification(NotificationSeverity.Error, "Encryption Fault", $"An unexpected error occurred during encryption: {ex.Message}");
            StatusMessage = "Fault during encryption calculation";
        }
        finally
        {
            if (!token.IsCancellationRequested)
            {
                IsProcessing = false;
            }
        }
    }

    private void ClearInput()
    {
        InputText = string.Empty;
        DismissNotification();
    }

    private void LoadSample()
    {
        InputText = "Modern Enigma 96 Cryptographic System\n" +
                    "---------------------------------------\n" +
                    "Alpha: ABCDEFGHIJKLMNOPQRSTUVWXYZ\n" +
                    "Numeric: 0123456789\n" +
                    "Symbols: !@#$%^&*()_+{}[]:;\"'<>?,./~\n" +
                    "Multiline payload verification successful.";
    }

    public void ExportPdf()
    {
        try
        {
            var config = new EnigmaMachineConfig(
                Reflector: SelectedReflector,
                LeftRotor: LeftRotor.ToConfig(),
                MiddleRotor: MiddleRotor.ToConfig(),
                RightRotor: RightRotor.ToConfig()
            );

            var sfd = new Microsoft.Win32.SaveFileDialog
            {
                Title = "Export Enigma 96 Cryptographic Specification PDF",
                Filter = "PDF Document (*.pdf)|*.pdf",
                FileName = $"enigma96-specification-{DateTime.Now:yyyy-MM-dd}.pdf"
            };

            if (sfd.ShowDialog() == true)
            {
                byte[] pdfBytes = EnigmaPdfExporter.GeneratePdf(config, InputText, OutputText);
                System.IO.File.WriteAllBytes(sfd.FileName, pdfBytes);
                StatusMessage = $"PDF specification exported to {System.IO.Path.GetFileName(sfd.FileName)}";
            }
        }
        catch (Exception ex)
        {
            ShowNotification(NotificationSeverity.Error, "PDF Export Fault", $"Failed to export PDF document: {ex.Message}");
        }
    }

    private void CopyOutput()
    {
        if (string.IsNullOrEmpty(OutputText))
        {
            ShowNotification(NotificationSeverity.Warning, "Clipboard", "There is no ciphertext output to copy. Please enter plaintext first.");
            return;
        }

        if (_clipboardService.TrySetText(OutputText, out string? error))
        {
            IsCopied = true;
            CopyButtonText = "Copied!";
            _copyTimer.Stop();
            _copyTimer.Start();
            StatusMessage = $"Copied {OutputText.Length:N0} characters to Windows Clipboard";
            ShowNotification(NotificationSeverity.Success, "Clipboard Copied", $"Successfully copied {OutputText.Length:N0} characters to the Windows clipboard.");
        }
        else
        {
            ShowNotification(NotificationSeverity.Error, "Clipboard Access Denied", error ?? "Failed to write to clipboard.");
        }
    }

    private void UseOutputAsInput()
    {
        if (string.IsNullOrEmpty(OutputText))
        {
            ShowNotification(NotificationSeverity.Warning, "Reciprocal Decryption", "Cannot transfer empty ciphertext. Encrypt a message first.");
            return;
        }

        // Set input to ciphertext for reciprocal decipherment verification
        InputText = OutputText;
        StatusMessage = "Ciphertext transferred to input - Reciprocal decipherment active!";
    }

    private void ResetSettings()
    {
        SelectedReflector = ReflectorId.A;
        LeftRotor.SelectedRotorId = RotorId.I;
        LeftRotor.Position = 0;
        LeftRotor.RingSetting = 0;
        LeftRotor.TurnoverNotch = Presets.GetRotor(RotorId.I).Notch;

        MiddleRotor.SelectedRotorId = RotorId.II;
        MiddleRotor.Position = 0;
        MiddleRotor.RingSetting = 0;
        MiddleRotor.TurnoverNotch = Presets.GetRotor(RotorId.II).Notch;

        RightRotor.SelectedRotorId = RotorId.III;
        RightRotor.Position = 0;
        RightRotor.RingSetting = 0;
        RightRotor.TurnoverNotch = Presets.GetRotor(RotorId.III).Notch;

        DismissNotification();
        ScheduleProcessEnigma();
        StatusMessage = "Machine settings reset to default preset";
    }

    private void RandomizeSettings()
    {
        var rotors = Enum.GetValues<RotorId>();
        SelectedReflector = _random.Next(2) == 0 ? ReflectorId.A : ReflectorId.B;

        // Shuffle rotors to ensure 3 distinct rotors
        var shuffled = rotors.OrderBy(_ => _random.Next()).Take(3).ToArray();
        LeftRotor.SelectedRotorId = shuffled[0];
        MiddleRotor.SelectedRotorId = shuffled[1];
        RightRotor.SelectedRotorId = shuffled[2];

        LeftRotor.Position = _random.Next(Alphabet.Size);
        LeftRotor.RingSetting = _random.Next(Alphabet.Size);
        LeftRotor.TurnoverNotch = _random.Next(Alphabet.Size);

        MiddleRotor.Position = _random.Next(Alphabet.Size);
        MiddleRotor.RingSetting = _random.Next(Alphabet.Size);
        MiddleRotor.TurnoverNotch = _random.Next(Alphabet.Size);

        RightRotor.Position = _random.Next(Alphabet.Size);
        RightRotor.RingSetting = _random.Next(Alphabet.Size);
        RightRotor.TurnoverNotch = _random.Next(Alphabet.Size);

        DismissNotification();
        ScheduleProcessEnigma();
        StatusMessage = "Random cryptographic key applied";
    }

    public void ShowNotification(NotificationSeverity severity, string title, string message)
    {
        NotificationSeverity = severity;
        NotificationTitle = title;
        NotificationMessage = message;
        IsNotificationVisible = true;
    }

    public void DismissNotification()
    {
        IsNotificationVisible = false;
    }
}
