import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
} from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";

import { useEffect, useState } from "react";

import "../css/main.css";

function ListView() {
  // DUMMY DATA:
  // TODO: später durch echte Daten vom Backend ersetzen
  const rows = [
    {
      id: 1,
      lastName: "Snow",
      firstName: "Jon",
    },
  ];

  // Fallback, solange Backend-Daten noch nicht sicher geprüft sind
  const DUMMY_CLASSES: string[] = [
    "Klasse 1",
    "Klasse 2",
    "Klasse 3",
  ];

  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState<string[]>(DUMMY_CLASSES);

  const getClasses = async (): Promise<string[] | undefined> => {
  const token = localStorage.getItem("token");

  if (!token) {
    return undefined;
  }

  try {
    const response = await fetch(
      "/api/classroom/allClassrooms",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error(
        "Server error:",
        response.status,
        errorBody,
      );

      throw new Error(
        "Klassen konnten nicht vom Server abgerufen werden.",
      );
    }

    const data: string[] = await response.json();

    return data;
  } catch (err) {
    console.error(err);

    return undefined;
  }
};

  useEffect(() => {
    const loadClasses = async () => {
      const data = await getClasses();

      console.log(
        "Fetched classes:",
        data,
        Array.isArray(data)
          ? typeof data[0]
          : "no data",
      );

      if (data) {
        setClasses(data);
      }
    };

    loadClasses();
  }, []);

  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "id",
      headerName: "ID",
      width: 90,
    },
    {
      field: "firstName",
      headerName: "Vorname",
      width: 150,
      editable: false,
    },
    {
      field: "lastName",
      headerName: "Nachname",
      width: 150,
      editable: false,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      editable: false,
    },
    {
      field: "presentSince",
      headerName: "Check-in",
      width: 130,
      editable: false,
    },
    {
      field: "presentUntil",
      headerName: "Check-out",
      width: 130,
      editable: false,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Aktion",
      width: 90,
      getActions: () => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Bearbeiten"
          onClick={() => {
            // TODO: später echte Bearbeiten-Funktion einbauen
          }}
        />,
      ],
    },
  ];

  return (
    <section className="attendance-page">
      <div className="page-heading">
        <div>
          <h1>Anwesenheitsübersicht</h1>

          <p>
            Übersicht der Anwesenheit für die ausgewählte Klasse
            und das gewählte Datum.
          </p>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-field">
          <FormControl fullWidth>
            <InputLabel>Klasse</InputLabel>

            <Select
              labelId="class-select-label"
              id="class-select"
              value={selectedClass}
              label="Klasse"
              onChange={(e) =>
                setSelectedClass(e.target.value)
              }
            >
              {classes.map((className) => (
                <MenuItem
                  key={className}
                  value={className}
                >
                  {className}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="filter-field">
          <TextField
            name="datum"
            label="Datum"
            type="date"
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h2>Schülerliste</h2>
        </div>

        <Box
          sx={{
            height: 400,
            width: "100%",
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            disableRowSelectionOnClick
          />
        </Box>
      </div>
    </section>
  );
}

export default ListView;