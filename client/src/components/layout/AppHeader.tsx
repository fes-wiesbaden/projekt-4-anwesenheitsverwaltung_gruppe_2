
import {
  Box,
  Button,
  IconButton,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import fesLogo from "../../assets/fes-logo.png";

interface AppHeaderProps {
  username: string | null;
  isAdmin: boolean;
  onHelp: () => void;
  onLogout: () => void;
}

function AppHeader({
  username,
  isAdmin,
  onHelp,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <Box className="app-header-brand">
        <img
          src={fesLogo}
          alt="Logo der Friedrich-Ebert-Schule Wiesbaden"
          style={{
            height: 44,
            width: "auto",
            objectFit: "contain",
            display: "block",
            marginRight: 12,
            flexShrink: 0,
          }}
        />
        <Typography className="app-logo">
          AttendanceCTRL
        </Typography>

        <Typography className="app-subtitle">
          Friedrich-Ebert-Schule Wiesbaden · Anwesenheitsverwaltung mit RFID
        </Typography>
      </Box>

      <Box className="app-header-actions">
        {username && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              color: "#344054",
              mr: 1,
            }}
          >
            <AccountCircleOutlinedIcon />

            <Typography variant="body2">
              {username}{isAdmin ? " · Administrator" : ""}
            </Typography>
          </Box>
        )}

        <IconButton
          aria-label="Hilfe und Informationen"
          onClick={onHelp}
        >
          <InfoOutlinedIcon />
        </IconButton>

        <Button
          variant="outlined"
          startIcon={<LogoutOutlinedIcon />}
          onClick={onLogout}
        >
          Abmelden
        </Button>
      </Box>
    </header>
  );
}

export default AppHeader;
