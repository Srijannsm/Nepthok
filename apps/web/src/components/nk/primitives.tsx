'use client';

import { Icon } from './Icon';

// ── Formatting ────────────────────────────────────────────────────────────────
export function fmtRs(n: number): string {
  return 'Rs. ' + Math.round(n).toLocaleString('en-IN');
}

// ── Logo ──────────────────────────────────────────────────────────────────────
export function Logo({ size = 'md', showWord = true }: { size?: 'sm' | 'md' | 'lg'; showWord?: boolean }) {
  const m = size === 'lg' ? 36 : size === 'sm' ? 22 : 28;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span className="nk-logo-mark" style={{ width: m, height: m, borderRadius: Math.round(m / 4), fontSize: Math.round(m * 0.46) }}>
        <span>N</span>
      </span>
      {showWord && (
        <span style={{ fontSize: size === 'lg' ? 19 : size === 'sm' ? 13 : 15, fontWeight: 600, letterSpacing: '-0.022em', color: 'var(--nk-fg)' }}>
          Nepthok
        </span>
      )}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ initials, name, size = 28, tone }: { initials?: string; name?: string; size?: number; tone?: string }) {
  const letters = initials ?? (name ? name.split(' ').map(p => p[0]).slice(0, 2).join('') : '?');
  return (
    <span
      className="nk-avatar"
      style={{
        width: size, height: size,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        borderRadius: '50%',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, flexShrink: 0,
        background: tone ?? 'var(--nk-surface-2)',
        border: '1px solid var(--nk-border)',
        color: tone ? '#0a0a0a' : 'var(--nk-fg)',
      }}
      title={name}
    >
      {letters}
    </span>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeTone = 'success' | 'warn' | 'danger' | 'info' | 'accent' | 'neutral';

export function Badge({ tone = 'neutral', children, dot }: { tone?: BadgeTone; children: React.ReactNode; dot?: boolean }) {
  const cls = tone === 'neutral' ? 'nk-badge' : `nk-badge nk-badge-${tone}`;
  return (
    <span className={cls}>
      {dot && <span className="nk-dot" />}
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'warn', CONFIRMED: 'info', PROCESSING: 'accent', SHIPPED: 'info',
  DELIVERED: 'success', FULFILLED: 'success', CANCELLED: 'danger', REFUNDED: 'danger',
  PAID: 'success', Paid: 'success', Fulfilled: 'success', Shipped: 'info',
  Pending: 'warn', Refunded: 'danger', Active: 'success', Low: 'warn', Out: 'danger', Draft: 'neutral',
  ACTIVE: 'success', TRIAL: 'accent', EXPIRED: 'danger', CANCELLED_STATUS: 'neutral',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot>{status}</Badge>;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
export function Sparkline({ data, width = 80, height = 24, up = true }: { data: number[]; width?: number | string; height?: number; up?: boolean }) {
  if (!data?.length) return null;
  const w = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const stepX = w / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 2) - 1] as [number, number]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)}` : `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`)).join(' ');
  const area = d + ` L${w} ${height} L0 ${height} Z`;
  const color = up ? 'var(--nk-success)' : 'var(--nk-danger)';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }}>
      <path d={area} fill={color} fillOpacity={0.10} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── MiniBar ───────────────────────────────────────────────────────────────────
export function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: '100%', height: 5, background: 'var(--nk-bg-2)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', background: 'var(--nk-accent)', borderRadius: 999 }} />
    </div>
  );
}

// ── AreaChart ─────────────────────────────────────────────────────────────────
export function AreaChart({ data, height = 220, color = 'var(--nk-accent)', labels = [], yFormat = (v: number) => String(v) }: {
  data: number[]; height?: number; color?: string; labels?: string[]; yFormat?: (v: number) => string;
}) {
  if (!data?.length) return null;
  const vw = 720;
  const pad = { top: 14, right: 18, bottom: 24, left: 56 };
  const innerW = vw - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data) * 1.15 || 1;
  const stepX = innerW / (data.length - 1);
  const x = (i: number) => pad.left + i * stepX;
  const y = (v: number) => pad.top + (1 - v / max) * innerH;
  const pts = data.map((v, i) => [x(i), y(v)] as [number, number]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)}` : `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`)).join(' ');
  const area = d + ` L${pad.left + innerW} ${pad.top + innerH} L${pad.left} ${pad.top + innerH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => max * t);
  return (
    <svg viewBox={`0 0 ${vw} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="nk-ag" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <line key={i} x1={pad.left} x2={vw - pad.right} y1={y(t)} y2={y(t)} stroke="var(--nk-border)" strokeDasharray="2 4" />
      ))}
      {ticks.map((t, i) => (
        <text key={i} x={pad.left - 8} y={y(t) + 3} textAnchor="end" fontSize={10.5} fill="var(--nk-muted)" fontFamily="var(--nk-font-sans)">
          {yFormat(t)}
        </text>
      ))}
      {labels.map((lab, i) => {
        if (i % Math.ceil(labels.length / 6) !== 0) return null;
        return <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize={10.5} fill="var(--nk-muted)" fontFamily="var(--nk-font-sans)">{lab}</text>;
      })}
      <path d={area} fill="url(#nk-ag)" />
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={3.5} fill="var(--nk-surface)" stroke={color} strokeWidth={1.75} />
    </svg>
  );
}

// ── Donut ─────────────────────────────────────────────────────────────────────
export function Donut({ segments, size = 134, thickness = 22, label, sub }: {
  segments: { value: number; tone: string }[];
  size?: number; thickness?: number; label: string; sub?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--nk-bg-2)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const offset = acc;
          acc += len;
          return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.tone} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <div className="nk-tnum" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.018em' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--nk-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── KPICard ───────────────────────────────────────────────────────────────────
export function KPICard({ label, value, delta, up, spark }: { label: string; value: string; delta: string; up: boolean; spark?: number[] }) {
  return (
    <div className="nk-card" style={{ padding: 'var(--nk-card-p)' }}>
      <div className="nk-eyebrow" style={{ marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="nk-tnum" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.022em', lineHeight: 1.1 }}>{value}</div>
          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: up ? 'var(--nk-success)' : 'var(--nk-danger)' }}>
            <Icon name={up ? 'arrowUp' : 'arrowDown'} size={12} />
            <span className="nk-tnum">{delta}</span>
            <span style={{ color: 'var(--nk-muted)', fontWeight: 400, marginLeft: 4 }}>vs. prev. 30d</span>
          </div>
        </div>
        {spark && <Sparkline data={spark} up={up} width={86} height={32} />}
      </div>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ vertical }: { vertical?: boolean }) {
  return (
    <div style={{ background: 'var(--nk-border)', flexShrink: 0, ...(vertical ? { width: 1, alignSelf: 'stretch' } : { height: 1, width: '100%' }) }} />
  );
}

export { Icon };
