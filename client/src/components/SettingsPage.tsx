
import {
  useState,
  type FormEvent,
} from "react";

import {
  Alert,
  Button,
  Stack,
  TextField,
} from "@mui/material";

import { changePassword } from "../services/userService";

import {
  describePasswordError,
  validatePasswordChange,
} from "../utils/passwordChange";

function SettingsPage() {
  const [oldPassword, setOldPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmation, setConfirmation] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSaving) return;

    const message = validatePasswordChange(
      oldPassword,
      newPassword,
      confirmation,
    );

    if (message) {
      setNotice({
        type: "error",
        text: message,
      });
      return;
    }

    setIsSaving(true);
    setNotice(null);

    try {
      await changePassword(
        oldPassword,
        newPassword,
      );

      setOldPassword("");
      setNewPassword("");
      setConfirmation("");

      setNotice({
        type: "success",
        text: "Das Passwort wurde erfolgreich geändert.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: describePasswordError(error),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>Einstellungen</h1>
          <p>
            Passwort für Ihren Zugang ändern.
          </p>
        </div>
      </div>

      <div
        className="table-card"
        style={{
          padding: 24,
          maxWidth: 520,
        }}
      >
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {notice && (
              <Alert
                severity={notice.type}
              >
                {notice.text}
              </Alert>
            )}

            <TextField
              type="password"
              label="Aktuelles Passwort"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(event) =>
                setOldPassword(
                  event.target.value,
                )
              }
              disabled={isSaving}
              fullWidth
            />

            <TextField
              type="password"
              label="Neues Passwort"
              autoComplete="new-password"
              helperText="Mindestens 8 Zeichen"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value,
                )
              }
              disabled={isSaving}
              fullWidth
            />

            <TextField
              type="password"
              label="Neues Passwort wiederholen"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) =>
                setConfirmation(
                  event.target.value,
                )
              }
              disabled={isSaving}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
            >
              {isSaving
                ? "Wird gespeichert..."
                : "Passwort ändern"}
            </Button>
          </Stack>
        </form>
      </div>
    </section>
  );
}

export default SettingsPage;
