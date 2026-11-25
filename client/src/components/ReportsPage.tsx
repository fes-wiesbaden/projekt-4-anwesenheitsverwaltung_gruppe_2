
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Button,
  MenuItem,
  TextField,
} from "@mui/material";

import {
  CheckCircleOutlined,
  DownloadOutlined,
  GroupsOutlined,
  HighlightOff,
  Schedule,
} from "@mui/icons-material";

import {
  DataGrid,
  type GridColDef,
} from "@mui/x-data-grid";

import { ApiError } from "../api/http";
import { getPeriodReport } from "../services/reportService";

import type {
  ApiPeriodReport,
} from "../types/api";

import { formatQuote } from "../utils/dashboardCards";
import { downloadCsv } from "../utils/download";

import {
  buildReportCsv,
  buildReportRows,
  formatDateDe,
  getPresetRange,
  validateRange,
  type ReportPreset,
} from "../utils/reportRows";

import StatCard from "./attendance/StatCard";
import StatusChip from "./attendance/StatusChip";

interface ReportOutcome {
  key: string;
  report: ApiPeriodReport | null;
  error: string | null;
}

function ReportsPage() {
  const today =
    new Date().toLocaleDateString("sv-SE");

  const [preset, setPreset] =
    useState<ReportPreset>("today");

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [outcome, setOutcome] =
    useState<ReportOutcome | null>(null);
  const rangeError = validateRange(
    from,
    to,
  );
  const requestKey = `${from}|${to}`;

  const current =
    !rangeError && outcome?.key === requestKey
      ? outcome
      : null;

  const report = current?.report ?? null;
  const error = current?.error ?? null;
  const isLoading = !rangeError && current === null;
  useEffect(() => {
    if (rangeError) {
      return;
    }

    let cancelled = false;

    getPeriodReport(from, to)
      .then((result) => {
        if (!cancelled) {
          setOutcome({
            key: requestKey,
            report: result,
            error: null,
          });
        }
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
          setOutcome({
            key: requestKey,
            report: null,
            error: "Keine Berechtigung für diesen Bericht.",
          });
          return;
        }

        setOutcome({
          key: requestKey,
          report: null,
          error: "Bericht konnte nicht geladen werden.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, rangeError, requestKey]);

  const rows = useMemo(
    () =>
      report && !rangeError
        ? buildReportRows(report.attendance)
        : [],
    [report, rangeError],
  );

  const handlePreset = (
    value: ReportPreset,
  ) => {
    setPreset(value);

    if (value !== "custom") {
      const range = getPresetRange(
        value,
        today,
      );

      setFrom(range.from);
      setTo(range.to);
    }
  };

  const handleExport = () => {
    downloadCsv(
      `bericht-${from}-${to}.csv`,
      buildReportCsv(rows),
    );
  };

  const columns: GridColDef[] = [
    {
      field: "dateLabel",
      headerName: "Datum",
      width: 120,
    },
    {
      field: "studentName",
      headerName: "Schüler",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "className",
      headerName: "Klasse",
      width: 100,
    },
    {
      field: "status",
      headerName: "Status",
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <StatusChip
          status={params.row.status}
        />
      ),
    },
    {
      field: "checkIn",
      headerName: "Check-in",
      width: 110,
      renderCell: (params) =>
        params.value ?? "–",
    },
    {
      field: "checkOut",
      headerName: "Check-out",
      width: 110,
      renderCell: (params) =>
        params.value ?? "–",
    },
    {
      field: "reason",
      headerName: "Grund",
      flex: 1,
      minWidth: 160,
      renderCell: (params) =>
        params.value ?? "–",
    },
  ];

  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>Berichte</h1>
          <p>
            Anwesenheitsberichte für einen
            ausgewählten Zeitraum.
          </p>
        </div>
      </div>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {rangeError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
        >
          {rangeError}
        </Alert>
      )}

      {report && !rangeError && (
        <div className="stats-grid">
          <StatCard
            title="Datensätze"
            value={report.records}
            subtitle={`${formatDateDe(report.from)} – ${formatDateDe(report.to)}`}
            icon={<GroupsOutlined />}
            variant="total"
          />

          <StatCard
            title="Eingecheckt"
            value={report.present}
            subtitle={`Quote ${formatQuote(report.attendancePercentage)}`}
            icon={<CheckCircleOutlined />}
            variant="present"
          />

          <StatCard
            title="Davon verspätet"
            value={report.lateArrivals}
            subtitle="laut Datensatz"
            icon={<Schedule />}
            variant="late"
          />

          <StatCard
            title="Abwesend"
            value={report.absent}
            subtitle="laut Datensatz"
            icon={<HighlightOff />}
            variant="absent"
          />
        </div>
      )}

      <div className="table-card">
        <div className="attendance-table-header">
          <div>
            <h2>Einträge</h2>
            <p>
              {rows.length} Einträge
              im gewählten Zeitraum
            </p>
          </div>

          <div className="table-controls">
            <TextField
              select
              size="small"
              label="Zeitraum"
              value={preset}
              onChange={(event) =>
                handlePreset(
                  event.target.value as ReportPreset,
                )
              }
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="today">
                Heute
              </MenuItem>

              <MenuItem value="week">
                Letzte 7 Tage
              </MenuItem>

              <MenuItem value="month">
                Dieser Monat
              </MenuItem>

              <MenuItem value="custom">
                Frei wählen
              </MenuItem>
            </TextField>

            <TextField
              size="small"
              type="date"
              label="Von"
              value={from}
              disabled={preset !== "custom"}
              onChange={(event) =>
                setFrom(event.target.value)
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              size="small"
              type="date"
              label="Bis"
              value={to}
              disabled={preset !== "custom"}
              onChange={(event) =>
                setTo(event.target.value)
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <Button
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={
                isLoading ||
                Boolean(rangeError) ||
                rows.length === 0
              }
            >
              Exportieren
            </Button>
          </div>
        </div>

        <div
          style={{
            height: 520,
            width: "100%",
          }}
        >
          <DataGrid
            loading={isLoading}
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[
              10,
              25,
              50,
            ]}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 25,
                },
              },
            }}
            localeText={{
              paginationRowsPerPage:
                "Zeilen pro Seite:",
              noRowsLabel:
                "Keine Einträge im Zeitraum",
            }}
            sx={{
              border: 0,
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default ReportsPage;
