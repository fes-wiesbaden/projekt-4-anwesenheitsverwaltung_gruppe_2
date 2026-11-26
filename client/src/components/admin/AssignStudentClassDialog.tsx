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
  assignStudentToClass,
  describeStudentError,
  type ClassOption,
} from "../../services/adminService";

interface Props {
  studentId: string;
  studentName: string;
  currentClassId: number | null;
  classes: ClassOption[];
  onClose: () => void;
  onAssigned: (message: string) => void;
}

function AssignStudentClassDialog({
  studentId,
  studentName,
  currentClassId,
  classes,
  onClose,
  onAssigned,
}: Props) {
  const [classId, setClassId] = useState(
    currentClassId === null ? "" : String(currentClassId),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (classId === "") {
      setError("Bitte eine Klasse wählen.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await assignStudentToClass(studentId, Number(classId));

      const name =
        classes.find((item) => String(item.id) === classId)
          ?.classroomName ?? "der Klasse";

      onAssigned(`${studentName} wurde ${name} zugewiesen.`);
    } catch (err) {
      setError(describeStudentError(err, "assign"));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs">
      <form onSubmit={submit} noValidate>
        <DialogTitle>Klasse für {studentName}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              select
              required
              label="Klasse"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={saving}
            >
              {classes.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.classroomName}
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
            {saving ? "Wird gespeichert..." : "Speichern"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default AssignStudentClassDialog;
