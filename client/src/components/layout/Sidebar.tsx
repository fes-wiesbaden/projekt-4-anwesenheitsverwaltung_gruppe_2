import { Box, Button, Typography } from "@mui/material";
import type { ReactNode } from "react";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import { canOpenPage, PAGE_TITLES, type PageId } from "../../navigation";

interface SidebarProps {
  current: PageId;
  isAdmin: boolean;
  onNavigate: (page: PageId) => void;
}

const MAIN_ITEMS: { id: PageId; icon: ReactNode }[] = [
  { id: "dashboard", icon: <DashboardOutlinedIcon /> },
  { id: "attendance", icon: <CalendarMonthOutlinedIcon /> },
  { id: "classes", icon: <GroupsOutlinedIcon /> },
  { id: "students", icon: <PersonOutlineOutlinedIcon /> },
  { id: "rfid", icon: <SensorsOutlinedIcon /> },
  { id: "reports", icon: <BarChartOutlinedIcon /> },
  { id: "admin", icon: <AdminPanelSettingsOutlinedIcon /> },
];

function Sidebar({ current, isAdmin, onNavigate }: SidebarProps) {
  const itemClass = (id: PageId) =>
    id === current
      ? "sidebar-item sidebar-item-active"
      : "sidebar-item";

  return (
    <aside className="sidebar">
      <Box className="sidebar-navigation">
        {MAIN_ITEMS.filter((item) => canOpenPage(item.id, isAdmin)).map((item) => (
          <Button
            key={item.id}
            aria-label={PAGE_TITLES[item.id]}
            aria-current={current === item.id ? "page" : undefined}
            className={itemClass(item.id)}
            startIcon={item.icon}
            onClick={() => onNavigate(item.id)}
          >
            {PAGE_TITLES[item.id]}
          </Button>
        ))}
      </Box>

      <Box className="sidebar-bottom">
        <Button
          className={itemClass("settings")}
          startIcon={<SettingsOutlinedIcon />}
          onClick={() => onNavigate("settings")}
        >
          {PAGE_TITLES.settings}
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