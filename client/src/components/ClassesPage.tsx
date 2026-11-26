
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";

import { ApiError } from "../api/http";

import {
  getAvailableClassrooms,
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

function ClassesPage() {
  const [summaries, setSummaries] =
    useState<ClassSummary[]>([]);

  const [timetables, setTimetables] =
    useState<Record<number, ApiTimetableEntry[]>>({});

  const [timetableErrors, setTimetableErrors] =
    useState<Record<number, string>>({});

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadClasses = async () => {
      try {
        const [names, students] = await Promise.all([
          getAvailableClassrooms(),
          getMyStudents(),
        ]);

        const list = buildClassSummaries(
          names,
          students,
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
  }, []);

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
      </div>

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
                  <Typography
                    variant="h6"
                    sx={{ mb: 1 }}
                  >
                    Klasse {item.name}
                  </Typography>

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
    </section>
  );
}

export default ClassesPage;
