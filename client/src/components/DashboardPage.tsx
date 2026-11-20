
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Alert,
  CircularProgress,
} from "@mui/material";

import {
  CheckCircleOutlined,
  GroupsOutlined,
  HighlightOff,
  Schedule,
} from "@mui/icons-material";

import { ApiError } from "../api/http";
import { getDashboard } from "../services/reportService";

import type { ApiDashboard } from "../types/api";

import {
  buildDashboardCards,
  hasNoRecords,
} from "../utils/dashboardCards";

import StatCard from "./attendance/StatCard";

const ICONS: Record<string, ReactNode> = {
  students: <GroupsOutlined />,
  present: <CheckCircleOutlined />,
  late: <Schedule />,
  absent: <HighlightOff />,
};

function DashboardPage() {
  const [data, setData] =
    useState<ApiDashboard | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDashboard()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (cancelled) return;

        if (
          err instanceof ApiError &&
          err.status === 401
        ) {
          sessionStorage.removeItem("token");
          window.location.reload();
          return;
        }

        if (
          err instanceof ApiError &&
          err.status === 403
        ) {
          setError(
            "Keine Berechtigung für das Dashboard.",
          );
          return;
        }

        setError(
          "Dashboard konnte nicht geladen werden.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="attendance-page">
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>
            Überblick über die Anwesenheitskennzahlen.
          </p>
        </div>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && <CircularProgress />}

      {data && (
        <>
          <p>
            Berichtszeitraum: {data.from} bis {data.to}
          </p>

          {hasNoRecords(data) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Für diesen Zeitraum liegen noch
              keine Anwesenheitsdatensätze vor.
            </Alert>
          )}

          <div className="stats-grid">
            {buildDashboardCards(data).map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={ICONS[card.key]}
                variant={card.variant}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default DashboardPage;
