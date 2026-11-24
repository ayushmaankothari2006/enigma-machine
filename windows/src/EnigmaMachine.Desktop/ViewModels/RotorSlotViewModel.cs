using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Input;
using EnigmaMachine.Core.Engine;

namespace EnigmaMachine.Desktop.ViewModels;

public sealed record NotchOption(int Index, string Glyph, string DisplayText)
{
    public override string ToString() => DisplayText;
}

public sealed class RotorSlotViewModel : ViewModelBase
{
    private static readonly IReadOnlyList<NotchOption> s_availableNotches = Enumerable.Range(0, Alphabet.Size)
        .Select(i => new NotchOption(i, Alphabet.FormatGlyph(i), $"{Alphabet.FormatGlyph(i)} ({i + 1})"))
        .ToList();

    private readonly Action _onChanged;
    private RotorId _selectedRotorId;
    private int _position;
    private int _ringSetting;
    private int _turnoverNotch;

    public RotorSlot Slot { get; }
    public string Title { get; }
    public string Subtitle { get; }
    public string Badge { get; }
    public bool BadgeIsOrange { get; }

    public IReadOnlyList<RotorId> AvailableRotors { get; } = Enum.GetValues<RotorId>();
    public IReadOnlyList<NotchOption> AvailableNotches => s_availableNotches;

    public RotorId SelectedRotorId
    {
        get => _selectedRotorId;
        set
        {
            if (SetProperty(ref _selectedRotorId, value))
            {
                var def = Presets.GetRotor(value);
                TurnoverNotch = def.Notch;
                OnPropertyChanged(nameof(NotchGlyph));
                OnPropertyChanged(nameof(SelectedNotch));
                OnPropertyChanged(nameof(NotchDisplay));
                _onChanged();
            }
        }
    }

    public int Position
    {
        get => _position;
        set
        {
            int norm = ((value % Alphabet.Size) + Alphabet.Size) % Alphabet.Size;
            if (SetProperty(ref _position, norm))
            {
                OnPropertyChanged(nameof(PositionGlyph));
                OnPropertyChanged(nameof(PositionDisplay));
                OnPropertyChanged(nameof(DisplayIndex));
                OnPropertyChanged(nameof(IsAtNotch));
                _onChanged();
            }
        }
    }

    public int RingSetting
    {
        get => _ringSetting;
        set
        {
            int norm = ((value % Alphabet.Size) + Alphabet.Size) % Alphabet.Size;
            if (SetProperty(ref _ringSetting, norm))
            {
                OnPropertyChanged(nameof(RingGlyph));
                OnPropertyChanged(nameof(RingDisplay));
                OnPropertyChanged(nameof(DisplayRing));
                _onChanged();
            }
        }
    }

    public int TurnoverNotch
    {
        get => _turnoverNotch;
        set
        {
            int norm = ((value % Alphabet.Size) + Alphabet.Size) % Alphabet.Size;
            if (SetProperty(ref _turnoverNotch, norm))
            {
                OnPropertyChanged(nameof(NotchGlyph));
                OnPropertyChanged(nameof(SelectedNotch));
                OnPropertyChanged(nameof(NotchDisplay));
                OnPropertyChanged(nameof(IsAtNotch));
                _onChanged();
            }
        }
    }

    public NotchOption SelectedNotch
    {
        get => s_availableNotches[_turnoverNotch];
        set
        {
            if (value != null && value.Index != _turnoverNotch)
            {
                TurnoverNotch = value.Index;
            }
        }
    }

    public int DisplayIndex => _position + 1; // 1 to 96 (Web Parity)
    public int DisplayRing => _ringSetting + 1; // 1 to 96 (Web Parity)

    public string PositionGlyph => Alphabet.FormatGlyph(_position);
    public string PositionDisplay => $"{_position:D2} ({PositionGlyph})";

    public string RingGlyph => Alphabet.FormatGlyph(_ringSetting);
    public string RingDisplay => $"{_ringSetting:D2} ({RingGlyph})";

    public string NotchGlyph => Alphabet.FormatGlyph(_turnoverNotch);
    public string NotchDisplay => $"{NotchGlyph} ({_turnoverNotch + 1})";

    public bool IsAtNotch => _position == _turnoverNotch;

    public ICommand StepPositionUpCommand { get; }
    public ICommand StepPositionDownCommand { get; }
    public ICommand StepRingUpCommand { get; }
    public ICommand StepRingDownCommand { get; }

    public RotorSlotViewModel(RotorSlot slot, RotorId defaultRotor, int defaultPos, int defaultRing, Action onChanged)
    {
        Slot = slot;
        _onChanged = onChanged;
        _selectedRotorId = defaultRotor;
        _position = defaultPos;
        _ringSetting = defaultRing;
        _turnoverNotch = Presets.GetRotor(defaultRotor).Notch;

        Title = slot switch
        {
            RotorSlot.Left => "Left Rotor",
            RotorSlot.Middle => "Middle Rotor",
            RotorSlot.Right => "Right Rotor",
            _ => "Rotor"
        };

        Subtitle = slot switch
        {
            RotorSlot.Left => "Slow Stepping",
            RotorSlot.Middle => "Double-Step Turnover",
            RotorSlot.Right => "Fast Stepping",
            _ => string.Empty
        };

        Badge = slot switch
        {
            RotorSlot.Left => "R₁ • Slow",
            RotorSlot.Middle => "R₂ • Medium",
            RotorSlot.Right => "R₃ • Fast",
            _ => "Rotor"
        };

        BadgeIsOrange = slot == RotorSlot.Middle;

        StepPositionUpCommand = new RelayCommand(() => Position++);
        StepPositionDownCommand = new RelayCommand(() => Position--);
        StepRingUpCommand = new RelayCommand(() => RingSetting++);
        StepRingDownCommand = new RelayCommand(() => RingSetting--);
    }

    public RotorConfig ToConfig() => new(SelectedRotorId, Position, RingSetting, TurnoverNotch);
}
