'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ArticleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Article Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Back Navigation */}
            <div className="mb-6">
              <Link href="/feed" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Feed
              </Link>
            </div>

            {/* Error Display */}
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We encountered an error while loading this article. This might be due to a temporary issue or the article may no longer be available.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Link href="/feed">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Browse Other Articles
                  </Button>
                </Link>
              </div>

              {/* Technical Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-8 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technical Details (Development Only)
                  </summary>
                  <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto text-red-600">
                    {this.state.error.toString()}
                    {this.state.error.stack && '\n\n' + this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}