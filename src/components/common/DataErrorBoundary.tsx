import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Wifi, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  isNetworkError?: boolean;
}

export class DataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a network/API error
    const isNetworkError =
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("SharePoint") ||
      error.name === "NetworkError";

    return {
      hasError: true,
      error,
      isNetworkError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("DataErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      isNetworkError: undefined,
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { isNetworkError, error } = this.state;

      return (
        <div className="min-h-[400px] bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              {isNetworkError ? (
                <Wifi size={48} className="text-orange-500" />
              ) : (
                <AlertTriangle size={48} className="text-red-500" />
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isNetworkError ? "Connection Problem" : "Data Loading Error"}
            </h2>

            <p className="text-gray-600 mb-6">
              {isNetworkError
                ? "Unable to connect to the server. Please check your internet connection and try again."
                : "There was a problem loading the data. This might be a temporary issue."}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === "development" && error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {error.toString()}
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

export default DataErrorBoundary;
