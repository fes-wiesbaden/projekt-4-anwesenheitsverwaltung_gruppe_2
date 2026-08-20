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

function ListView() {
  const [isEditing, setIsEditing] = useState(false);

  const columns: GridColDef<(typeof rows)[number]>[] = [ // TODO: Feldnamen anpassen
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "firstName",
      headerName: "First name",
      width: 150,
      editable: true,
    },
    {
      field: "lastName",
      headerName: "Last name",
      width: 150,
      editable: true,
    },
    {
      field: "age",
      headerName: "Age",
      type: "number",
      width: 110,
      editable: true,
    },
    {
      field: "fullName",
      headerName: "Full name",
      description: "This column has a value getter and is not sortable.",
      sortable: false,
      width: 160,
      valueGetter: (value, row) =>
        `${row.firstName || ""} ${row.lastName || ""}`,
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
          onClick={() => {console.log("test")}} // TODO: Edit Action implementieren
        />,
      ],
    },
  ];

  const rows = [ // TODO: mit echtem Fetch vom Backend (API-Call) ersetzen
    { id: 1, lastName: "Snow", firstName: "Jon", age: 14 },
    { id: 2, lastName: "Lannister", firstName: "Cersei", age: 31 },
    { id: 3, lastName: "Lannister", firstName: "Jaime", age: 31 },
    { id: 4, lastName: "Stark", firstName: "Arya", age: 11 },
    { id: 5, lastName: "Targaryen", firstName: "Daenerys", age: null },
    { id: 6, lastName: "Melisandre", firstName: null, age: 150 },
    { id: 7, lastName: "Clifford", firstName: "Ferrara", age: 44 },
    { id: 8, lastName: "Frances", firstName: "Rossini", age: 36 },
    { id: 9, lastName: "Roxie", firstName: "Harvey", age: 65 },
  ];

  return (
    <>
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
