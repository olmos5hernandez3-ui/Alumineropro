import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  resetKey?: string | number | boolean;
  title?: string;
  isModal?: boolean;
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Error inesperado al mostrar esta sección.';
    return {
      hasError: true,
      errorMessage: msg,
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    try {
      console.error('[Aluminero Pro ErrorBoundary]', error, info?.componentStack);
    } catch {
      // ignorar si consola no está disponible
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (typeof this.props.onGoHome === 'function') {
      this.props.onGoHome();
    } else if (typeof window !== 'undefined') {
      try {
        window.location.href = `${window.location.origin}${window.location.pathname}`;
      } catch {
        window.location.reload();
      }
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const title = this.props.title || 'No se pudo cargar este apartado';
    const card = (
      <div
        role="alert"
        className="w-full max-w-[440px] mx-auto rounded-2xl border border-sky-400/35 bg-[#0B2545] text-white p-5 sm:p-6 shadow-2xl text-center"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center justify-center text-[24px]">
          ⚠️
        </div>
        <h2 className="m-0 text-[18px] font-extrabold text-white leading-snug">{title}</h2>
        <p className="m-0 mt-2 text-[13px] text-slate-200 leading-relaxed">
          Ocurrió un error inesperado al abrir esta pantalla. Tus datos guardados en el dispositivo siguen seguros.
        </p>
        {this.state.errorMessage && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-[11px] text-slate-300 mono break-words text-left max-h-[84px] overflow-y-auto">
            {this.state.errorMessage}
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={this.handleGoHome}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-extrabold text-[14px] cursor-pointer shadow-lg transition-all"
          >
            ← Volver al inicio
          </button>
          <button
            type="button"
            onClick={this.handleRetry}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-slate-100 font-bold text-[13px] cursor-pointer transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );

    if (this.props.isModal) {
      return (
        <div className="fixed inset-0 z-[9995] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          {card}
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-3 py-8">
        {card}
      </div>
    );
  }
}
