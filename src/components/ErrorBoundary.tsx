import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Electron'da hata raporlama
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification(
        'Uygulama Hatası',
        'Bir hata oluştu. Uygulama yeniden başlatılıyor...'
      );
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    if (confirm('Tüm veriler silinecek ve uygulama yeniden başlatılacak. Devam etmek istiyor musunuz?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="theme-bg min-h-screen flex items-center justify-center p-4">
          <div className="theme-surface rounded-xl shadow-lg border theme-border p-8 max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold theme-text mb-4">Bir Hata Oluştu</h2>
            <p className="theme-text-muted mb-6">
              Uygulama beklenmedik bir hatayla karşılaştı. Aşağıdaki seçenekleri deneyebilirsiniz:
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="theme-button w-full py-3 px-4 rounded-lg font-medium transition-colors"
              >
                🔄 Uygulamayı Yeniden Başlat
              </button>
              
              <button
                onClick={this.handleResetData}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                🗑️ Verileri Sıfırla ve Yeniden Başlat
              </button>
            </div>

            {/* Debug bilgileri - sadece development'da */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm theme-text-muted hover:theme-text">
                  🐛 Debug Bilgileri (Geliştirici)
                </summary>
                <div className="mt-2 p-3 theme-bg-secondary rounded text-xs theme-border border">
                  <strong className="theme-text">Hata:</strong>
                  <pre className="whitespace-pre-wrap theme-text-muted">{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <>
                      <strong className="block mt-2 theme-text">Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap theme-text-muted">{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 