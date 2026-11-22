import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { ApiError } from "../api/http";
import { getAdminUsers } from "../services/adminService";
import CreateTeacherDialog from "./admin/CreateTeacherDialog";
import type { ApiAdminUser } from "../types/api";

const columns: GridColDef<ApiAdminUser>[] = [
  { field: "displayName", headerName: "Name", flex: 1, minWidth: 180 },
  { field: "username", headerName: "Benutzername", flex: 1, minWidth: 150 },
  {
    field: "role",
    headerName: "Rolle",
    width: 150,
    renderCell: ({ row }) => (
      <Chip
        size="small"
        label={row.role === "ADMIN" ? "Administrator" : row.role === "TEACHER" ? "Lehrkraft" : "Unbekannt"}
        color={row.role === "ADMIN" ? "primary" : "default"}
        variant="outlined"
      />
    ),
  },
  { field: "createdAt", headerName: "Erstellt am", width: 140 },
];

function AdminPage() {
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminUsers()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((err) => {
        if (cancelled) return;
        setUsers([]);
        setError(err instanceof ApiError && (err.status === 401 || err.status === 403)
          ? "Kein Zugriff auf die Benutzerverwaltung. Bitte Berechtigung und Anmeldung prüfen."
          : "Die Benutzerliste konnte nicht geladen werden.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) =>
      `${user.displayName ?? ""} ${user.username ?? ""} ${user.role ?? ""}`.toLowerCase().includes(term),
    );
  }, [users, search]);

  const refresh = () => {
    setUsers([]);
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  };

  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>Administration</h1>
          <p>Übersicht der Benutzerkonten und ihrer Rollen.</p>
        </div>
      </div>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <AdminPanelSettingsOutlinedIcon color="primary" />
        <Typography variant="body2">Geschützter Bereich für Administratoren</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}

      <div className="table-card">
        <div className="attendance-table-header">
          <div>
            <h2>Benutzerverwaltung</h2>
            <p>{rows.length} von {users.length} Benutzerkonten angezeigt</p>
          </div>
          <div className="table-controls">
            <TextField size="small" label="Benutzer suchen" value={search}
              onChange={(event) => setSearch(event.target.value)} />
            <Button variant="contained" onClick={() => { setNotice(null); setCreateOpen(true); }} disabled={loading || Boolean(error)}>
              Lehrkraft anlegen
            </Button>
            <Button variant="outlined" startIcon={<RefreshOutlinedIcon />}
              onClick={refresh} disabled={loading}>Aktualisieren</Button>
          </div>
        </div>
        <Box sx={{ height: 440, width: "100%" }}>
          <DataGrid rows={rows} columns={columns} loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
            localeText={{ noRowsLabel: "Keine Benutzer angezeigt", paginationRowsPerPage: "Zeilen pro Seite:" }}
            sx={{ border: 0 }} />
        </Box>
      </div>
      <CreateTeacherDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(user) => {
          setCreateOpen(false);
          setSearch("");
          setNotice(`Lehrkraft ${user.displayName || user.username} wurde angelegt.`);
          refresh();
        }}
      />
    </section>
  );
}

export default AdminPage;
