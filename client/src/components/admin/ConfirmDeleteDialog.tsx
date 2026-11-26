import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface Props {
  open: boolean;
  title: string;
  message: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({
  open,
  title,
  message,
  busy,
  error,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onCancel}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DialogContentText>{message}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          Abbrechen
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Wird gelöscht..." : "Löschen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDeleteDialog;
