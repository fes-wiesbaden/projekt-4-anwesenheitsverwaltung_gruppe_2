import { Button } from "@mui/material";

import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import SensorsOutlinedIcon from "@mui/icons-material/SensorsOutlined";

import StatusChip from "../attendance/StatusChip";

import type { AttendanceRow } from "../../types/attendance";

interface RecentRfidScansProps {
  rows: AttendanceRow[];
}

function RecentRfidScans({
  rows,
}: RecentRfidScansProps) {
  return (
    <section className="side-card">
      <div className="side-card-header">
        <div className="side-card-title">
          <SensorsOutlinedIcon />

          <h2>Letzte RFID-Scans</h2>
        </div>

        <Button
          className="show-all-button"
          size="small"
          endIcon={<ArrowForwardOutlinedIcon />}
        >
          Alle anzeigen
        </Button>
      </div>

      <div className="rfid-scan-list">
        {rows.length === 0 ? (
          <div className="empty-side-message">
            Noch keine RFID-Scans vorhanden.
          </div>
        ) : (
          rows.map((row) => (
            <div
              className="rfid-scan-item"
              key={row.studentId}
            >
              <div className="rfid-scan-time">
                {row.checkIn ?? "—"}
              </div>

              <div className="rfid-scan-student">
                <strong className="rfid-student-name">
                  {row.studentName}
                </strong>

                <span className="rfid-student-class">
                  Klasse {row.classroom}
                </span>
              </div>

              <StatusChip status={row.status} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default RecentRfidScans;