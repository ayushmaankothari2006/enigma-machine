using System.Windows;
using EnigmaMachine.Desktop.Services;

namespace EnigmaMachine.Desktop;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        // Lock UI into Light mode (Claymorphism Light Palette)
        ThemeService.ApplyTheme(AppTheme.Light);
    }
}

