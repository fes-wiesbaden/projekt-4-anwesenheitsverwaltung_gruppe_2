import { Box, Button, Typography } from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

function Sidebar() {
  return (
    <aside className="sidebar">
      <Box className="sidebar-navigation">

        <Button
          className="sidebar-item"
          startIcon={<DashboardOutlinedIcon />}
        >
          Dashboard
        </Button>

        <Button
          className="sidebar-item sidebar-item-active"
          startIcon={<CalendarMonthOutlinedIcon />}
        >
          Anwesenheit
        </Button>

        <Button
          className="sidebar-item"
          startIcon={<GroupsOutlinedIcon />}
        >
          Klassen
        </Button>

        <Button
          className="sidebar-item"
          startIcon={<PersonOutlineOutlinedIcon />}
        >
          Schüler
        </Button>

        <Button
          className="sidebar-item"
          startIcon={<SensorsOutlinedIcon />}
        >
          RFID-Scans
        </Button>

        <Button
          className="sidebar-item"
          startIcon={<BarChartOutlinedIcon />}
        >
          Berichte
        </Button>

      </Box>

      <Box className="sidebar-bottom">
        <Button
          className="sidebar-item"
          startIcon={<SettingsOutlinedIcon />}
        >
          Einstellungen
        </Button>

        <Typography className="sidebar-version">
          AttendanceCTRL
          <br />
          Schulprojekt RFID
        </Typography>
      </Box>
    </aside>
  );
}

export default Sidebar;