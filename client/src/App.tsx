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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <>
      <div className="title">
        <h1>PresenceCNTRL</h1>
        <IconButton
          aria-label="Hilfe"
          onClick={() => setHelpOpen(true)}
          size="small"
        >
          <InfoOutlinedIcon />
        </IconButton>
      </div>
      {isLoggedIn ? (
        <ListView onLogout={handleLogout} />
      ) : (
        <LoginView onLoginSuccess={() => setIsLoggedIn(true)} />
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
            <b className="info-headline">Was ist PresenceCTNRL?</b>
            <br />
            <br />
            PresenceCNTRL hilft Lehrkräften und Schüler:innen zuverlässig und
            einfach ihre An- und Abwesenheiten zu verfolgen. Hierbei ersetzt
            PresenceCNTRL die altmodische papierbasierte Lösung und glänzt dabei
            mit einfacher Bedienung, niedriger Fehleranfälligkeit und
            übersichtlicher Darstellung.
          </Typography>
          <br />
          <Typography gutterBottom className="info-content">
            <b className="info-headline">Du hast noch keinen Account oder Probleme beim einloggen?</b>
            <br />
            <br />
            Wende dich an deine/n Klassenlehrer:in oder an die Schulverwaltung,
            um Zugangsdaten zu erhalten.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button className="info-close" onClick={() => setHelpOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default App;
