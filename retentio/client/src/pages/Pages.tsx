/** Signal in the Dark: page compositions keep evidence close to the decision. */
import { useEffect, useState, useMemo, useRef, type ReactNode, type FormEvent } from 'react'; 
import { motion, AnimatePresence } from 'framer-motion'; 
import { ArrowRight, Check, Database, Download, Eye, EyeOff, LockKeyhole, Menu, Plus, Save, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'; 
import { Link, useLocation } from 'wouter'; 
import { BackgroundVideo, GradientWaves, NeuralPortalBackground } from '@/components/BackgroundSystems'; 
import { BrandMark, DataTable, Dock, GlassCard, MiniChart, PageHeader, ProfileMenu, SearchField, StatusBadge, SummaryCard, ThemeToggle, UploadDropzone, type UploadDropzoneHandle } from '@/components/AppUI'; 
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { dashboardApi, predictApi, customersApi, settingsApi } from '@/lib/api';
import type { CustomerRow, PredictResponse, DashboardSummary, DashboardTrend, CustomerDetail } from '@/lib/types';

export function Landing(){
  const [,setLocation]=useLocation();

  useEffect(() => {
    // Landing page is strictly dark observatory
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.remove('theme-light');
    root.classList.add('theme-dark');
  }, []);

  return <main className="landing neural-portal-landing">
    <NeuralPortalBackground/>
    <div className="landing-top portal-top">
      <BrandMark/>
    </div>
    <section className="portal-stage" aria-label="Retentio neural portal">
      <div className="portal-copy-panel">
        <p className="eyebrow portal-eyebrow">Retention intelligence / open the signal</p>
        <h1 className="portal-headline">Welcome to <span>Retentio.</span></h1>
        <p className="portal-subcopy">See the quiet signals behind customer behavior before they become churn.</p>
      </div>
      <button className="portal-cta" onClick={()=>setLocation('/signup')}>Get started <ArrowRight size={16}/></button>
    </section>
  </main>
}

export function PublicLayout({ children, dimmed=false }: { children:ReactNode; dimmed?:boolean }) { 
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.remove('theme-light');
    root.classList.add('theme-dark');
  }, []);

  return (
    <main className="public-layout">
      <BackgroundVideo dimmed={dimmed}/>
      <div className="public-top">
        <BrandMark/>
        <Link href="/">Back to home</Link>
      </div>
      {children}
    </main> 
  );
}


export function SignUp(){
  const {signup}=useAuth(); const [,setLocation]=useLocation(); const [form,setForm]=useState({businessName:'',name:'',email:'',password:'',confirm:''}); const [error,setError]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirm,setShowConfirm]=useState(false);
  const description='Retentio reads the small changes in customer behavior that usually arrive before churn. Upload your data, find the accounts that need a conversation, and act while the signal is still quiet.';
  const [typed,setTyped]=useState('');
  useEffect(()=>{ let index=0; let timeout:number|undefined; const type=()=>{ if(index<=description.length){setTyped(description.slice(0,index)); index+=1; timeout=window.setTimeout(type,index===description.length+1?1600:30); } else {index=0; timeout=window.setTimeout(type,700);} }; type(); return()=>{if(timeout) window.clearTimeout(timeout)} },[]);
  const submit=async(e:FormEvent)=>{e.preventDefault(); if(!form.businessName||!form.name||!form.email||form.password.length<8||form.password!==form.confirm){setError('Add your details and make sure both passwords match (8+ characters).'); return;} try { await signup(form); setLocation('/predict'); } catch(err:any) { setError(err.message); }};
  return <div className="auth-grid signup-grid">
    <GlassCard className="auth-card signup-form-card"><p className="eyebrow">Create your observatory</p><h1>Keep the right customers close.</h1><p className="auth-intro">Retentio turns a simple customer export into a prioritized retention plan.</p><form onSubmit={submit}>
      <label className="form-label">Business name<input required type="text" value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} autoComplete="organization"/></label>
      <label className="form-label">Full name<input required type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoComplete="name"/></label>
      <label className="form-label">Work email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="email"/></label>
      <label className="form-label">Password
        <div className="password-input-wrap">
          <input required type={showPassword?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} autoComplete="new-password" placeholder="8+ characters"/>
          <button type="button" className="password-toggle-btn" onClick={()=>setShowPassword(prev=>!prev)} aria-label={showPassword?'Hide password':'Show password'} title={showPassword?'Hide password':'Show password'} tabIndex={0}>
            {showPassword?<EyeOff size={16}/>:<Eye size={16}/>}
          </button>
        </div>
      </label>
      <label className="form-label">Confirm password
        <div className="password-input-wrap">
          <input required type={showConfirm?'text':'password'} value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} autoComplete="new-password" placeholder="Repeat your password"/>
          <button type="button" className="password-toggle-btn" onClick={()=>setShowConfirm(prev=>!prev)} aria-label={showConfirm?'Hide password':'Show password'} title={showConfirm?'Hide password':'Show password'} tabIndex={0}>
            {showConfirm?<EyeOff size={16}/>:<Eye size={16}/>}
          </button>
        </div>
      </label>
      {error&&<p className="form-error">{error}</p>}<button className="primary-button wide" type="submit">Create account <ArrowRight size={16}/></button></form><p className="switch-copy">Already have an account? <Link href="/login">Log in</Link></p></GlassCard>
    <GlassCard className="companion-card"><p className="eyebrow light">Retentio / live signal</p><h2>Your Retention Journey Starts Here</h2><div className="typewriter-copy"><span>{typed}</span><i aria-hidden="true"/></div><div className="companion-orbit"><span/><span/><span/></div></GlassCard>
  </div>
}

const facts=['A 5% lift in retention can increase profits by 25–95%.','Churn is often preceded by a small drop in usage, not a single dramatic event.','The best retention moment is usually before a customer says they are unhappy.','A clear benchmark turns a score into a decision.','Saved customers are proof that your follow-up changed the trajectory.','Customer history makes the next upload more useful than the last.','Small teams can act faster when the priority queue is visible.','Retention work compounds: one saved account can change a quarter.'];

export function Login(){ 
  const {login}=useAuth(); 
  const [,setLocation]=useLocation(); 
  const [email,setEmail]=useState(''); 
  const [password,setPassword]=useState(''); 
  const [showPassword,setShowPassword]=useState(false);
  const [fact,setFact]=useState(0); 
  const [loading,setLoading]=useState(false); 
  const [error,setError]=useState('');

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    setLoading(true);
    setError(''); 
    try { 
      await login(email,password); 
      setLocation('/dashboard'); 
    } catch (err:any) { 
      setError(err.message); 
      setLoading(false); 
    } 
  }; 

  return (
    <div className="auth-grid login-grid">
      <GlassCard className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Resume the signal.</h1>
        <p className="auth-intro">Your latest view of customer health is waiting.</p>
        <form onSubmit={submit}>
          <label className="form-label">
            Work email
            <input 
              required 
              type="email" 
              name="email"
              autoComplete="email"
              value={email} 
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <label className="form-label">
            Password
            <div className="password-input-wrap">
              <input 
                required 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                autoComplete="current-password"
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={()=>setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button wide" disabled={loading} type="submit">
            {loading ? 'Reading your workspace…' : <>Enter workspace <ArrowRight size={16}/></>}
          </button>
        </form>
        <p className="switch-copy">New to Retentio? <Link href="/signup">Create an account</Link></p>
      </GlassCard>
      <GlassCard className="fact-card">
        <div className="fact-top">
          <Sparkles size={18}/>
          <span>Did you know?</span>
          <span className="fact-count">0{fact+1} / 08</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={fact} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
            {facts[fact]}
          </motion.p>
        </AnimatePresence>
        <button className="text-button" onClick={()=>setFact((fact+1)%facts.length)}>
          Next insight <ArrowRight size={15}/>
        </button>
      </GlassCard>
    </div>
  );
}

export function AuthenticatedLayout({ children }: {children:ReactNode}) { 
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <main className={`app-layout ${theme === 'light' ? 'theme-light' : 'theme-dark'}`} data-theme={theme}>
      <GradientWaves/>
      <div className="app-shell">
        <div className="app-top">
          <BrandMark small/>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle/>
            <ProfileMenu/>
          </div>
        </div>
        {children}
      </div>
      <Dock/>
    </main> 
  );
}

// ── Dashboard persistent data cache (eliminates data flicker across navigation) ──
let cachedSummary: DashboardSummary | null = null;
let cachedTrend: DashboardTrend | null = null;
let cachedAtRisk: CustomerRow[] | null = null;
let cachedSaved: CustomerRow[] | null = null;

export function clearDashboardCache() {
  cachedSummary = null;
  cachedTrend = null;
  cachedAtRisk = null;
  cachedSaved = null;
}

export function Dashboard(){ 
  const {user}=useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(() => cachedSummary);
  const [trend, setTrend] = useState<DashboardTrend | null>(() => cachedTrend);
  const [atRisk, setAtRisk] = useState<CustomerRow[]>(() => cachedAtRisk || []);
  const [saved, setSaved] = useState<CustomerRow[]>(() => cachedSaved || []);
  const [loading, setLoading] = useState(() => cachedSummary === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    dashboardApi.summary().then((data) => {
      if (active) {
        setSummary(data);
        cachedSummary = data;
        setLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      if (active && !cachedSummary) setError('Unable to load dashboard data.');
      if (active) setLoading(false);
    });

    dashboardApi.trend().then((data) => {
      if (active) {
        setTrend(data);
        cachedTrend = data;
      }
    }).catch(console.error);

    customersApi.atRisk().then((data) => {
      if (active) {
        setAtRisk(data);
        cachedAtRisk = data;
      }
    }).catch(console.error);

    customersApi.saved().then((data) => {
      if (active) {
        setSaved(data);
        cachedSaved = data;
      }
    }).catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  const displaySummary = summary || cachedSummary;
  const displayAtRisk = atRisk.length > 0 ? atRisk : (cachedAtRisk || []);
  const displaySaved = saved.length > 0 ? saved : (cachedSaved || []);
  const displayTrend = trend || cachedTrend;

  const totalCustomers = displaySummary?.total_customers ?? 0;
  const atRiskCount = displaySummary?.at_risk_count ?? 0;
  const savedCount = displaySummary?.saved_count ?? 0;

  // Dynamic conic-gradient for circular distribution
  const atRiskPct = totalCustomers > 0 ? (atRiskCount / totalCustomers) * 100 : 0;
  const savedPct = totalCustomers > 0 ? (savedCount / totalCustomers) * 100 : 0;
  const donutBackground = totalCustomers > 0
    ? `conic-gradient(var(--red) 0% ${atRiskPct}%, var(--blue) ${atRiskPct}% ${atRiskPct + savedPct}%, var(--mint) ${atRiskPct + savedPct}% 100%)`
    : 'conic-gradient(var(--mint) 0 72%, var(--blue) 72% 88%, var(--red) 88% 100%)';

  return <><PageHeader eyebrow="Workspace / overview" title="Make the next conversation count." description="A calm view of the customers who need your attention, before the signal becomes a goodbye."/>
  {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}
  <div className="summary-grid">
    <SummaryCard 
      label="Total customers" 
      value={displaySummary ? displaySummary.total_customers : (loading ? '—' : 0)} 
      note="Total in system" 
      tone="mint"
    />
    <SummaryCard 
      label="At risk" 
      value={displaySummary ? displaySummary.at_risk_count : (loading ? '—' : 0)} 
      note="Requires attention" 
      tone="risk"
    />
    <SummaryCard 
      label="Saved" 
      value={displaySummary ? displaySummary.saved_count : (loading ? '—' : 0)} 
      note="Successfully retained" 
      tone="saved"
    />
    <SummaryCard 
      label="Avg. risk score" 
      value={displaySummary ? displaySummary.avg_score.toFixed(1) : (loading ? '—' : '0')} 
      note={`Benchmark set at ${user?.benchmark || 78}`} 
      tone="blue"
    />
  </div>
  <div className="dashboard-grid">
    <GlassCard className="chart-card">
      <div className="table-heading"><div><p className="eyebrow">Risk distribution</p><h2>Current customer health</h2></div><span className="chart-period">Overview</span></div>
      <div className="donut-wrap">
        <div className="donut" style={{ background: donutBackground }}>
          <div>
            <strong>{displaySummary ? displaySummary.avg_score.toFixed(1) : (loading ? '—' : '0')}</strong>
            <span>avg score</span>
          </div>
        </div>
        <div className="legend">
          <span><i className="dot red"/> At Risk Customers <b>{displaySummary ? displaySummary.at_risk_count : (loading ? '—' : 0)}</b></span>
          <span><i className="dot blue"/> Saved Customers <b>{displaySummary ? displaySummary.saved_count : (loading ? '—' : 0)}</b></span>
        </div>
      </div>
    </GlassCard>
    <GlassCard className="trend-card">
      <div className="table-heading"><div><p className="eyebrow">Retention movement</p><h2>Risk score trend</h2></div><TrendingDown className="trend-icon" size={20}/></div>
      <MiniChart points={displayTrend?.points || []}/>
      <div className="chart-foot">
        <span>Average risk history</span>
        {displayTrend?.points && displayTrend.points.length > 0 && (
          <b>Latest: {displayTrend.points[displayTrend.points.length - 1].avg_score.toFixed(1)} avg</b>
        )}
      </div>
    </GlassCard>
  </div>
  <div className="dashboard-grid lower">
    <DataTable rows={displayAtRisk} limit={5}/>
    <DataTable rows={displaySaved} saved limit={5}/>
  </div></> 
}

export function Predict(){ 
  const {user}=useAuth();
  const [result,setResult]=useState<PredictResponse|null>(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dropzoneRef = useRef<UploadDropzoneHandle>(null);
  
  const handleUpload = async (file: File) => {
    setLoading(true);
    setError('');
    try {
      const res = await predictApi.upload(file);
      setResult(res);
      clearDashboardCache();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return <><PageHeader eyebrow="Workspace / predict" title="Turn a customer export into a plan." description="Upload recent data and Retentio will organize the signal by urgency." action={<a href={predictApi.templateUrl()} className="secondary-button" download><Download size={15}/> CSV template</a>}/>
  <UploadDropzone ref={dropzoneRef} onUpload={handleUpload} isLoading={loading}/>
  {error && <p className="form-error" style={{marginTop: '1rem'}}>{error}</p>}
  {result&&<motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="predict-results">
    <div className="result-banner">
      <div><span className="eyebrow">Ready to score</span><h2>{result.total_rows} rows processed.</h2><p>Calculated and classified customers against a benchmark of {user?.benchmark || 78}.</p></div>
    </div>
    <div className="dashboard-grid">
      <DataTable rows={result.at_risk}/>
      <DataTable rows={result.saved} saved/>
    </div>
  </motion.div>} 
  {!result&&!loading&&<div className="empty-state"><button className="empty-mark" type="button" onClick={() => dropzoneRef.current?.openPicker()} aria-label="Choose CSV file"><Plus size={20}/></button><h2>Your next signal starts with a CSV.</h2><p>When you upload, the results will appear here with clear at-risk and saved queues.</p></div>}</> 
}

type CustomerFilter = 'all' | 'at-risk' | 'saved';

export function Customers(){ 
  const [location] = useLocation();
  const [query, setQuery] = useState(''); 
  const [filter, setFilter] = useState<CustomerFilter>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const f = p.get('filter') || p.get('status');
      if (f === 'saved') return 'saved';
      if (f === 'at-risk') return 'at-risk';
    }
    return 'all';
  });
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);

  // Sync with URL query parameter changes on navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const f = p.get('filter') || p.get('status');
      if (f === 'saved' || f === 'at-risk' || f === 'all') {
        setFilter(f as CustomerFilter);
      }
    }
  }, [location]);

  // Fetch complete records matching search query & active category filter
  useEffect(() => {
    let active = true;
    setLoadingRows(true);
    const timer = setTimeout(() => {
      customersApi.search(query, filter)
        .then((data) => {
          if (active) {
            setRows(data);
            setLoadingRows(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (active) setLoadingRows(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, filter]);

  const handleFilterChange = (newFilter: CustomerFilter) => {
    setFilter(newFilter);
    const url = newFilter === 'all' ? '/customers' : `/customers?filter=${newFilter}`;
    window.history.replaceState(null, '', url);
  };

  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const data = await customersApi.detail(id);
      setDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const categoryLabel = filter === 'saved' ? 'Saved customers' : filter === 'at-risk' ? 'At-risk customers' : 'All customers';
  const categoryEyebrow = filter === 'saved' ? 'Recovered signal' : filter === 'at-risk' ? 'Priority queue' : 'Complete directory';

  return <><PageHeader eyebrow="Workspace / customers" title="Stay close to the context." description="Search a customer to see the score, the history, and what changed."/>
  <div className="customer-toolbar">
    <SearchField value={query} onChange={setQuery}/>
    <div className="customer-filter-group" role="tablist" aria-label="Customer category filter">
      <button 
        type="button" 
        role="tab"
        aria-selected={filter === 'all'}
        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
        onClick={() => handleFilterChange('all')}
      >
        All
      </button>
      <button 
        type="button" 
        role="tab"
        aria-selected={filter === 'at-risk'}
        className={`filter-tab ${filter === 'at-risk' ? 'active' : ''}`}
        onClick={() => handleFilterChange('at-risk')}
      >
        At Risk
      </button>
      <button 
        type="button" 
        role="tab"
        aria-selected={filter === 'saved'}
        className={`filter-tab ${filter === 'saved' ? 'active' : ''}`}
        onClick={() => handleFilterChange('saved')}
      >
        Saved
      </button>
    </div>
    <span className="customer-count-badge">{rows.length} {rows.length === 1 ? 'customer' : 'customers'}</span>
  </div>
  <div className="customers-grid">
    <GlassCard className="table-card">
      <div className="table-heading">
        <div>
          <p className="eyebrow">{categoryEyebrow}</p>
          <h2>{categoryLabel}</h2>
        </div>
        <span className="chart-period">{query ? `Matching "${query}"` : 'Complete list'}</span>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>Customer</span>
          <span>Risk score</span>
          <span>Status</span>
        </div>
        {loadingRows ? (
          <div className="table-empty-row">Loading customer records…</div>
        ) : rows.length === 0 ? (
          <div className="table-empty-row">
            {query.trim() 
              ? `No ${filter === 'all' ? '' : filter + ' '}customers matching "${query}".`
              : filter === 'saved' 
              ? 'No saved customers recorded yet.' 
              : filter === 'at-risk'
              ? 'No customers currently flagged at risk.'
              : 'No customer records found.'}
          </div>
        ) : (
          rows.map(row=>
            <div className="table-row" key={row.customer_id} onClick={() => loadDetail(row.customer_id)} style={{cursor: 'pointer'}}>
              <span><b>{row.name}</b><small>{row.customer_id} {row.meta ? `· ${row.meta}` : ''}</small></span>
              <span className="score-value">{row.score.toFixed(1)}</span>
              <StatusBadge status={row.status}/>
            </div>
          )
        )}
      </div>
    </GlassCard>
    <GlassCard className="detail-card">
      <p className="eyebrow">Customer detail</p>
      {loadingDetail ? <p>Loading...</p> : detail ? (
        <div className="detail-content">
          <h2>{detail.name}</h2>
          <p>{detail.customer_id}</p>
          <div style={{marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <StatusBadge status={detail.status}/>
            <strong style={{fontSize: '1.5rem'}}>{detail.current_score.toFixed(1)}</strong>
          </div>
          <h3 style={{marginTop: '2rem', marginBottom: '1rem'}}>History</h3>
          <div className="history-list">
            {detail.history.map((h, i) => (
              <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <span style={{color: 'rgba(255,255,255,0.5)'}}>{h.date}</span>
                <strong>{h.score.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="detail-empty">
          <Database size={24}/>
          <h2>Select a customer</h2>
          <p>Choose a row from the priority queue to inspect their score history and status changes.</p>
        </div>
      )}
    </GlassCard>
  </div></> 
}

export function Settings(){ 
  const {user, setUser}=useAuth(); 
  const [benchmark, setBenchmark] = useState<number>(() => {
    const val = user?.benchmark;
    return typeof val === 'number' && val >= 10 && val <= 100 ? val : 78;
  }); 
  const [profile, setProfile] = useState({ name: user?.name || '', business_name: user?.business_name || '' });
  const [savedState, setSavedState] = useState(false); 
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof user?.benchmark === 'number' && user.benchmark >= 10 && user.benchmark <= 100) {
      setBenchmark(user.benchmark);
    }
  }, [user?.benchmark]);

  const saveBenchmark = async () => {
    setSaving(true);
    try {
      const updatedUser = await settingsApi.updateBenchmark(benchmark);
      setUser(updatedUser);
      clearDashboardCache();
      setSavedState(true);
      setTimeout(() => setSavedState(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    try {
      const updatedUser = await settingsApi.updateProfile(profile);
      setUser(updatedUser);
    } catch(e) {
      console.error(e);
    }
  };

  const sensitivity = benchmark >= 80 ? 'selective' : benchmark >= 50 ? 'balanced' : 'sensitive';
  const sensitivityText = benchmark >= 85 
    ? 'Critical Alert (High)' 
    : benchmark >= 70 
    ? 'Priority Focus (Standard)' 
    : benchmark >= 40 
    ? 'Balanced Watchlist' 
    : 'Early Signal (Sensitive)';

  return <><PageHeader eyebrow="Workspace / settings" title="Tune the signal to your business." description="Set the benchmark and workspace details that shape every retention queue."/>
  <div className="settings-grid">
    <GlassCard>
      <p className="eyebrow">Workspace profile</p>
      <h2>Who is reading the signal?</h2>
      <div className="settings-form">
        <label className="form-label">Business name
          <input value={profile.business_name} onChange={e => setProfile({...profile, business_name: e.target.value})} onBlur={saveProfile}/>
        </label>
        <label className="form-label">Your name
          <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} onBlur={saveProfile}/>
        </label>
        <label className="form-label">Email
          <input disabled value={user?.email}/>
        </label>
      </div>
    </GlassCard>
    <GlassCard className="benchmark-card">
      <p className="eyebrow">Signal calibration / threshold</p>
      <h2>When should we raise a flag?</h2>
      <p className="settings-copy">Customers at or above this score appear in your priority queue (range 10 to 100).</p>
      
      <div className="benchmark-display-card">
        <div className="benchmark-value">
          <strong>{benchmark}</strong>
          <span>/ 100</span>
        </div>
        <span className="benchmark-badge" data-sensitivity={sensitivity}>
          {sensitivityText}
        </span>
      </div>

      <div className="benchmark-control-wrap">
        <div className="benchmark-stepper">
          <button 
            type="button" 
            className="stepper-btn" 
            onClick={() => setBenchmark(b => Math.max(10, b - 1))}
            disabled={benchmark <= 10}
            title="Decrease by 1"
            aria-label="Decrease benchmark by 1"
          >
            −
          </button>
          
          <div className="segmented-slider-container">
            <div className="segmented-track-bg">
              <div 
                className="segmented-track-fill" 
                style={{ width: `${((benchmark - 10) / 90) * 100}%` }}
              />
            </div>
            
            <div className="segmented-ticks">
              {[10, 25, 50, 75, 100].map(tick => (
                <div 
                  key={tick} 
                  className={`tick-mark ${benchmark >= tick ? 'active' : ''}`}
                  style={{ left: `${((tick - 10) / 90) * 100}%` }}
                >
                  <span className="tick-pip" />
                  <span className="tick-label">{tick}</span>
                </div>
              ))}
            </div>

            <input 
              className="tactile-range-input" 
              type="range" 
              min="10" 
              max="100" 
              step="1"
              value={benchmark} 
              onChange={e => setBenchmark(Number(e.target.value))}
              aria-label="Risk score benchmark threshold"
              aria-valuemin={10}
              aria-valuemax={100}
              aria-valuenow={benchmark}
            />
          </div>

          <button 
            type="button" 
            className="stepper-btn" 
            onClick={() => setBenchmark(b => Math.min(100, b + 1))}
            disabled={benchmark >= 100}
            title="Increase by 1"
            aria-label="Increase benchmark by 1"
          >
            +
          </button>
        </div>

        <div className="benchmark-presets">
          <span style={{ fontSize: '11px', color: 'var(--muted)', marginRight: '4px' }}>Presets:</span>
          {[25, 50, 75, 85].map(val => (
            <button 
              key={val} 
              type="button"
              className={`preset-btn ${benchmark === val ? 'active' : ''}`}
              onClick={() => setBenchmark(val)}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <button className="primary-button" onClick={saveBenchmark} disabled={saving}>
        <Save size={15}/> {savedState ? 'Saved' : 'Save benchmark'}
      </button>
    </GlassCard>
  </div></> 
}

export function NotFound(){ 
  return <div className="not-found"><p className="eyebrow">404 / signal lost</p><h1>This route drifted off course.</h1><Link href="/" className="primary-button">Return home <ArrowRight size={16}/></Link></div> 
}
