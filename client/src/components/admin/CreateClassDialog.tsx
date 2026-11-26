import { useEffect, useState, type FormEvent } from "react";
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
  createClassroom,
  describeClassError,
  getRooms,
  validateClassroom,
  type ApiRoom,
} from "../../services/adminService";

interface Props {
  onClose: () => void;
  onCreated: (className: string) => void;
}

function CreateClassDialog({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getRooms()
      .then((list) => {
        if (!cancelled) setRooms(list);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Die Räume konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRooms(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const input = {
      classroomName: name,
      roomId: roomId === "" ? null : Number(roomId),
    };

    const message = validateClassroom(input);
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createClassroom(input);
      onCreated(name.trim());
    } catch (err) {
      setError(describeClassError(err, "create"));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <form onSubmit={submit} noValidate>
        <DialogTitle>Neue Klasse anlegen</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              required
              label="Klassenname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              autoComplete="off"
            />

            <TextField
              select
              required
              label="Raum"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={saving || loadingRooms}
              helperText={
                loadingRooms
                  ? "Räume werden geladen..."
                  : rooms.length === 0
                    ? "Keine Räume vorhanden."
                    : "Raum, in dem die Klasse unterrichtet wird."
              }
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={String(room.id)}>
                  {room.roomName}
                  {room.roomNumber ? ` (${room.roomNumber})` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={close} disabled={saving}>
            Abbrechen
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving || loadingRooms}
          >
            {saving ? "Wird angelegt..." : "Anlegen"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateClassDialog;
