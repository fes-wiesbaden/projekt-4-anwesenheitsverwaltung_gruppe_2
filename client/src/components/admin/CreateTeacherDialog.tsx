import { useState, type FormEvent } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { ApiError } from "../../api/http";
import { createTeacher, validateTeacher } from "../../services/adminService";
import type { ApiAdminUser } from "../../types/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (user: ApiAdminUser) => void;
}

function CreateTeacherDialog({ open, onClose, onCreated }: Props) {
  const [displayname, setDisplayname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDisplayname("");
    setUsername("");
    setPassword("");
    setConfirmation("");
    setError(null);
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const input = { displayname, username, password };
    const message = validateTeacher(input);
    if (message) { setError(message); return; }
    if (password !== confirmation) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const user = await createTeacher(input);
      reset();
      onCreated(user);
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.status) {
          case 400: setError("Das Backend hat die Eingaben abgelehnt. Bitte überprüfen."); break;
          case 409: setError("Dieser Benutzername ist bereits vergeben."); break;
          case 401:
          case 403: setError("Keine Berechtigung oder Anmeldung abgelaufen. Bitte erneut anmelden."); break;
          default: setError("Lehrkraft konnte nicht angelegt werden. Bitte vor einem erneuten Versuch die Benutzerliste prüfen.");
        }
      } else {
        setError("Lehrkraft konnte nicht angelegt werden. Bitte vor einem erneuten Versuch die Benutzerliste prüfen.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <form onSubmit={submit} noValidate>
        <DialogTitle>Neue Lehrkraft anlegen</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField required label="Vollständiger Name" value={displayname} onChange={(e) => setDisplayname(e.target.value)} disabled={saving} />
            <TextField required label="Benutzername" value={username} onChange={(e) => setUsername(e.target.value)} disabled={saving} autoComplete="off" />
            <TextField required label="Passwort" type="password" value={password} onChange={(e) => setPassword(e.target.value)} helperText="Mindestens 10 Zeichen" autoComplete="new-password" disabled={saving} />
            <TextField required label="Passwort wiederholen" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" disabled={saving} />
            <TextField label="Rolle" value="Lehrkraft" disabled />
            <Alert severity="info">Die Klassenzuordnung erfolgt separat nach der Erstellung.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={saving}>Abbrechen</Button>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? "Wird angelegt..." : "Anlegen"}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateTeacherDialog;
