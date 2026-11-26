import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

import {
  createStudent,
  describeStudentError,
  validateStudent,
  type ClassOption,
  type CreatedStudent,
} from "../../services/adminService";

interface Props {
  open: boolean;
  classes: ClassOption[];
  onClose: () => void;
  onCreated: (student: CreatedStudent, displayName: string) => void;
}

function CreateStudentDialog({
  open,
  classes,
  onClose,
  onCreated,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [classId, setClassId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDisplayName("");
    setUsername("");
    setClassId("");
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

    const input = {
      displayName,
      username,
      classroomId: classId === "" ? null : Number(classId),
    };

    const message = validateStudent(input);
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const student = await createStudent(input);
      const name = displayName.trim();
      reset();
      onCreated(student, name);
    } catch (err) {
      setError(describeStudentError(err, "create"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <form onSubmit={submit} noValidate>
        <DialogTitle>Neuen Schüler anlegen</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              required
              label="Vollständiger Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={saving}
            />

            <TextField
              required
              label="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              disabled={saving}
            />

            <TextField
              select
              label="Klasse"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              helperText="Optional. Ohne Klasse kann der Schüler keine Anwesenheit erfassen."
              disabled={saving}
            >
              <MenuItem value="">Keine Klasse</MenuItem>

              {classes.map((classroom) => (
                <MenuItem
                  key={classroom.id}
                  value={String(classroom.id)}
                >
                  {classroom.classroomName}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={close} disabled={saving}>
            Abbrechen
          </Button>

          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Wird angelegt..." : "Anlegen"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateStudentDialog;
