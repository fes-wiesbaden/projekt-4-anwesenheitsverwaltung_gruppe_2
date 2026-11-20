import AppHeader from "./components/layout/AppHeader";
import Sidebar from "./components/layout/Sidebar";
import { useState } from "react";
import ListView from "./components/ListView";
import PlaceholderPage from "./components/PlaceholderPage";
import StudentsPage from "./components/StudentsPage";
import ClassesPage from "./components/ClassesPage";
import DashboardPage from "./components/DashboardPage";
import ReportsPage from "./components/ReportsPage";
import SettingsPage from "./components/SettingsPage";
import { PAGE_TITLES, type PageId } from "./navigation";
import { getUsernameFromToken, isTokenExpired } from "./utils/token";
import fesLogo from "./assets/fes-logo.png";
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
  const token = sessionStorage.getItem("token");

  if (token && isTokenExpired(token)) {
    sessionStorage.removeItem("token");
    return false;
  }

  return Boolean(token);
  });

  const [helpOpen, setHelpOpen] = useState(false);
  const [page, setPage] = useState<PageId>("attendance");

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  return (
    <>
      {isLoggedIn ? (
        <div className="app-shell">

          <AppHeader
            username={getUsernameFromToken(
              sessionStorage.getItem("token"),
            )}
            onHelp={() => setHelpOpen(true)}
            onLogout={handleLogout}
          />

          <div className="app-body">
          <Sidebar
            current={page}
            onNavigate={setPage}
          />

          <main className="app-main">
            {page === "attendance" ? (
              <ListView />
            ) : page === "students" ? (
              <StudentsPage />
            ) : page === "classes" ? (
              <ClassesPage />
            ) : page === "dashboard" ? (
              <DashboardPage />
            ) : page === "reports" ? (
              <ReportsPage />
            ) : page === "settings" ? (
              <SettingsPage />
            ) : (
              <PlaceholderPage
                title={PAGE_TITLES[page]}
                description="Diese Funktion wird mit dem Backend verbunden."
              />
            )}
          </main>

          </div>

        </div>
      ) : (
        <>
        <div className="login-brand">
          <img
            src={fesLogo}
            alt="Logo der Friedrich-Ebert-Schule Wiesbaden"
            style={{
              height: 48,
              width: "auto",
              objectFit: "contain",
              marginRight: 16,
            }}
          />
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
