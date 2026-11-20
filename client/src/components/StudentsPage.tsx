
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import {
  DataGrid,
  type GridColDef,
} from "@mui/x-data-grid";

import { ApiError } from "../api/http";
import { getMyStudents } from "../services/studentService";
import type { ApiStudent } from "../types/api";
import { filterStudents } from "../utils/studentFilter";

function StudentsPage() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("ALL");

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
  }, []);

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

  const columns: GridColDef[] = [
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

  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>Schüler</h1>
          <p>
            Übersicht der Schüler mit Klassen und RFID-Zuordnung.
          </p>
        </div>
      </div>

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
    </section>
  );
}

export default StudentsPage;
