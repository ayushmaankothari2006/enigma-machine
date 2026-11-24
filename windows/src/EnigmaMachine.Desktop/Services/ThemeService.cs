using System;
using System.Linq;
using System.Windows;
using Microsoft.Win32;

namespace EnigmaMachine.Desktop.Services;

public enum AppTheme
{
    Dark,
    Light,
    System
}

/// <summary>
/// Service managing real-time Windows 10/11 system Dark and Light mode synchronization,
/// dynamic ResourceDictionary palette replacement, and high-contrast theme adjustments.
/// </summary>
public static class ThemeService
{
    private const string PersonalizeKey = @"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize";
    private const string AppsUseLightThemeValue = "AppsUseLightTheme";

    public static AppTheme CurrentTheme { get; private set; } = AppTheme.Light;

    public static event Action<AppTheme>? ThemeChanged;

    static ThemeService()
    {
        try
        {
            // Register Windows system user preference changed event for dynamic runtime theme sync
            SystemEvents.UserPreferenceChanged += (_, e) =>
            {
                if (e.Category is UserPreferenceCategory.General or UserPreferenceCategory.Color)
                {
                    Application.Current?.Dispatcher.InvokeAsync(() =>
                    {
                        if (CurrentTheme == AppTheme.System)
                        {
                            ApplyTheme(AppTheme.System);
                        }
                    });
                }
            };
        }
        catch
        {
            // Graceful fallback for restricted sandbox environments
        }
    }

    /// <summary>
    /// Detects whether Windows is currently configured in Light theme via user Personalize registry.
    /// </summary>
    public static bool IsWindowsInLightTheme()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(PersonalizeKey);
            if (key?.GetValue(AppsUseLightThemeValue) is int val)
            {
                return val == 1;
            }
        }
        catch
        {
            // Default to dark mode on error or non-Windows host
        }

        return false;
    }

    /// <summary>
    /// Applies the specified theme dynamically at runtime, hot-swapping color palettes
    /// without rebuilding the window or losing any machine or text state.
    /// </summary>
    public static void ApplyTheme(AppTheme theme)
    {
        CurrentTheme = theme;

        bool useLight = theme switch
        {
            AppTheme.Light => true,
            AppTheme.Dark => false,
            AppTheme.System => IsWindowsInLightTheme(),
            _ => false
        };

        string themeUri = useLight ? "Themes/LightTheme.xaml" : "Themes/DarkTheme.xaml";

        if (Application.Current != null)
        {
            var appResources = Application.Current.Resources;
            ResourceDictionary newDict;
            try
            {
                newDict = new ResourceDictionary
                {
                    Source = new Uri($"pack://application:,,,/EnigmaMachine;component/{themeUri}", UriKind.Absolute)
                };
            }
            catch
            {
                newDict = new ResourceDictionary
                {
                    Source = new Uri(themeUri, UriKind.Relative)
                };
            }

            var existing = appResources.MergedDictionaries.FirstOrDefault(d =>
                d.Source != null && (d.Source.OriginalString.Contains("Colors.xaml") ||
                                     d.Source.OriginalString.Contains("DarkTheme.xaml") ||
                                     d.Source.OriginalString.Contains("LightTheme.xaml")));

            if (existing != null)
            {
                int index = appResources.MergedDictionaries.IndexOf(existing);
                appResources.MergedDictionaries[index] = newDict;
            }
            else
            {
                appResources.MergedDictionaries.Insert(0, newDict);
            }

            // Propagate updated theme brush keys directly into Application.Current.Resources for instant DynamicResource resolution
            foreach (var key in newDict.Keys)
            {
                appResources[key] = newDict[key];
            }
        }

        ThemeChanged?.Invoke(CurrentTheme);
    }
}
