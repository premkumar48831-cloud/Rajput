import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  public override props: Props;
  // @ts-ignore
  public override state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#0d0f17",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#f43f5e",
              marginBottom: "10px",
            }}
          >
            ⚠️ System Auto Recovery Needed
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#9ca3af",
              maxWidth: "400px",
              marginBottom: "20px",
            }}
          >
            An unexpected glitch occurred. Click below to refresh and restore your
            store immediately.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              backgroundColor: "#06b6d4",
              color: "#000",
              fontWeight: "bold",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              textTransform: "uppercase",
              boxShadow: "0 0 15px rgba(6, 182, 212, 0.5)",
            }}
          >
            🔄 Refresh & Restore Store
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
