
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

import type {
  AttendanceRow,
} from "../../types/attendance";

import {
  toFormValues,
  validateEdit,
  type EditFormValues,
} from "../../utils/attendanceEdit";

interface EditAttendanceDialogProps {
  row: AttendanceRow | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: EditFormValues) => void;
}

function EditAttendanceDialog({
  row,
  isSaving,
  onClose,
  onSave,
}: EditAttendanceDialogProps) {
  const [values, setValues] =
    useState<EditFormValues | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setValues(row ? toFormValues(row) : null);
    setError(null);
  }, [row]);

  if (!row || !values) {
    return null;
  }

  const update = (
    patch: Partial<EditFormValues>,
  ) => {
    setValues((current) =>
      current
        ? { ...current, ...patch }
        : current,
    );
  };

  const handleSave = () => {
    const message = validateEdit(values);

    if (message) {
      setError(message);
      return;
    }

    setError(null);
    onSave(values);
  };

  return (
    <Dialog
      open
      onClose={() => {
        if (!isSaving) {
          onClose();
        }
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Anwesenheit bearbeiten: {row.studentName}
      </DialogTitle>

      <DialogContent sx={{ overflowX: "hidden" }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <TextField
            select
            label="Status"
            value={values.status}
            onChange={(event) =>
              update({
                status: event.target.value as
                  EditFormValues["status"],
              })
            }
          >
            <MenuItem value="PRESENT">
              Anwesend
            </MenuItem>
            <MenuItem value="LATE">
              Verspätet
            </MenuItem>
            <MenuItem value="ABSENT">
              Abwesend
            </MenuItem>
          </TextField>

          <TextField
            label="Check-in (HH:mm)"
            placeholder="08:00"
            value={values.checkIn}
            onChange={(event) =>
              update({
                checkIn: event.target.value,
              })
            }
          />

          <TextField
            label="Check-out (HH:mm)"
            placeholder="15:30"
            value={values.checkOut}
            onChange={(event) =>
              update({
                checkOut: event.target.value,
              })
            }
          />

          <TextField
            label="Beschreibung"
            multiline
            minRows={2}
            value={values.description}
            onChange={(event) =>
              update({
                description: event.target.value,
              })
            }
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={isSaving}
        >
          Abbrechen
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? "Wird gespeichert..."
            : "Speichern"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditAttendanceDialog;
