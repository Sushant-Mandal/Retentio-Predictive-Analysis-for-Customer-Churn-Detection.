/** Signal in the Dark: reusable instrument-console primitives for all product surfaces. */
import { motion } from 'framer-motion'; 
import { Activity, BarChart3, Check, ChevronRight, CircleUserRound, Database, Gauge, LogOut, Moon, Search, Settings2, Sparkles, Sun, UploadCloud } from 'lucide-react'; 
import { Link, useLocation } from 'wouter'; 
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { CustomerRow, TrendPoint } from '@/lib/types';

export function GlassCard({ children, className='' }: { children: ReactNode; className?: string }) { 
  return <div className={`glass-panel ${className}`}>{children}</div>; 
}

export function StatusBadge({ status }: { status: 'At Risk' | 'Saved' | string }) { 
  return <span className={status === 'At Risk' ? 'status-badge risk' : 'status-badge saved'}>{status}</span>; 
}

export function BrandMark({ small=false }: { small?: boolean }) { 
  return <Link href="/" className="brand-mark"><img src="/retentio_logo.png" alt="Retentio" className={small ? 'h-7 w-7' : 'h-9 w-9'} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /><span>RETENTIO</span></Link>; 
}

const nav = [
  { href:'/dashboard', label:'Overview', icon:Gauge }, 
  { href:'/predict', label:'Predict', icon:Activity }, 
  { href:'/customers', label:'Customers', icon:Database }, 
  { href:'/settings', label:'Settings', icon:Settings2 }
];

export function Dock() { 
  const [location] = useLocation(); 
  return <nav className="dock" aria-label="Primary navigation">{nav.map(({href,label,icon:Icon}) => <Link key={href} href={href} className={location===href ? 'dock-item active' : 'dock-item'}><Icon size={18}/><span>{label}</span></Link>)}</nav>; 
}

export function ProfileMenu() { 
  const { user, logout } = useAuth(); 
  const [, setLocation] = useLocation(); 
  return <div className="profile-menu"><div className="profile-avatar"><CircleUserRound size={18}/></div><div className="profile-copy"><span>{user?.name || 'Workspace'}</span><small>{user?.business_name || 'Retentio demo'}</small></div><button aria-label="Log out" onClick={() => { logout(); setLocation('/'); }}><LogOut size={16}/></button></div>; 
}

export function ThemeToggle({ className = '', showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${isLight ? 'is-light' : 'is-dark'} ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
      title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
    >
      <span className="theme-toggle-icon">
        {isLight ? <Moon size={16} /> : <Sun size={16} />}
      </span>
      {showLabel && <span className="theme-toggle-label">{isLight ? 'Dark' : 'Light'}</span>}
    </button>
  );
}


export function PageHeader({ eyebrow, title, description, action }: { eyebrow:string; title:string; description:string; action?: ReactNode }) { 
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</header>; 
}

export function SummaryCard({ label, value, note, tone='neutral' }: { label:string; value:string | number; note:string; tone?:string }) { 
  return <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className={`summary-card tone-${tone}`}><div className="summary-label">{label}</div><strong>{value}</strong><span>{note}</span></motion.div>; 
}

export function MiniChart({ points = [] }: { points?: TrendPoint[]; bars?: boolean }) { 
  if (!points || points.length === 0) {
    return (
      <div className="trend-empty-state">
        <p className="empty-title">No historical trend data yet</p>
        <span className="empty-subtitle">Upload customer batches to track risk progression and score movement over time.</span>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${months[m] || parts[1]} ${d}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  return (
    <div className="trend-chart-container" style={{ width: '100%', height: 185 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 14, right: 14, left: -24, bottom: 2 }}>
          <defs>
            <linearGradient id="riskTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--blue)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#9aa0b1', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.12)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: '#9aa0b1', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const pt = payload[0].payload as TrendPoint;
              return (
                <div className="chart-tooltip">
                  <div className="tooltip-date">{pt.date}</div>
                  <div className="tooltip-row">
                    <span>Avg Risk Score:</span>
                    <strong>{pt.avg_score.toFixed(1)} / 100</strong>
                  </div>
                  <div className="tooltip-row">
                    <span>At-Risk Accounts:</span>
                    <strong className="risk-text">{pt.at_risk_count.toLocaleString()}</strong>
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="avg_score"
            name="Avg Risk Score"
            stroke="var(--mint)"
            strokeWidth={2.5}
            fill="url(#riskTrendGrad)"
            dot={{ r: 4, fill: 'var(--mint)', stroke: '#070911', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#ffffff', stroke: 'var(--mint)', strokeWidth: 2.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DataTable({ 
  rows, 
  saved = false,
  limit,
  onViewAll,
  viewAllHref,
}: { 
  rows: CustomerRow[]; 
  saved?: boolean;
  limit?: number;
  onViewAll?: () => void;
  viewAllHref?: string;
}) { 
  const [, setLocation] = useLocation();
  const displayRows = limit ? rows.slice(0, limit) : rows;
  const targetHref = viewAllHref || (saved ? '/customers?filter=saved' : '/customers?filter=at-risk');

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      setLocation(targetHref);
    }
  };

  return (
    <GlassCard className="table-card">
      <div className="table-heading">
        <div>
          <p className="eyebrow">{saved ? 'Recovered signal' : 'Priority queue'}</p>
          <h2>{saved ? 'Saved customers' : 'At-risk customers'}</h2>
        </div>
        <button 
          type="button" 
          className="quiet-button view-all-btn" 
          onClick={handleViewAll}
          title={`View all ${saved ? 'saved' : 'at-risk'} customers`}
        >
          View all <ChevronRight size={15}/>
        </button>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>Customer</span>
          <span>Risk score</span>
          <span>Status</span>
        </div>
        {displayRows.length === 0 ? (
          <div className="table-empty-row compact-empty">
            <div className="empty-icon-subtle">
              {saved ? <Check size={18} /> : <Sparkles size={18} />}
            </div>
            <strong className="empty-title">
              {saved ? 'No saved customers yet' : 'No customers at risk'}
            </strong>
            <span className="empty-subtitle">
              {saved 
                ? 'Accounts whose risk drops below benchmark will be recorded here.' 
                : 'All monitored accounts currently remain within safe thresholds.'}
            </span>
          </div>
        ) : (
          displayRows.map((row) => (
            <div className="table-row" key={row.customer_id}>
              <span>
                <b>{row.name}</b>
                <small>{row.customer_id} {row.meta ? `· ${row.meta}` : ''}</small>
              </span>
              <span className="score-value">{row.score.toFixed(1)}</span>
              <StatusBadge status={row.status}/>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  ); 
}

export function SearchField({ value, onChange }: { value:string; onChange:(v:string)=>void }) { 
  return <label className="search-field"><Search size={16}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder="Search by customer or ID" /></label>; 
}

export interface UploadDropzoneHandle { openPicker: () => void; }

export const UploadDropzone = forwardRef<UploadDropzoneHandle, { onUpload:(file: File)=>void; isLoading?: boolean }>(
  function UploadDropzone({ onUpload, isLoading }, ref) { 
    const fileInputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => ({ openPicker: () => fileInputRef.current?.click() }), []);
    return (
      <GlassCard className="upload-card">
        <div className="upload-icon"><UploadCloud size={24}/></div>
        <div><p className="eyebrow">Customer export</p><h2>Drop a CSV to surface the signal</h2><p>Use your latest customer export. Retentio validates the columns before scoring.</p></div>
        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} style={{display: 'none'}} onChange={(e) => { if (e.target.files?.[0]) { onUpload(e.target.files[0]); } }} />
        <button className="primary-button" disabled={isLoading} onClick={() => fileInputRef.current?.click()}>
          {isLoading ? 'Uploading...' : 'Choose CSV'} <ChevronRight size={16}/>
        </button>
        <span className="upload-note">CSV only · up to 10 MB</span>
      </GlassCard>
    ); 
  }
);
