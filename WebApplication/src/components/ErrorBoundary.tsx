import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isPermissionError = false;

      try {
        const parsed = JSON.parse(this.state.error?.message || '{}');
        if (parsed.error && parsed.error.includes('permissions')) {
          errorMessage = "You don't have permission to perform this action or view this data.";
          isPermissionError = true;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4">
          <Card className="max-w-md w-full border-destructive/20 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="text-destructive" size={24} />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                {isPermissionError ? "Access Denied" : "Application Error"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground text-sm">
                {errorMessage}
              </p>
              {!isPermissionError && (
                <pre className="mt-4 p-3 bg-slate-100 rounded text-[10px] overflow-auto max-h-32 font-mono">
                  {this.state.error?.stack}
                </pre>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                <RefreshCcw size={16} />
                Reload App
              </Button>
              {isPermissionError && (
                <Button onClick={() => window.location.href = '/'}>
                  Go to Dashboard
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
