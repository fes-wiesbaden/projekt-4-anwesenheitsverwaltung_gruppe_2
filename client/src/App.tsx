import AppHeader from "./components/layout/AppHeader";
import Sidebar from "./components/layout/Sidebar";
import { useEffect, useState } from "react";
import ListView from "./components/ListView";
import PlaceholderPage from "./components/PlaceholderPage";
import StudentsPage from "./components/StudentsPage";
import ClassesPage from "./components/ClassesPage";
import DashboardPage from "./components/DashboardPage";
import ReportsPage from "./components/ReportsPage";
import SettingsPage from "./components/SettingsPage";
import AdminPage from "./components/AdminPage";
import { checkAdminAccess, type AdminAccess } from "./services/adminService";
import { canOpenPage, PAGE_TITLES, type PageId } from "./navigation";
import { getUsernameFromToken, isTokenExpired } from "./utils/token";
import fesLogo from "./assets/fes-logo.png";
import LoginView from "./components/LoginView";
import "./css/main.css";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
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

  const [adminAccess, setAdminAccess] = useState<AdminAccess>("checking");
  const [accessCheck, setAccessCheck] = useState(0);
  const isAdmin = isLoggedIn && adminAccess === "admin";
  const currentPage = canOpenPage(page, isAdmin) ? page : "attendance";

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;
    checkAdminAccess().then((result) => {
      if (!cancelled) setAdminAccess(result);
    });

    return () => { cancelled = true; };
  }, [isLoggedIn, accessCheck]);

  const handleLoginSuccess = () => {
    setAdminAccess("checking");
    setPage("attendance");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setAdminAccess("checking");
    setPage("attendance");
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
            isAdmin={isAdmin}
            onHelp={() => setHelpOpen(true)}
            onLogout={handleLogout}
          />

          <div className="app-body">
          <Sidebar
            current={currentPage}
            isAdmin={isAdmin}
            onNavigate={(next) => {
              if (canOpenPage(next, isAdmin)) setPage(next);
            }}
          />

          <main className="app-main">
            {adminAccess === "unavailable" && (
              <Alert severity="warning" sx={{ mb: 2 }} action={
                <Button color="inherit" size="small" onClick={() => {
                  setAdminAccess("checking");
                  setAccessCheck((value) => value + 1);
                }}>
                  Erneut prüfen
                </Button>
              }>
                Admin-Berechtigung konnte nicht geprüft werden.
                Melden Sie sich bei Bedarf erneut an.
              </Alert>
            )}
            {currentPage === "attendance" ? (
              <ListView />
            ) : currentPage === "students" ? (
              <StudentsPage />
            ) : currentPage === "classes" ? (
              <ClassesPage isAdmin={isAdmin} />
            ) : currentPage === "dashboard" ? (
              <DashboardPage onOpenAttendance={() => setPage("attendance")}/>
            ) : currentPage === "reports" ? (
              <ReportsPage />
            ) : currentPage === "settings" ? (
              <SettingsPage />
            ) : currentPage === "admin" && isAdmin ? (
              <AdminPage />
            ) : (
              <PlaceholderPage
                title={PAGE_TITLES[currentPage]}
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
         onLoginSuccess={handleLoginSuccess}
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
            <b className="info-headline">Was ist AttendanceCTRL?</b>
            <br />
            <br />
            AttendanceCTRL unterstützt Lehrkräfte bei der Erfassung und Verwaltung
            von Anwesenheiten. Die Anwendung zeigt die Anwesenheitsdaten
            übersichtlich an und unterstützt die RFID-basierte Erfassung.
          </Typography>
          <br />
          <Typography gutterBottom className="info-content">
            <b className="info-headline">
              Sie haben noch kein Benutzerkonto oder Probleme bei der Anmeldung?
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
