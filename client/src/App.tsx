import AppHeader from "./components/layout/AppHeader";
import Sidebar from "./components/layout/Sidebar";
import { useState } from "react";
import ListView from "./components/ListView";
import LoginView from "./components/LoginView";
import "./css/main.css";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem("token")),
    );
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <>
      {isLoggedIn ? (
        <div className="app-shell">

          <AppHeader
            onHelp={() => setHelpOpen(true)}
            onLogout={handleLogout}
          />

          <div className="app-body">

            <Sidebar />

            <main className="app-main">
              <ListView />
            </main>

          </div>

        </div>
      ) : (
        <>
        <div className="login-brand">
          <h1>AttendanceCTRL</h1>

          <IconButton
            aria-label="Info"
            onClick={() => setHelpOpen(true)}
          >
            <InfoOutlinedIcon />
          </IconButton>
        </div>

        <LoginView
         onLoginSuccess={() => setIsLoggedIn(true)}
      />
    </>
  )}

      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="info-title">Info</DialogTitle>
        <DialogContent>
          <Typography gutterBottom className="info-content">
            {
              // TODO: Info anpassen (benutzen Schüler das auch?)
            }
            <b className="info-headline">Was ist AttendanceCNTRL?</b>
            <br />
            <br />
            AttendanceCNTRL hilft Lehrkräften zuverlässig und einfach die 
            An- und Abwesenheiten der Schüler zu verfolgen. und zu verwalten
            Hierbei ersetzt AttendanceCNTRL die altmodische papierbasierte 
            Lösung und glänzt dabei mit einfacher Bedienung, niedriger 
            Fehleranfälligkeit und übersichtlicher Darstellung.
          </Typography>
          <br />
          <Typography gutterBottom className="info-content">
            <b className="info-headline">
              Du hast noch keinen Account oder Probleme beim einloggen?
            </b>
            <br />
            <br />
            Wenden Sie sich an einen Administrator oder an die Schulverwaltung,
            um Zugangsdaten zu erhalten.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button className="info-close" onClick={() => setHelpOpen(false)}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default App;
