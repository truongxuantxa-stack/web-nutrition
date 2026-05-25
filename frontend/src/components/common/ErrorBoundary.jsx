import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-8 text-center">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-bold text-error">Đã có lỗi xảy ra</h2>
          <p className="text-base-content/60 text-sm max-w-sm">
            {this.state.error?.message || 'Trang bị lỗi không mong muốn.'}
          </p>
          <button
            id="error-boundary-reload"
            className="btn btn-primary btn-sm"
            onClick={this.handleReload}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
