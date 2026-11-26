
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

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
          <AccessTimeOutlinedIcon />
          <h2>Letzte Check-ins</h2>
        </div>
      </div>

      <div className="rfid-scan-list">
        {rows.length === 0 ? (
          <div className="empty-side-message">
            Noch keine Check-ins vorhanden.
          </div>
        ) : (
          rows.map((row) => (
            <div
              className="rfid-scan-item"
              key={row.studentId}
            >
              <div className="rfid-scan-time">
                {row.checkIn ?? "–"}
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
