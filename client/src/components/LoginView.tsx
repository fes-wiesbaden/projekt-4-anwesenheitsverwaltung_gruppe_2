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

    // TEST LOGIN
    if (username == "test" && password == "test") {
      onLoginSuccess();
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
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
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <h1 className="login-title">Login</h1>
      <Box onKeyDown={handleKeyDown} className="login-wrapper">
        <TextField
          className="username-input"
          label="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
        />
        <TextField
          className="password-input"
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
        {error && <Alert severity="error">{error}</Alert>}

        <Box className="loginBtn-wrapper">
          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={isLoading || !username || !password}
          >
            {isLoading ? "Wird geprüft..." : "Einloggen"}
          </Button>
        </Box>
      </Box>
    </>
  );
}

export default LoginView;
