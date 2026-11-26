
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";

import {
  DataGrid,
  type GridColDef,
} from "@mui/x-data-grid";

import { ApiError } from "../api/http";
import {
  checkAdminAccess,
  deleteStudent,
  describeStudentError,
  type ClassOption,
  type CreatedStudent,
} from "../services/adminService";
import { getClassrooms } from "../services/classroomService";
import { getMyStudents } from "../services/studentService";
import type { ApiStudent } from "../types/api";
import { filterStudents } from "../utils/studentFilter";
import AssignStudentClassDialog from "./admin/AssignStudentClassDialog";
import ConfirmDeleteDialog from "./admin/ConfirmDeleteDialog";
import CreateStudentDialog from "./admin/CreateStudentDialog";

interface DeleteTarget {
  id: string;
  name: string;
}

interface AssignTarget {
  id: string;
  name: string;
  classId: number | null;
}

function StudentsPage() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("ALL");

  const [isAdmin, setIsAdmin] = useState(false);
  const [apiClasses, setApiClasses] = useState<ClassOption[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState<{
    severity: "success" | "warning";
    text: string;
  } | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] =
    useState<AssignTarget | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  // Anlegen und Löschen sind nur für Administratoren sichtbar.
  useEffect(() => {
    let cancelled = false;

    checkAdminAccess().then((access) => {
      if (cancelled || access !== "admin") return;

      setIsAdmin(true);

      getClassrooms()
        .then((list) => {
          if (!cancelled) {
            setApiClasses(
              list.flatMap((item) =>
                item.id === null
                  ? []
                  : [{
                      id: item.id,
                      classroomName: item.classroomName,
                    }],
              ),
            );
          }
        })
        .catch(() => {
          // Ohne Klassenliste kann der Schüler trotzdem angelegt werden.
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getMyStudents()
      .then((data) => {
        if (!cancelled) {
          setStudents(data);
        }
      })
      .catch((err) => {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 401) {
          sessionStorage.removeItem("token");
          window.location.reload();
          return;
        }

        if (err instanceof ApiError && err.status === 403) {
          setError(
            "Keine Berechtigung, die Schülerliste anzuzeigen.",
          );
          return;
        }

        setError("Schüler konnten nicht geladen werden.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  const handleCreated = (
    student: CreatedStudent,
    displayName: string,
  ) => {
    setCreateOpen(false);

    setNotice(
      student.classAssignFailed
        ? {
            severity: "warning",
            text: `${displayName} wurde angelegt, aber die Klasse konnte nicht zugewiesen werden.`,
          }
        : {
            severity: "success",
            text: `${displayName} wurde angelegt.`,
          },
    );

    reload();
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteStudent(deleteTarget.id);

      setNotice({
        severity: "success",
        text: `${deleteTarget.name} wurde gelöscht.`,
      });

      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(describeStudentError(err, "delete"));
    } finally {
      setDeleting(false);
    }
  };

  // Klassen für die Auswahl: alle Klassen vom Backend. Ältere Backend-Stände
  // liefern keine IDs, dann werden die Klassen aus den Schülern gelesen.
  const classOptions = useMemo(() => {
    const byId = new Map<number, ClassOption>();

    for (const student of students) {
      if (student.classroom) {
        byId.set(student.classroom.id, {
          id: student.classroom.id,
          classroomName: student.classroom.classroomName,
        });
      }
    }

    for (const item of apiClasses) {
      byId.set(item.id, item);
    }

    return Array.from(byId.values()).sort((a, b) =>
      a.classroomName.localeCompare(b.classroomName, "de"),
    );
  }, [students, apiClasses]);

  const handleAssigned = (message: string) => {
    setAssignTarget(null);
    setNotice({ severity: "success", text: message });
    reload();
  };

  const classNames = useMemo(() => {
    const names = students
      .map((student) => student.classroom?.classroomName)
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(names)).sort((a, b) =>
      a.localeCompare(b, "de"),
    );
  }, [students]);

  const rows = useMemo(() => {
    return filterStudents(
      students,
      search,
      className,
    ).map((student, index) => ({
      id: student.id,
      classId: student.classroom?.id ?? null,
      nr: index + 1,
      name: student.displayName,
      username: student.username,
      classroom:
        student.classroom?.classroomName ?? "–",
      chip:
        student.rfidChip === undefined
          ? "Keine Angabe"
          : student.rfidChip === null
            ? "Kein Chip"
            : "Zugeordnet",
    }));
  }, [students, search, className]);

  const baseColumns: GridColDef[] = [
    {
      field: "nr",
      headerName: "#",
      width: 60,
      sortable: false,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "username",
      headerName: "Benutzername",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "classroom",
      headerName: "Klasse",
      width: 110,
    },
    {
      field: "chip",
      headerName: "RFID-Chip",
      width: 150,
    },
  ];

  const actionColumn: GridColDef = {
    field: "actions",
    headerName: "Aktionen",
    width: 120,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => (
      <>
        <Tooltip
          title={
            params.row.classId === null
              ? "Klasse zuweisen"
              : "Klasse ändern"
          }
        >
          <IconButton
            size="small"
            color="primary"
            aria-label={`Klasse für ${params.row.name} ändern`}
            onClick={() =>
              setAssignTarget({
                id: String(params.row.id),
                name: String(params.row.name),
                classId: params.row.classId,
              })
            }
          >
            <GroupsOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

      <Tooltip title="Schüler löschen">
        <IconButton
          size="small"
          color="error"
          aria-label={`${params.row.name} löschen`}
          onClick={() => {
            setDeleteError(null);
            setDeleteTarget({
              id: String(params.row.id),
              name: String(params.row.name),
            });
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      </>
    ),
  };

  const columns: GridColDef[] = isAdmin
    ? [...baseColumns, actionColumn]
    : baseColumns;

  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>Schüler</h1>
          <p>
            Übersicht der Schüler mit Klassen und RFID-Zuordnung.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1OutlinedIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Schüler anlegen
          </Button>
        )}
      </div>

      {notice && (
        <Alert
          severity={notice.severity}
          sx={{ mb: 2 }}
          onClose={() => setNotice(null)}
        >
          {notice.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <div className="table-card">
        <div className="attendance-table-header">
          <div>
            <h2>Schülerliste</h2>
            <p>
              {rows.length} von {students.length} Schülern angezeigt
            </p>
          </div>

          <div className="table-controls">
            <TextField
              size="small"
              placeholder="Schüler suchen..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <FormControl
              size="small"
              className="status-filter"
            >
              <InputLabel>Klasse</InputLabel>

              <Select
                value={className}
                label="Klasse"
                onChange={(event) =>
                  setClassName(event.target.value)
                }
              >
                <MenuItem value="ALL">
                  Alle Klassen
                </MenuItem>

                {classNames.map((name) => (
                  <MenuItem
                    key={name}
                    value={name}
                  >
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        <div style={{ height: 520, width: "100%" }}>
          <DataGrid
            loading={isLoading}
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 10,
                },
              },
            }}
            localeText={{
              paginationRowsPerPage: "Zeilen pro Seite:",
              noRowsLabel: "Keine Schüler vorhanden",
            }}
            sx={{ border: 0 }}
          />
        </div>
      </div>

      <CreateStudentDialog
        open={createOpen}
        classes={classOptions}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      {assignTarget && (
        <AssignStudentClassDialog
          key={assignTarget.id}
          studentId={assignTarget.id}
          studentName={assignTarget.name}
          currentClassId={assignTarget.classId}
          classes={classOptions}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Schüler löschen?"
        message={`${deleteTarget?.name ?? ""} wird dauerhaft gelöscht. Eine zugeordnete RFID-Karte wird dabei freigegeben.`}
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}

export default StudentsPage;
