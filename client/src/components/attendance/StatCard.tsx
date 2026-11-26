import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: ReactNode;
  variant: "total" | "present" | "late" | "absent";
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className={`stat-icon stat-icon-${variant}`}>
        {icon}
      </div>

      <div>
        <div className="stat-title">{title}</div>

        <div className="stat-value">
          {value}
        </div>

        {subtitle && (
          <div className="stat-subtitle">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;