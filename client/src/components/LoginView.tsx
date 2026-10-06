import { useState } from "react";
import { Box, Button, TextField, Alert } from "@mui/material";

import "../css/main.css";

interface LoginViewProps {
  onLoginSuccess: () => void;
}

function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login fehlgeschlagen");
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);

      onLoginSuccess();
    } catch {
      setError("Benutzername oder Passwort falsch.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <main className="login-page">
      <Box className="login-card">
        <Box className="login-card-header">
          <h1 className="login-title">Willkommen</h1>

          <p className="login-description">
            Melden Sie sich an, um die Anwesenheitsverwaltung zu öffnen.
          </p>
        </Box>

        <Box
          onKeyDown={handleKeyDown}
          className="login-form"
        >
          <TextField
            label="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            autoComplete="username"
          />

          <TextField
            label="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            autoComplete="current-password"
          />

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Button
            className="login-button"
            variant="contained"
            size="large"
            fullWidth
            onClick={handleLogin}
            disabled={isLoading || !username || !password}
          >
            {isLoading ? "Wird geprüft..." : "Einloggen"}
          </Button>
        </Box>
      </Box>
    </main>
  );
}

export default LoginView;