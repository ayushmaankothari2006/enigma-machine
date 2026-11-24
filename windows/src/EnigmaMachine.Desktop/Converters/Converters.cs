using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;
using EnigmaMachine.Desktop.ViewModels;

namespace EnigmaMachine.Desktop.Converters;

public sealed class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool b)
        {
            return b ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is Visibility v)
        {
            return v == Visibility.Visible;
        }
        return false;
    }
}

public sealed class InverseBoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool b)
        {
            return b ? Visibility.Collapsed : Visibility.Visible;
        }
        return Visibility.Visible;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is Visibility v)
        {
            return v != Visibility.Visible;
        }
        return true;
    }
}

public sealed class SeverityToBackgroundConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is NotificationSeverity severity)
        {
            return severity switch
            {
                NotificationSeverity.Success => new SolidColorBrush(Color.FromArgb(255, 14, 43, 33)), // Dark emerald
                NotificationSeverity.Warning => new SolidColorBrush(Color.FromArgb(255, 46, 34, 17)), // Dark amber
                NotificationSeverity.Error => new SolidColorBrush(Color.FromArgb(255, 48, 18, 18)),   // Dark red
                _ => new SolidColorBrush(Color.FromArgb(255, 18, 30, 48))                             // Dark cyan
            };
        }
        return new SolidColorBrush(Color.FromArgb(255, 18, 30, 48));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => throw new NotImplementedException();
}

public sealed class SeverityToBorderConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is NotificationSeverity severity)
        {
            return severity switch
            {
                NotificationSeverity.Success => new SolidColorBrush(Color.FromArgb(255, 16, 185, 129)), // Emerald
                NotificationSeverity.Warning => new SolidColorBrush(Color.FromArgb(255, 245, 158, 11)), // Amber
                NotificationSeverity.Error => new SolidColorBrush(Color.FromArgb(255, 239, 68, 68)),   // Red
                _ => new SolidColorBrush(Color.FromArgb(255, 6, 182, 212))                             // Cyan
            };
        }
        return new SolidColorBrush(Color.FromArgb(255, 6, 182, 212));
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => throw new NotImplementedException();
}
