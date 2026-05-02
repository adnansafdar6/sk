import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import App from "./App";
import "./App.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--bg-card-hover)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                backdropFilter: "blur(20px)",
              },
              success: { iconTheme: { primary: "#10b981", secondary: "white" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "white" } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
