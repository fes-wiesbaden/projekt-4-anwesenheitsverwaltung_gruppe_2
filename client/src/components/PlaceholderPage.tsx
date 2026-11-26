import { Alert } from "@mui/material";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="attendance-page page-scroll">
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <Alert severity="info">
        Diese Seite ist noch nicht verfügbar.
      </Alert>
    </section>
  );
}

export default PlaceholderPage;
