import {
  Box,
  Button,
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
import { useState } from "react";

interface ListViewProps {
  onLogout: () => void;
}

function ListView({ onLogout }: ListViewProps) {
  // DUMMY DATA:
  // TODO: mit echtem Fetch vom Backend (API-Call) ersetzen
  const rows = [{ id: 1, lastName: "Snow", firstName: "Jon" }];

  const DUMMY_CLASSES = [
    { id: "class1", label: "Klasse 1" },
    { id: "class2", label: "Klasse 2" },
    { id: "class3", label: "Klasse 3" },
    { id: "class4", label: "Klasse 4" },
  ];

  const [isEditing, setIsEditing] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [classes, setClasses] = useState(DUMMY_CLASSES);

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
      getActions: (params) => [
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
        <Button variant="outlined" onClick={// TODO: Optionen Popup implementieren
        () => alert("Optionen (Export, Einstellungen)")}>
          Optionen
        </Button>
      </div>
      <h1>Liste:</h1>
      <div className="filter-wrapper">
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Klasse</InputLabel>
          <Select // TODO: value anpassen und mit echter Klassenliste verbinden
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={""}
            label="Klasse"
          >
            <MenuItem value="class1">Klasse 1</MenuItem>
            <MenuItem value="class2">Klasse 2</MenuItem>
            <MenuItem value="class3">Klasse 3</MenuItem>
            <MenuItem value="class4">Klasse 4</MenuItem>
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
    </>
  );
}

export default ListView;
