import { SensorsOutlined } from "@mui/icons-material";

import StatusChip from "../attendance/StatusChip";
import type { AttendanceStatus } from "../../types/attendance";

export interface RecentRfidScan {
  id: number;
  time: string;
  studentName: string;
  classroom: string;
  status: AttendanceStatus;
}

interface RecentRfidScansProps {
  scans: RecentRfidScan[];
}

function RecentRfidScans({
  scans,
}: RecentRfidScansProps) {
  return (
    <section className="side-card">
      <div className="side-card-header">
        <div className="side-card-title">
          <SensorsOutlined />

          <h2>Letzte RFID-Scans</h2>
        </div>

        <button
          className="side-link-button"
          type="button"
        >
          Alle anzeigen
        </button>
      </div>

      <div className="rfid-scan-list">
        {scans.map((scan) => (
          <div
            className="rfid-scan-item"
            key={scan.id}
          >
            <div className="rfid-scan-time">
              {scan.time}
            </div>

            <div className="rfid-scan-person">
              <strong>{scan.studentName}</strong>

              <span>{scan.classroom}</span>
            </div>

            <StatusChip status={scan.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecentRfidScans;