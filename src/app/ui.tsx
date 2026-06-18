import type { CSSProperties, ReactNode } from 'react';

export function Icon({ name, size = 20, style }: { name: string; size?: number; style?: CSSProperties }) {
  return <i className={`ti ti-${name}`} style={{ fontSize: size, lineHeight: 1, ...style }} aria-hidden="true" />;
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="HyperClass">
      <rect x="13" y="12" width="11" height="40" rx="5.5" fill="var(--ink)" />
      <rect x="40" y="12" width="11" height="40" rx="5.5" fill="var(--ink)" />
      <rect x="14" y="27" width="36" height="11" rx="5.5" fill="var(--coral)" transform="rotate(-20 32 32)" />
    </svg>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <div className="hc-page">{children}</div>;
}

export function Btn(
  { children, onClick, variant, disabled }:
  { children: ReactNode; onClick?: () => void; variant?: 'coral'; disabled?: boolean },
) {
  return (
    <button className={`hc-btn${variant ? ' hc-btn--' + variant : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function StageBar(
  { crumb, title, onBack, actions }:
  { crumb?: string; title: string; onBack: () => void; actions?: ReactNode },
) {
  return (
    <div className="hc-stage-bar">
      <button className="hc-back" onClick={onBack} aria-label="返回"><Icon name="arrow-left" /></button>
      <div className="hc-stage-title">
        {crumb && <span className="crumb">{crumb}</span>}
        <h1>{title}</h1>
      </div>
      <div className="hc-stage-actions">{actions}</div>
    </div>
  );
}
