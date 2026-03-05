import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled React error:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-2xl border border-red-500/40 bg-red-900/10 p-6">
          <h1 className="text-2xl font-bold text-red-300 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-300 mb-4">A runtime error blocked the page render.</p>
          <pre className="text-xs text-red-200 bg-black/30 rounded-lg p-3 overflow-auto">{this.state.message}</pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
