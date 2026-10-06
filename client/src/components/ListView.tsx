import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import "../css/main.css";
import { useEffect, useState } from "react";

interface ListViewProps {
  onLogout: () => void;
}

function ListView({ onLogout }: ListViewProps) {
  // DUMMY DATA:
  // TODO: mit echtem Fetch vom Backend (API-Call) ersetzen
  const rows = [{ id: 1, lastName: "Snow", firstName: "Jon" }];

  const DUMMY_CLASSES: string[] = ["Klasse 1", "Klasse 2", "Klasse 3"];

  const getClasses = async (): Promise<string[] | undefined> => {
    try {
      const response = await fetch(
        "/api/classroom/allClassrooms",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Server error:", response.status, errorBody);
        throw new Error(
          "Klassenräume konnten nicht vom Server abgerufen werden.",
        );
      }

      const data: { token: string; classes: string[] } = await response.json();
      localStorage.setItem("token", data.token);
      return data.classes;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [exportFormat, setExportFormat] = useState("");
  const [classes, setClasses] = useState<string[]>(DUMMY_CLASSES);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // TODO: TEST mit Daten in der Datenbank -> funktioniert?
  useEffect(() => {
    const loadClasses = async () => {
      const data = await getClasses();
      console.log(
        "Fetched classes:",
        data,
        Array.isArray(data) ? typeof data[0] : "no data",
      );
      if (data) {
        setClasses(data);
      }
    };
    loadClasses();
  }, []);

  const columns: GridColDef<(typeof rows)[number]>[] = [
    { field: "id", headerName: "ID", width: 90 },
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
      width: 110,
      editable: true,
    },
    {
      field: "presentSince",
      headerName: "Anw. seit:",
      width: 110,
      editable: true,
    },
    {
      field: "presentUntil",
      headerName: "Anw. bis:",
      width: 110,
      editable: true,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "",
      width: 60,
      getActions: () => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Bearbeiten"
          onClick={() => {
            console.log("test");
          }} // TODO: Edit Action implementieren
        />,
      ],
    },
  ];

  return (
    <>
      <div className="action-buttons">
        <Button variant="outlined" onClick={onLogout}>
          Logout
        </Button>
        <Button variant="outlined" onClick={() => setOptionsOpen(true)}>
          Optionen
        </Button>
      </div>
      <h1>Liste:</h1>
      <div className="filter-wrapper">
        <FormControl fullWidth>
          <InputLabel>Klasse</InputLabel>
          <Select
            labelId="class-select-label"
            id="class-select"
            value={selectedClass}
            label="Klasse"
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classes.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          name="datum"
          label="Datum"
          type="date"
          fullWidth
          variant="standard"
          defaultValue={""}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </div>
      <Box sx={{ height: 400, width: "100%" }}>
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
          checkboxSelection={isEditing}
          disableRowSelectionOnClick
        />
      </Box>
      <Button
        variant="contained"
        onClick={() => {
          setIsEditing(!isEditing);
        }}
      >
        {isEditing ? "Abbrechen" : "Editieren"}
      </Button>

      {isEditing && (
        <Button
          variant="contained"
          onClick={() => {
            setIsEditing(!isEditing);
          }}
        >
          Löschen
        </Button>
      )}
      <Dialog
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="info-title">Optionen</DialogTitle>
        {exportOpen && (
          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              labelId="format-select-label"
              id="format-select"
              value={exportFormat}
              label="Format"
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
              <MenuItem value="wav">WAV</MenuItem>
            </Select>
          </FormControl>
        )}
        <DialogContent>
          {exportOpen && ( // TODO: Export Funktionalität implementieren
            <Button
              variant="contained"
              onClick={() => {
                alert("Export");
              }}
            >
              Exportieren
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => {
              setExportOpen(!exportOpen);
            }}
          >
            {!exportOpen ? "Exportieroptionen" : "Abbrechen"}
          </Button>
        </DialogContent>
        <DialogActions>
          <Button
            className="info-close"
            onClick={() => {
              setOptionsOpen(false);
              setExportOpen(false);
            }}
          >
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ListView;
