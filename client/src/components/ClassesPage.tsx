
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { ApiError } from "../api/http";

import {
  deleteClassroom,
  describeClassError,
} from "../services/adminService";

import {
  getClassrooms,
  getTimetable,
} from "../services/classroomService";

import { getMyStudents } from "../services/studentService";

import type {
  ApiTimetableEntry,
} from "../types/api";

import {
  buildClassSummaries,
  dayLabel,
  formatTimeRange,
  sortTimetable,
  type ClassSummary,
} from "../utils/classSummary";

import ConfirmDeleteDialog from "./admin/ConfirmDeleteDialog";
import CreateClassDialog from "./admin/CreateClassDialog";

type ClassesPageProps = {
  isAdmin: boolean;
};

function ClassesPage({ isAdmin }: ClassesPageProps) {
  const [summaries, setSummaries] =
    useState<ClassSummary[]>([]);

  const [timetables, setTimetables] =
    useState<Record<number, ApiTimetableEntry[]>>({});

  const [timetableErrors, setTimetableErrors] =
    useState<Record<number, string>>({});

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<ClassSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const reload = () => {
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteTarget.id === null || deleting) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteClassroom(deleteTarget.id);

      setNotice(`Klasse ${deleteTarget.name} wurde gelöscht.`);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      setDeleteError(describeClassError(err, "delete"));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      try {
        const [classrooms, students] = await Promise.all([
          getClassrooms(isAdmin),
          getMyStudents(),
        ]);

        const ids: Record<string, number> = {};
        const rooms: Record<string, string> = {};

        for (const item of classrooms) {
          if (item.id !== null) {
            ids[item.classroomName] = item.id;
          }

          if (item.roomLabel) {
            rooms[item.classroomName] = item.roomLabel;
          }
        }

        const list = buildClassSummaries(
          classrooms.map((item) => item.classroomName),
          students,
          { ids, rooms },
        );

        const tables: Record<
          number,
          ApiTimetableEntry[]
        > = {};

        const errors: Record<number, string> = {};

        await Promise.all(
          list
            .filter((item) => item.id !== null)
            .map(async (item) => {
              const id = item.id;

              if (id === null) {
                return;
              }

              try {
                tables[id] = await getTimetable(id);
              } catch (err) {
                if (
                  err instanceof ApiError &&
                  err.status === 403
                ) {
                  errors[id] =
                    "Keine Berechtigung für diesen Stundenplan.";
                } else {
                  errors[id] =
                    "Stundenplan konnte nicht geladen werden.";
                }
              }
            }),
        );

        if (!cancelled) {
          setSummaries(list);
          setTimetables(tables);
          setTimetableErrors(errors);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (
          err instanceof ApiError &&
          err.status === 401
        ) {
          sessionStorage.removeItem("token");
          window.location.reload();
          return;
        }

        if (
          err instanceof ApiError &&
          err.status === 403
        ) {
          setError(
            "Keine Berechtigung, die Klasseninformationen anzuzeigen.",
          );
        } else {
          setError(
            "Klassen konnten nicht geladen werden.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadClasses();

    return () => {
      cancelled = true;
    };
  }, [reloadKey, isAdmin]);

  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>Klassen</h1>
          <p>
            Übersicht der Klassen mit Raum,
            Schülerzahl und Stundenplan.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="contained"
            onClick={() => {
              setNotice(null);
              setCreateOpen(true);
            }}
          >
            Klasse anlegen
          </Button>
        )}
      </div>

      {notice && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setNotice(null)}
        >
          {notice}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && <CircularProgress />}

      {!isLoading &&
        !error &&
        summaries.length === 0 && (
          <Alert severity="info">
            Keine Klassen vorhanden.
          </Alert>
        )}

      {!isLoading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: 2,
          }}
        >
          {summaries.map((item) => {
            const entries =
              item.id !== null
                ? sortTimetable(
                    timetables[item.id] ?? [],
                  )
                : [];

            const timetableError =
              item.id !== null
                ? timetableErrors[item.id]
                : undefined;

            return (
              <Card
                key={item.name}
                variant="outlined"
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">
                      Klasse {item.name}
                    </Typography>

                    {isAdmin && (
                      <Tooltip
                        title={
                          item.id === null
                            ? "Klassen-ID nicht verfügbar"
                            : "Klasse löschen"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Klasse ${item.name} löschen`}
                            disabled={item.id === null}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(item);
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Raum: {item.roomLabel}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Sichtbare Schüler: {item.studentCount}
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1 }}
                  >
                    Stundenplan
                  </Typography>

                  {item.id === null && (
                    <Typography variant="body2">
                      Klassen-ID nicht verfügbar.
                      Stundenplan kann nicht geladen werden.
                    </Typography>
                  )}

                  {timetableError && (
                    <Alert
                      severity="warning"
                      sx={{ mb: 1 }}
                    >
                      {timetableError}
                    </Alert>
                  )}

                  {item.id !== null &&
                    !timetableError &&
                    entries.length === 0 && (
                      <Typography variant="body2">
                        Kein Stundenplan hinterlegt.
                      </Typography>
                    )}

                  {entries.map((entry) => (
                    <Typography
                      key={entry.id}
                      variant="body2"
                      sx={{ mb: 0.5 }}
                    >
                      {dayLabel(entry.dayOfWeek)}:
                      {" "}
                      {formatTimeRange(entry)}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {createOpen && (
        <CreateClassDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(name) => {
            setCreateOpen(false);
            setNotice(`Klasse ${name} wurde angelegt.`);
            reload();
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Klasse löschen?"
        message={
          deleteTarget
            ? `Klasse ${deleteTarget.name} wird dauerhaft gelöscht.` +
              (deleteTarget.studentCount > 0
                ? ` Ihr sind noch ${deleteTarget.studentCount} Schüler zugeordnet.`
                : "")
            : ""
        }
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}

export default ClassesPage;
