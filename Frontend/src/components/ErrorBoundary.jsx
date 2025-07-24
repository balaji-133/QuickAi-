import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Markdown render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 text-sm">⚠️ Error rendering Markdown content.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
