/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card p-12 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Critical System Failure</h1>
              <p className="text-zinc-500 text-sm font-medium">The Tactical Interface has encountered an unrecoverable breach. Attempting data recovery.</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Connection
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full py-4 border border-zinc-800 text-white font-black uppercase tracking-widest text-[10px] hover:bg-zinc-900 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-3 h-3" />
                Return to Garrison
              </button>
            </div>
            
            <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 font-bold">
              Error Log: RECOVERY_INITIATED_0X00
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
