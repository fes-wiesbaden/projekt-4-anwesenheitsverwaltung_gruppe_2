import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  TextField,
} from "@mui/material";

import {
  CheckCircleOutlined,
  DownloadOutlined,
  GroupsOutlined,
  HighlightOff,
  MoreVert,
  RefreshOutlined,
  Schedule,
} from "@mui/icons-material";

import {
  DataGrid,
  type GridColDef,
} from "@mui/x-data-grid";

import "../css/main.css";

import StatCard from "./attendance/StatCard";
import StatusChip from "./attendance/StatusChip";

import RecentRfidScans from "./dashboard/RecentRfidScans";
import InformationPanel from "./dashboard/InformationPanel";

import {
  checkinStudent,
  checkoutStudent,
  getAttendanceForDay,
  updateAttendance,
} from "../services/attendanceService";

import EditAttendanceDialog from "./attendance/EditAttendanceDialog";

import {
  buildUpdateBody,
  type EditFormValues,
} from "../utils/attendanceEdit";

import {
  describeActionError,
  getRowActions,
} from "../utils/rowActions";

import {
  getStudentsOfClass,
} from "../services/studentService";

import {
  buildAttendanceRows,
  computeStats,
  formatPercent,
} from "../mappers/attendanceMapper";

import type {
  AttendanceRow,
  AttendanceStatus,
} from "../types/attendance";

import {
  getAvailableClassrooms,
} from "../services/classroomService";

import {
  ApiError,
} from "../api/http";

type StatusFilter = "ALL" | AttendanceStatus;

function ListView() {
  const [classes, setClasses] =
    useState<string[]>([]);

  const [selectedClass, setSelectedClass] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState(() =>
      new Date().toLocaleDateString("sv-SE"),
  );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [classRows, setClassRows] =
    useState<AttendanceRow[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [reloadKey, setReloadKey] =
    useState(0);
  
  const [menuAnchor, setMenuAnchor] =
    useState<HTMLElement | null>(null);

  const [menuRow, setMenuRow] =
    useState<AttendanceRow | null>(null);

  const [notice, setNotice] =
    useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);

  const [isActing, setIsActing] =
    useState(false);

  const [editRow, setEditRow] =
    useState<AttendanceRow | null>(null);

  const todayString =
    new Date().toLocaleDateString("sv-SE");

  const isToday =
    selectedDate === todayString;
    
/*
 * Klassen aus dem Backend laden.
 */

  useEffect(() => {
  const loadClasses = async () => {
    try {
      const data =
        await getAvailableClassrooms();

      setClasses(data);

      if (data.length > 0) {
        setSelectedClass(
          (currentClass) =>
            data.includes(currentClass)
              ? currentClass
              : data[0],
        );
      } else {
        setSelectedClass("");
      }
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 ||
          error.status === 403)
      ) {
        sessionStorage.removeItem("token");
        window.location.reload();
        return;
      }

      console.error(
        "Klassen konnten nicht geladen werden.",
        error,
      );

      setClasses([]);
      setSelectedClass("");
    }
  };

  void loadClasses();
}, []);

  /*
   * Schüler der aktuell ausgewählten Klasse.
   */

  useEffect(() => {
    if (!selectedClass) {
      setClassRows([]);
      return;
    }

    let cancelled = false;

    const loadAttendanceData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [students, records] =
          await Promise.all([
            getStudentsOfClass(
              selectedClass,
            ),
            getAttendanceForDay(
              selectedClass,
              selectedDate,
            ),
          ]);

        if (!cancelled) {
          setClassRows(
            buildAttendanceRows(
              students,
              records,
              selectedClass,
            ),
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (
          error instanceof ApiError &&
          (error.status === 401 ||
            error.status === 403)
        ) {
          sessionStorage.removeItem(
            "token",
          );
          window.location.reload();
          return;
        }

        console.error(
          "Anwesenheitsdaten konnten nicht geladen werden.",
          error,
        );

        setClassRows([]);
        setLoadError(
          "Anwesenheitsdaten konnten nicht geladen werden.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAttendanceData();

    return () => {
      cancelled = true;
    };
  }, [
    selectedClass,
    selectedDate,
    reloadKey,
  ]);

  const recentScanRows = useMemo(() => {
  return [...classRows]
    .filter((row) => row.checkIn !== null)
    .sort((a, b) =>
      (b.checkIn ?? "").localeCompare(
        a.checkIn ?? "",
      ),
    )
    .slice(0, 5);
}, [classRows]);

  /*
   * Kennzahlen für die vier Dashboard-Karten.
   */
  const statistics = useMemo(() => {
    const result =
      computeStats(classRows);

    return {
      ...result,

      presentPercentage:
        formatPercent(
          result.present,
          result.total,
        ),

      latePercentage:
        formatPercent(
          result.late,
          result.total,
        ),

      absentPercentage:
        formatPercent(
          result.absent,
          result.total,
        ),
    };
  }, [classRows]);

  /*
   * Suche und Statusfilter.
   */
  const filteredRows = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return classRows.filter(
      (row) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          row.studentName
            .toLowerCase()
            .includes(
              normalizedSearch,
            );

        const matchesStatus =
          statusFilter === "ALL" ||
          row.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );
  }, [
    classRows,
    searchTerm,
    statusFilter,
  ]);

 /*
  * Anwesenheitsdaten erneut vom Backend laden.
  */

  const handleRefresh = () => {
    setReloadKey(
      (current) => current + 1,
    );
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const runAction = async (
    action: () => Promise<unknown>,
    successText: string,
  ) => {
    closeMenu();
    setIsActing(true);

    try {
      await action();

      setNotice({
        type: "success",
        text: successText,
      });

      setReloadKey(
        (current) => current + 1,
      );
    } catch (error) {
      setNotice({
        type: "error",
        text: describeActionError(error),
      });
    } finally {
      setIsActing(false);
    }
  };

  const handleCheckin = () => {
    if (!menuRow) {
      return;
    }

    const row = menuRow;

    void runAction(
      () =>
        checkinStudent(row.studentId),
      `${row.studentName} wurde eingecheckt.`,
    );
  };

  const handleCheckout = () => {
    if (!menuRow) {
      return;
    }

    const row = menuRow;

    void runAction(
      () =>
        checkoutStudent(
          row.studentId,
          selectedDate,
        ),
      `${row.studentName} wurde ausgecheckt.`,
    );
  };

  const handleEditOpen = () => {
    if (!menuRow || menuRow.attendanceId === null) {
      return;
    }

    setEditRow(menuRow);
    closeMenu();
  };

  const handleEditSave = (
    values: EditFormValues,
  ) => {

    const row = editRow;

    if (
      !row ||
      row.attendanceId === null ||
      isActing
    ) {
      return;
    }

    const attendanceId: number = row.attendanceId;

    void (async () => {
      setIsActing(true);

      try {
        const body = buildUpdateBody(
          row,
          selectedDate,
          values,
        );

        await updateAttendance(
          attendanceId,
          body,
        );

        setNotice({
          type: "success",
          text: `Anwesenheit von ${row.studentName} wurde gespeichert.`,
        });

        setEditRow(null);

        setReloadKey(
          (current) => current + 1,
        );
      } catch (error) {
        setNotice({
          type: "error",
          text: describeActionError(error),
        });
      } finally {
        setIsActing(false);
      }
    })();
  };

  const getStatusLabel = (
    status: AttendanceStatus,
  ) => {
    switch (status) {
      case "PRESENT":
        return "Anwesend";

      case "LATE":
        return "Verspätet";

      case "ABSENT":
        return "Abwesend";

      case "NOT_RECORDED":
        return "Nicht erfasst";

      default:
        return "Unbekannt";
    }
  };

  /*
   * CSV-Export funktioniert bereits
   * auf Basis der aktuell sichtbaren Daten.
   */
  const handleExport = () => {
    const header = [
      "Name",
      "Klasse",
      "Status",
      "Check-in",
      "Check-out",
    ];

    const rows =
      filteredRows.map((row) => [
        row.studentName,
        row.classroom,
        getStatusLabel(
          row.status,
        ),
        row.checkIn ?? "",
        row.checkOut ?? "",
      ]);

    const csvContent = [
      header,
      ...rows,
    ]
      .map((row) =>
        row.join(";"),
      )
      .join("\n");

    const blob = new Blob(
      [
        "\uFEFF",
        csvContent,
      ],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `anwesenheit-${selectedClass}-${selectedDate}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  /*
   * Spalten der Schülerliste.
   */
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "#",
      width: 60,
      sortable: false,
    },
    {
      field: "studentName",
      headerName: "Name",
      flex: 1,
      minWidth: 190,
    },
    {
      field: "status",
      headerName: "Status",
      width: 160,
      sortable: false,

      renderCell: (params) => (
        <StatusChip
          status={
            params.value as AttendanceStatus
          }
        />
      ),
    },
    {
      field: "checkIn",
      headerName: "Check-in",
      width: 130,

      renderCell: (params) =>
        params.value ?? "—",
    },
    {
      field: "checkOut",
      headerName: "Check-out",
      width: 130,

      renderCell: (params) =>
        params.value ?? "—",
    },
    {
      field: "action",
      headerName: "Aktion",
      width: 90,
      sortable: false,
      filterable: false,

      renderCell: (params) => {
        const row =
          params.row as AttendanceRow;

        const actions =
          getRowActions(
            row,
            isToday,
          );

        const hasActions =
          actions.canCheckin ||
          actions.canCheckout ||
          actions.canEdit;

        return (
          <IconButton
            size="small"
            aria-label="Aktionen anzeigen"
            disabled={
              !hasActions || isActing
            }
            onClick={(event) => {
              setMenuAnchor(
                event.currentTarget,
              );

              setMenuRow(row);
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        );
      },
    },
  ];

  return (
    <section className="attendance-page">
      {/* Seitentitel */}
      <div className="page-heading">
        <div>
          <h1>
            Anwesenheitsübersicht
          </h1>

          <p>
            Übersicht der Anwesenheit
            für die ausgewählte Klasse
            und das gewählte Datum.
          </p>
        </div>
      </div>

      {/* Hauptbereich + rechte Spalte */}
      <div className="dashboard-content-grid">

        {/* Linke / große Dashboard-Spalte */}
        <div className="dashboard-main-column">

          {/* Filter und Aktionen */}
          <div className="attendance-toolbar-card">
            
            <div className="toolbar-field">
              <FormControl fullWidth>
                <InputLabel>
                  Klasse
                </InputLabel>

                <Select
                  value={
                    selectedClass
                  }
                  label="Klasse"
                  onChange={(
                    event,
                  ) =>
                    setSelectedClass(event.target.value)
                  }
                >
                  {classes.map((classroom) => (
                      <MenuItem
                        key={classroom}
                        value={classroom}
                      >
                        {classroom}
                      </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="toolbar-field">
              <TextField
                label="Datum"
                type="date"
                value={selectedDate}
                fullWidth
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </div>

            <div className="toolbar-actions">
              <Button
                className="refresh-button"
                variant="contained"
                startIcon={<RefreshOutlined />}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading
                  ? "Wird aktualisiert..."
                  : "Anwesenheit aktualisieren"}
            </Button>

            <Button
              className="export-button"
              variant="outlined"
              startIcon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Exportieren
            </Button>
          </div>

        </div>

        {loadError && (
          <Alert severity="error">
            {loadError}
          </Alert>
        )}

          {/* Kennzahlen */}
          <div className="stats-grid">
            <StatCard
              title="Gesamtschüler"
              value={
                statistics.total
              }
              subtitle={`in Klasse ${selectedClass}`}
              icon={
                <GroupsOutlined />
              }
              variant="total"
            />

            <StatCard
              title="Anwesend"
              value={
                statistics.present
              }
              subtitle={
                statistics.presentPercentage
              }
              icon={
                <CheckCircleOutlined />
              }
              variant="present"
            />

            <StatCard
              title="Verspätet"
              value={
                statistics.late
              }
              subtitle={
                statistics.latePercentage
              }
              icon={
                <Schedule />
              }
              variant="late"
            />

            <StatCard
              title="Abwesend"
              value={
                statistics.absent
              }
              subtitle={
                statistics.absentPercentage
              }
              icon={
                <HighlightOff />
              }
              variant="absent"
            />
          </div>

          {/* Schülerliste */}
          <div className="table-card">
            <div className="attendance-table-header">
              <div>
                <h2>
                  Schülerliste (
                  {selectedClass})
                </h2>

                <p>
                  {
                    filteredRows.length
                  }{" "}
                  von{" "}
                  {
                    classRows.length
                  }{" "}
                  Schülern angezeigt
                </p>
              </div>

              <div className="table-controls">
                <TextField
                  size="small"
                  placeholder="Schüler suchen..."
                  value={
                    searchTerm
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearchTerm(
                      event.target
                        .value,
                    )
                  }
                />

                <FormControl
                  size="small"
                  className="status-filter"
                >
                  <InputLabel>
                    Status
                  </InputLabel>

                  <Select
                    value={
                      statusFilter
                    }
                    label="Status"
                    onChange={(
                      event,
                    ) =>
                      setStatusFilter(
                        event.target
                          .value as StatusFilter,
                      )
                    }
                  >
                    <MenuItem value="ALL">
                      Alle
                    </MenuItem>

                    <MenuItem value="PRESENT">
                      Anwesend
                    </MenuItem>

                    <MenuItem value="LATE">
                      Verspätet
                    </MenuItem>

                    <MenuItem value="ABSENT">
                      Abwesend
                    </MenuItem>

                    <MenuItem value="NOT_RECORDED">
                      Nicht erfasst
                    </MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                width: "100%",
              }}
            >
              <DataGrid
                loading={isLoading}
                rows={filteredRows}
                columns={columns}
                disableRowSelectionOnClick
                pageSizeOptions={[
                  10,
                  25,
                ]}
                initialState={{
                  pagination: {
                    paginationModel:
                      {
                        page: 0,
                        pageSize: 10,
                      },
                  },
                }}
                localeText={{
                  paginationRowsPerPage: "Zeilen pro Seite:",
                  noRowsLabel: "Keine Schüler vorhanden",
                }}
                sx={{
                  border: 0,

                  "& .MuiDataGrid-columnHeaders":
                    {
                      backgroundColor:
                        "#f8fafc",
                      borderBottom:
                        "1px solid #e5e9f0",
                    },

                  "& .MuiDataGrid-columnHeaderTitle":
                    {
                      fontWeight: 600,
                      color:
                        "#344054",
                    },

                  "& .MuiDataGrid-cell":
                    {
                      borderBottom:
                        "1px solid #eef1f5",
                      color:
                        "#344054",
                    },

                  "& .MuiDataGrid-row:hover":
                    {
                      backgroundColor:
                        "#f8fbff",
                    },

                  "& .MuiDataGrid-footerContainer":
                    {
                      borderTop:
                        "1px solid #e5e9f0",
                    },
                }}
              />
            </Box>
          </div>
        </div>

        {/* Rechte Dashboard-Spalte */}
        <aside className="dashboard-side-column">
          <RecentRfidScans
            rows={recentScanRows}
          />

          <InformationPanel
            absentCount={
              statistics.absent
            }
          />
        </aside>
      </div>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        {menuRow &&
          getRowActions(
            menuRow,
            isToday,
          ).canCheckin && (
            <MenuItem
              onClick={handleCheckin}
            >
              Einchecken
            </MenuItem>
          )}

        {menuRow &&
          getRowActions(
            menuRow,
            isToday,
          ).canCheckout && (
            <MenuItem
              onClick={handleCheckout}
            >
              Auschecken
            </MenuItem>
          )}
        {menuRow &&
          getRowActions(
            menuRow,
            isToday,
          ).canEdit && (
            <MenuItem
              onClick={handleEditOpen}
            >
              Bearbeiten
            </MenuItem>
          )}
      </Menu>

      <Snackbar
        open={notice !== null}
        autoHideDuration={5000}
        onClose={() =>
          setNotice(null)
        }
      >
        {notice ? (
          <Alert
            severity={notice.type}
            onClose={() =>
              setNotice(null)
            }
          >
            {notice.text}
          </Alert>
        ) : undefined}
      </Snackbar>

      <EditAttendanceDialog
        row={editRow}
        isSaving={isActing}
        onClose={() => setEditRow(null)}
        onSave={handleEditSave}
      />

    </section>
  );
}

export default ListView;