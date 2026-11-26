import { useEffect, useState } from "react";
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
  assignClass,
  describeAssignError,
} from "../../services/adminService";

import {
  getClassrooms,
} from "../../services/classroomService";

import {
  getMyStudents,
} from "../../services/studentService";

import type { ApiAdminUser } from "../../types/api";

interface Props {
  open: boolean;
  teachers: ApiAdminUser[];
  onClose: () => void;
  onAssigned: (message: string) => void;
}

interface ClassOption {
  id: number;
  name: string;
}

function AssignClassDialogContent({
  teachers,
  onClose,
  onAssigned,
}: Omit<Props, "open">) {
  const [classes, setClasses] =
    useState<ClassOption[]>([]);

  const [username, setUsername] = useState("");
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {

    let cancelled = false;

    Promise.all([
      getClassrooms(),
      getMyStudents(),
    ])
      .then(([classrooms, students]) => {
        if (cancelled) return;

        const names = classrooms.map(
          (item) => item.classroomName,
        );

        const options = new Map<number, ClassOption>();

        // Neuer Backend-Stand: alle Klassen mit ID, auch ohne Schüler.
        for (const item of classrooms) {
          if (item.id !== null) {
            options.set(item.id, {
              id: item.id,
              name: item.classroomName,
            });
          }
        }

        // Älterer Backend-Stand: IDs nur über die Schüler bekannt.
        for (const student of students) {
          const classroom = student.classroom;

          if (
            classroom &&
            names.includes(classroom.classroomName)
          ) {
            options.set(classroom.id, {
              id: classroom.id,
              name: classroom.classroomName,
            });
          }
        }

        setClasses(
          Array.from(options.values()).sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setError("Klassen konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reset = () => {
    setUsername("");
    setClassId("");
    setError(null);
  };

  const close = () => {
    if (saving) return;

    reset();
    onClose();
  };

  const submit = async () => {
    if (!username || !classId || saving || loading) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await assignClass({
        username,
        classroomId: Number(classId),
      });

      const name = classes.find(
        (item) => String(item.id) === classId,
      )?.name;

      reset();

      onAssigned(
        `${username} wurde der Klasse ${name} zugewiesen.`,
      );
    } catch (err) {
      setError(describeAssignError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={close}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Klasse einer Lehrkraft zuweisen
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            select
            label="Lehrkraft"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            disabled={saving || loading}
          >
            {teachers.map((teacher) => (
              <MenuItem
                key={teacher.id}
                value={teacher.username}
              >
                {teacher.displayName} ({teacher.username})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Klasse"
            value={classId}
            onChange={(event) =>
              setClassId(event.target.value)
            }
            disabled={saving || loading}
            helperText={
              loading
                ? "Klassen werden geladen..."
                : classes.length === 0
                  ? "Keine Klassen gefunden."
                  : "Klasse für die Lehrkraft auswählen."
            }
          >
            {classes.map((item) => (
              <MenuItem
                key={item.id}
                value={String(item.id)}
              >
                {item.name}
              </MenuItem>
            ))}
          </TextField>

        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={close}
          disabled={saving}
        >
          Abbrechen
        </Button>

        <Button
          variant="contained"
          onClick={() => void submit()}
          disabled={
            saving ||
            loading ||
            !username ||
            !classId
          }
        >
          {saving
            ? "Wird zugewiesen..."
            : "Zuweisen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AssignClassDialog(props: Props) {
  const { open, ...rest } = props;

  if (!open) {
    return null;
  }

  return <AssignClassDialogContent {...rest} />;
}
export default AssignClassDialog;