
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";

import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";

import { ApiError } from "../api/http";

import { getAvailableClassrooms } from "../services/classroomService";
import { getMyStudents } from "../services/studentService";
import { getPeriodReport } from "../services/reportService";

import type {
  ApiPeriodReport,
  ApiStudent,
} from "../types/api";

import {
  buildClassOverview,
  buildWeeklyOverview,
  getRecentCheckins,
} from "../utils/dashboardOverview";

import { getPresetRange } from "../utils/reportRows";

interface DashboardPageProps {
  onOpenAttendance: () => void;
  isAdmin: boolean;
}

interface DashboardData {
  report: ApiPeriodReport;
  classes: string[];
  students: ApiStudent[];
}

function DashboardPage({
  onOpenAttendance,
  isAdmin
}: DashboardPageProps) {
  const [today] = useState(
    () => new Date().toLocaleDateString("sv-SE"),
  );

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const range = getPresetRange("week", today);

    Promise.all([
      getPeriodReport(range.from, range.to),
      getAvailableClassrooms(isAdmin),
      getMyStudents(),
    ])
      .then(([report, classes, students]) => {
        if (cancelled) return;

        setData({
          report,
          classes,
          students,
        });
      })
      .catch((err) => {
        if (cancelled) return;

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
            "Keine Berechtigung für die Dashboard-Daten.",
          );
          return;
        }

        setError(
          "Die Dashboard-Daten konnten nicht geladen werden.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [today]);

  const classOverview = data
    ? buildClassOverview(
        data.classes,
        data.students,
        data.report.attendance,
        today,
      )
    : [];

  const weeklyOverview = data
    ? buildWeeklyOverview(
        data.report.attendance,
        today,
      )
    : [];

  const recentCheckins = data
    ? getRecentCheckins(
        data.report.attendance,
        today,
      )
    : [];

  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>
            Überblick über Klassen und Anwesenheiten.
          </p>
        </div>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && <CircularProgress />}

      {data && (
        <Box sx={{ display: "grid", gap: 3 }}>
          <Box>
            <Typography
              variant="h6"
              sx={{ mb: 1.5, fontWeight: 700 }}
            >
              <GroupsOutlinedIcon
                sx={{ verticalAlign: "middle", mr: 1 }}
              />
              Klassen heute
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {classOverview.map((item) => (
                <Card
                  key={item.name}
                  variant="outlined"
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700 }}
                    >
                      Klasse {item.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Raum: {item.room}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{ mt: 1 }}
                    >
                      Sichtbare Schüler: {item.students}
                    </Typography>

                    {item.records === 0 ? (
                      <Alert
                        severity="info"
                        sx={{ my: 1.5 }}
                      >
                        Heute noch keine
                        Anwesenheitsdatensätze.
                      </Alert>
                    ) : (
                      <Box sx={{ my: 1.5 }}>
                        <Typography variant="body1">
                          {item.checkedIn} von{" "}
                          {item.records} Datensätzen
                          mit Check-in
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Davon verspätet: {item.late}
                        </Typography>
                      </Box>
                    )}

                    <Button
                      size="small"
                      endIcon={
                        <ArrowForwardOutlinedIcon />
                      }
                      onClick={onOpenAttendance}
                    >
                      Anwesenheit öffnen
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {classOverview.length === 0 && (
              <Alert severity="info">
                Keine Klassen verfügbar.
              </Alert>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1fr) minmax(0, 1fr)",
              },
              gap: 2,
            }}
          >
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, fontWeight: 700 }}
                >
                  <AccessTimeOutlinedIcon
                    sx={{
                      verticalAlign: "middle",
                      mr: 1,
                    }}
                  />
                  Letzte Check-ins heute
                </Typography>

                {recentCheckins.length === 0 ? (
                  <Typography
                    color="text.secondary"
                    variant="body2"
                  >
                    Heute noch keine Check-ins
                    vorhanden.
                  </Typography>
                ) : (
                  recentCheckins.map((row) => (
                    <Box
                      key={row.attendanceId}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        py: 1,
                        borderBottom:
                          "1px solid #eef1f5",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                        >
                          {row.studentName}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Klasse {row.className}
                        </Typography>
                      </Box>

                      <Typography variant="body2">
                        {row.checkin?.slice(11, 16)}
                      </Typography>
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ mb: 1, fontWeight: 700 }}
                >
                  <BarChartOutlinedIcon
                    sx={{
                      verticalAlign: "middle",
                      mr: 1,
                    }}
                  />
                  Verlauf der letzten 7 Tage
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Anteil der Datensätze mit
                  Check-in pro Tag
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {weeklyOverview.map((day) => (
                    <Box
                      key={day.date}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ width: 48 }}
                      >
                        {day.label}
                      </Typography>

                      <Box
                        sx={{
                          flex: 1,
                          height: 12,
                          backgroundColor: "#eaf2ff",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${day.percentage}%`,
                            height: "100%",
                            backgroundColor: "#175cd3",
                          }}
                        />
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          width: 95,
                          textAlign: "right",
                        }}
                      >
                        {day.records > 0
                          ? `${day.checkedIn}/${day.records} (${day.percentage} %)`
                          : "Keine Daten"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </section>
  );
}

export default DashboardPage;
