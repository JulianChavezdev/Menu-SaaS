import type { ReactNode } from "react";

export function WorkspaceHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="workspace-heading">
      <div>
        <p className="workspace-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="workspace-description">{description}</p>}
      </div>
      {actions && <div className="workspace-actions">{actions}</div>}
    </header>
  );
}

export function WorkspaceMetric({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: string | number;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <article className="workspace-metric">
      <h3>{label}</h3>
      <p className="workspace-metric-value">
        {typeof value === "number" ? value.toLocaleString("es-ES") : value}
      </p>
      {children}
      {note && <p className="workspace-metric-note">{note}</p>}
    </article>
  );
}
