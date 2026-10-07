import {
  CheckCircleOutlined,
  HighlightOff,
  Schedule,
} from "@mui/icons-material";

import type { AttendanceStatus } from "../../types/attendance";

interface StatusChipProps {
  status: AttendanceStatus;
}

function StatusChip({ status }: StatusChipProps) {
  if (status === "PRESENT") {
    return (
      <span className="status-chip status-present">
        <CheckCircleOutlined fontSize="small" />
        Anwesend
      </span>
    );
  }

  if (status === "LATE") {
    return (
      <span className="status-chip status-late">
        <Schedule fontSize="small" />
        Verspätet
      </span>
    );
  }

  return (
    <span className="status-chip status-absent">
      <HighlightOff fontSize="small" />
      Abwesend
    </span>
  );
}

export default StatusChip;