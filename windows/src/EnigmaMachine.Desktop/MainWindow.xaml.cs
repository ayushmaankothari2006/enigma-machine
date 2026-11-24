using System.Windows;
using EnigmaMachine.Desktop.ViewModels;

namespace EnigmaMachine.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow() : this(null)
    {
    }

    public MainWindow(MainViewModel? viewModel)
    {
        InitializeComponent();
        if (viewModel != null)
        {
            DataContext = viewModel;
        }
    }
}
