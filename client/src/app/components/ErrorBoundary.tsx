import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">We're sorry, but the application encountered an unexpected error.</p>
            <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}