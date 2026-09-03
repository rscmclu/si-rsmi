import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in React Component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (window.confirm('Reset data lokal dan muat ulang aplikasi? Data akan dikembalikan ke data default RS Medika Insani.')) {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-800">
                Terjadi Kendala Memuat Aplikasi
              </h2>
              <p className="text-sm text-slate-600">
                Aplikasi SIMBARS mendeteksi kesalahan rendering runtime. Silakan muat ulang atau pulihkan data aplikasi.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs overflow-x-auto max-h-36">
                <div className="text-rose-400 font-bold mb-1">{this.state.error.toString()}</div>
                {this.state.errorInfo?.componentStack && (
                  <div className="text-slate-400 text-[11px] whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Reset Cache / Storage</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
