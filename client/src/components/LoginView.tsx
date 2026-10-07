import {
  useState,
  type FormEvent,
} from "react";

import {
  Alert,
  Box,
  Button,
  TextField,
} from "@mui/material";

import "../css/main.css";

interface LoginViewProps {
  onLoginSuccess: () => void;
}

interface LoginResponse {
  token: string;
}

function LoginView({
  onLoginSuccess,
}: LoginViewProps) {
  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);
    setIsLoading(true);

    const formData =
      new FormData(event.currentTarget);

    const username =
      String(
        formData.get("username") ?? "",
      ).trim();

    const password =
      String(
        formData.get("password") ?? "",
      );

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            username,
            password,
          }),
        },
      );

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          setError(
            "Benutzername oder Passwort falsch.",
          );
        } else {
          setError(
            `Anmeldung fehlgeschlagen (${response.status}).`,
          );
        }

        return;
      }

      const data =
        (await response.json()) as LoginResponse;

      if (!data.token) {
        setError(
          "Der Server hat keinen Anmelde-Token zurückgegeben.",
        );

        return;
      }

      sessionStorage.setItem(
        "token",
        data.token,
      );

      onLoginSuccess();
    } catch (error) {
      console.error(
        "Login-Fehler:",
        error,
      );

      setError(
        "Der Server ist momentan nicht erreichbar.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <Box className="login-card">
        <Box className="login-card-header">
          <h1 className="login-title">
            Willkommen
          </h1>

          <p className="login-description">
            Melden Sie sich an, um die
            Anwesenheitsverwaltung zu öffnen.
          </p>
        </Box>

        <Box
          component="form"
          className="login-form"
          onSubmit={handleSubmit}
        >
          <TextField
            name="username"
            label="Benutzername"
            fullWidth
            autoComplete="username"
            required
          />

          <TextField
            name="password"
            label="Passwort"
            type="password"
            fullWidth
            autoComplete="current-password"
            required
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
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Wird geprüft..."
              : "Einloggen"}
          </Button>
        </Box>
      </Box>
    </main>
  );
}

export default LoginView;