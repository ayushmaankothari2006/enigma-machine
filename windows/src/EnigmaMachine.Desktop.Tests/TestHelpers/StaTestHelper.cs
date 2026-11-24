using System;
using System.Diagnostics;
using System.Runtime.ExceptionServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace EnigmaMachine.Desktop.Tests.TestHelpers;

/// <summary>
/// Execution coordinator for WPF tests requiring Single-Threaded Apartment (STA) threads,
/// an active Dispatcher message pump, and Application resource dictionary initialization.
/// </summary>
public static class StaTestHelper
{
    private static readonly object _initLock = new();
    private static bool _appInitialized = false;

    /// <summary>
    /// Ensures that the WPF Application instance and its XAML resource dictionaries are initialized on an STA thread.
    /// </summary>
    public static void EnsureApplicationInitialized()
    {
        lock (_initLock)
        {
            if (_appInitialized) return;

            if (Application.Current == null)
            {
                var app = new App();
                app.InitializeComponent();
            }

            _appInitialized = true;
        }
    }

    /// <summary>
    /// Runs a synchronous action on a dedicated STA thread.
    /// </summary>
    public static void Run(Action action)
    {
        Exception? caughtException = null;

        var thread = new Thread(() =>
        {
            try
            {
                EnsureApplicationInitialized();
                action();
            }
            catch (Exception ex)
            {
                caughtException = ex;
            }
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();

        if (caughtException != null)
        {
            ExceptionDispatchInfo.Capture(caughtException).Throw();
        }
    }

    /// <summary>
    /// Runs an asynchronous test method on a dedicated STA thread with an active Dispatcher message pump.
    /// </summary>
    public static async Task RunAsync(Func<Task> asyncAction)
    {
        Exception? caughtException = null;
        var tcs = new TaskCompletionSource<bool>();

        var thread = new Thread(() =>
        {
            try
            {
                EnsureApplicationInitialized();
                var dispatcher = Dispatcher.CurrentDispatcher;
                SynchronizationContext.SetSynchronizationContext(new DispatcherSynchronizationContext(dispatcher));

                dispatcher.BeginInvoke(new Action(async () =>
                {
                    try
                    {
                        await asyncAction();
                        tcs.SetResult(true);
                    }
                    catch (Exception ex)
                    {
                        caughtException = ex;
                        tcs.SetException(ex);
                    }
                    finally
                    {
                        dispatcher.BeginInvokeShutdown(DispatcherPriority.Background);
                    }
                }), DispatcherPriority.Normal);

                Dispatcher.Run();
            }
            catch (Exception ex)
            {
                caughtException = ex;
                tcs.TrySetException(ex);
            }
        });

        thread.SetApartmentState(ApartmentState.STA);
        thread.IsBackground = true;
        thread.Start();

        await tcs.Task;

        if (caughtException != null)
        {
            ExceptionDispatchInfo.Capture(caughtException).Throw();
        }
    }

    /// <summary>
    /// Pumps all pending Dispatcher messages to allow bindings, timers, and layout updates to process.
    /// </summary>
    public static void DoEvents(DispatcherPriority priority = DispatcherPriority.Background)
    {
        var frame = new DispatcherFrame();
        Dispatcher.CurrentDispatcher.BeginInvoke(priority, new DispatcherOperationCallback(f =>
        {
            ((DispatcherFrame)f).Continue = false;
            return null;
        }), frame);
        Dispatcher.PushFrame(frame);
    }

    /// <summary>
    /// Asynchronously polls a condition while pumping Dispatcher events until it becomes true or times out.
    /// </summary>
    public static async Task WaitForConditionAsync(Func<bool> condition, int timeoutMs = 5000, int pollDelayMs = 20)
    {
        var sw = Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            DoEvents();
            if (condition()) return;
            await Task.Delay(pollDelayMs);
            DoEvents();
        }

        if (!condition())
        {
            throw new TimeoutException($"Condition timed out after {timeoutMs} ms.");
        }
    }
}
