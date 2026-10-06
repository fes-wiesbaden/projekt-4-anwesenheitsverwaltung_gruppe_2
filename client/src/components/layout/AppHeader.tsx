import {
  Box,
  Button,
  IconButton,
  Typography,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

interface AppHeaderProps {
  onHelp: () => void;
  onLogout: () => void;
}

function AppHeader({ onHelp, onLogout }: AppHeaderProps) {
  return (
    <header className="app-header">
      <Box className="app-header-brand">
        <Typography className="app-logo">
          AttendanceCTRL
        </Typography>

        <Typography className="app-subtitle">
          Anwesenheitsverwaltung mit RFID
        </Typography>
      </Box>

      <Box className="app-header-actions">
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