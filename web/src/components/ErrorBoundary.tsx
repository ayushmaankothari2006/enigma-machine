import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-100 to-orange-50/40 flex items-center justify-center p-4">
          <div className="clay-card p-6 sm:p-8 max-w-lg w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-blue-950 font-mono">
              Something went wrong
            </h1>

            <p className="text-xs text-slate-600 font-mono">
              An unexpected error occurred in the Enigma 96 application.
            </p>

            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-left overflow-auto max-h-32 text-[11px] font-mono text-red-700">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="clay-btn-orange px-5 py-2.5 text-xs font-bold font-mono inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
