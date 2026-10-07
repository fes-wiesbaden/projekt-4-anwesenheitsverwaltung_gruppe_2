import {
  CampaignOutlined,
  InfoOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";

interface InformationPanelProps {
  absentCount: number;
}

function InformationPanel({
  absentCount,
}: InformationPanelProps) {
  return (
    <section className="side-card">
      <div className="side-card-header">
        <div className="side-card-title">
          <CampaignOutlined />

          <h2>Hinweise & Informationen</h2>
        </div>
      </div>

      <div className="information-list">
        <div className="information-box information-box-info">
          <div className="information-icon">
            <InfoOutlined />
          </div>

          <div>
            <strong>Tipp</strong>

            <p>
              Die Anwesenheit wird bei jedem
              RFID-Scan automatisch aktualisiert.
            </p>
          </div>
        </div>

        {absentCount > 0 && (
          <div className="information-box information-box-warning">
            <div className="information-icon">
              <WarningAmberOutlined />
            </div>

            <div>
              <strong>
                {absentCount}{" "}
                {absentCount === 1
                  ? "Schüler fehlt"
                  : "Schüler fehlen"}
              </strong>

              <p>
                In der ausgewählten Klasse sind
                aktuell {absentCount}{" "}
                {absentCount === 1
                  ? "Schüler abwesend."
                  : "Schüler abwesend."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default InformationPanel;