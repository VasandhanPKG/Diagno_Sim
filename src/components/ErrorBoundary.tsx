import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let indexUrl = null;

      try {
        // Check if it's a Firestore index error
        if (this.state.error?.message) {
          const errorData = JSON.parse(this.state.error.message);
          if (errorData.error?.includes("requires an index")) {
            errorMessage = "This action requires a database index to be created.";
            const urlMatch = errorData.error.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
            if (urlMatch) indexUrl = urlMatch[0];
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        }
      } catch (e) {
        // Not a JSON error, use raw message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {errorMessage}
            </p>

            {indexUrl && (
              <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-left">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Setup Required</p>
                <p className="text-sm text-indigo-700 mb-3">A composite index is missing in Firestore. Please click the link below to create it:</p>
                <a 
                  href={indexUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  Create Index in Firebase
                </a>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
              >
                <RefreshCcw className="w-4 h-4" />
                Retry Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-600 uppercase tracking-widest">Technical Details</summary>
                <pre className="mt-4 p-4 bg-slate-900 text-slate-300 rounded-xl text-[10px] overflow-auto max-h-40 font-mono">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
