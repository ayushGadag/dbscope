import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Scan,
  FileCode2,
  Network,
  Activity,
  ShieldAlert,
  ClipboardList,
  FileText,
  Search,
  Bell,
  CheckCircle2,
  Database,
  LogIn,
  LogOut,
  Menu,
  X,
  Server
} from 'lucide-react';
import { Modal, Input, Button } from '../components/ui';
import { scannerService } from '../services/scannerService';

interface NavItem {
  name: string;
  shortName: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', shortName: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', shortName: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Scanner', shortName: 'Scanner', path: '/scanner', icon: Scan },
  { name: 'Analyze DDL', shortName: 'Analyze', path: '/analyze', icon: FileCode2 },
  { name: 'Lineage Graph', shortName: 'Lineage', path: '/graph', icon: Network },
  { name: 'Impact Matrix', shortName: 'Impact', path: '/impact', icon: Activity },
  { name: 'Risk Cockpit', shortName: 'Risk', path: '/risk', icon: ShieldAlert },
  { name: 'Migration Plan', shortName: 'Plan', path: '/plan', icon: ClipboardList },
  { name: 'Reports', shortName: 'Reports', path: '/reports', icon: FileText },
];

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>({
    name: 'John Developer',
    email: 'john@dbscope.dev',
    role: 'Database Architect',
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Dynamic Page Meta for Hero Section
  const getPageMeta = () => {
    const p = location.pathname;
    if (p === '/') {
      return {
        title: 'Overview',
        subtitle: 'Production database schema changes & AST impact telemetry',
        kpi1: { label: 'Active Target', value: 'users.email', icon: 'database', color: '#10b981' },
        kpi2: { label: 'Risk Gate Score', value: '8.0 / 10', icon: 'shield', color: '#ef4444' },
        kpi3: { label: 'Blast Radius', value: '6 Nodes · 4 Tiers', icon: 'network', color: '#f59e0b' },
      };
    }
    if (p === '/projects') {
      return {
        title: 'Projects & Workspaces',
        subtitle: 'Registered codebases, database targets, and GitHub repositories',
        kpi1: { label: 'Active Projects', value: '3 Ready', icon: 'folder', color: '#10b981' },
        kpi2: { label: 'Git Sync', value: 'Clean', icon: 'git', color: '#0ea5e9' },
        kpi3: { label: 'Postgres Host', value: 'Port 5432', icon: 'database', color: '#f59e0b' },
      };
    }
    if (p === '/scanner') {
      return {
        title: 'Project Scanner',
        subtitle: 'Inspect SQLAlchemy models, Pydantic schemas, and FastAPI route handlers',
        kpi1: { label: 'Parsed Files', value: '48 Modules', icon: 'code', color: '#10b981' },
        kpi2: { label: 'ORM Entities', value: '12 Models', icon: 'layers', color: '#0ea5e9' },
        kpi3: { label: 'Public Routes', value: '26 Endpoints', icon: 'globe', color: '#f59e0b' },
      };
    }
    if (p === '/analyze') {
      return {
        title: 'Analyze DDL Change',
        subtitle: 'Simulate PostgreSQL schema alterations before pushing migrations',
        kpi1: { label: 'AST Engine', value: 'v2.1 Deterministic', icon: 'cpu', color: '#10b981' },
        kpi2: { label: 'Parser Syntax', value: 'ANSI/Postgres', icon: 'code', color: '#0ea5e9' },
        kpi3: { label: 'Simulation Mode', value: 'Zero-Lock Dry Run', icon: 'shield', color: '#f59e0b' },
      };
    }
    if (p === '/graph') {
      return {
        title: 'Lineage Graph',
        subtitle: 'Multi-tiered dependency tracing across SQL, ORM, schemas, and routes',
        kpi1: { label: 'Graph Nodes', value: '42 Total', icon: 'network', color: '#10b981' },
        kpi2: { label: 'Max Depth', value: '4 Tiers', icon: 'layers', color: '#0ea5e9' },
        kpi3: { label: 'Circular Refs', value: '0 Clean', icon: 'shield', color: '#10b981' },
      };
    }
    if (p === '/impact') {
      return {
        title: 'Impact Matrix',
        subtitle: 'Downstream affected consumer mapping with blast radius severity',
        kpi1: { label: 'Vulnerable Routes', value: '4 Endpoints', icon: 'alert', color: '#ef4444' },
        kpi2: { label: 'Schema Drift', value: '1 Detected', icon: 'layers', color: '#f59e0b' },
        kpi3: { label: 'Blast Penetration', value: '4 Tiers Max', icon: 'flame', color: '#ef4444' },
      };
    }
    if (p === '/risk') {
      return {
        title: 'Risk Cockpit',
        subtitle: 'Safety score evaluation, locking impact, and runtime vulnerability rating',
        kpi1: { label: 'Overall Risk Score', value: '8.0 / 10', icon: 'shield', color: '#ef4444' },
        kpi2: { label: 'Access Lock', value: 'EXCLUSIVE', icon: 'lock', color: '#f59e0b' },
        kpi3: { label: 'Est. Downtime', value: 'High Risk', icon: 'clock', color: '#ef4444' },
      };
    }
    if (p === '/plan') {
      return {
        title: 'Zero-Downtime Migration Plan',
        subtitle: 'Actionable 4-phase rollout playbook for safe backward-compatible deployments',
        kpi1: { label: 'Rollout Phases', value: '4 Structured', icon: 'check', color: '#10b981' },
        kpi2: { label: 'Dual-Write State', value: 'Phase 2 Required', icon: 'code', color: '#f59e0b' },
        kpi3: { label: 'Rollback Safety', value: 'Automated Script', icon: 'shield', color: '#10b981' },
      };
    }
    if (p === '/reports') {
      return {
        title: 'Audit Reports',
        subtitle: 'Historical schema change records, compliance telemetry, and exportable artifacts',
        kpi1: { label: 'Total Audits', value: '7 Recorded', icon: 'file', color: '#10b981' },
        kpi2: { label: 'Export Formats', value: 'JSON / PDF / SQL', icon: 'download', color: '#0ea5e9' },
        kpi3: { label: 'Compliance Status', value: 'SOC-2 Ready', icon: 'check', color: '#10b981' },
      };
    }
    return {
      title: 'DBscope Platform',
      subtitle: 'Deterministic database change intelligence',
      kpi1: { label: 'Status', value: 'Operational', icon: 'check', color: '#10b981' },
      kpi2: { label: 'Target DB', value: 'PostgreSQL 16', icon: 'database', color: '#0ea5e9' },
      kpi3: { label: 'Engine', value: 'v2.1 Deterministic', icon: 'cpu', color: '#10b981' },
    };
  };

  const pageMeta = getPageMeta();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail) {
      setCurrentUser({
        name: loginEmail.split('@')[0],
        email: loginEmail,
        role: 'Database Engineer',
      });
      setLoginModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf1ed] text-[#122119] font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. SIGNATURE GREENISH CANOPY (Top Header + Horizontal Nav + Hero Display) */}
      {/* ========================================================================= */}
      <div className="p-3 sm:p-4">
        <header className="canopy-container px-6 sm:px-10 pt-6 pb-8 sm:pb-10 relative overflow-hidden shadow-xl">
          
          {/* Subtle Ambient Light Gradients (Greenish aesthetic) */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 right-1/4 w-80 h-80 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

          {/* Top Bar: Brand, Horizontal Navigation Links, Search, Notifications, Avatar */}
          <div className="flex items-center justify-between gap-3 xl:gap-4 relative z-10 border-b border-white/10 pb-5">
            
            {/* Left: Brand Logo & Workspace */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <NavLink to="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#f6b93b] flex items-center justify-center text-slate-900 shadow-md group-hover:scale-105 transition-transform">
                  <Database className="w-4 h-4 text-slate-950" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center">
                  dbscope<span className="text-[#f6b93b] font-black">.</span>
                </span>
              </NavLink>

              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-medium text-emerald-200 border border-white/15 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{scannerService.getActiveDbConfig().database || 'fastapi_demo'}:{scannerService.getActiveDbConfig().port || 5432}</span>
              </span>
            </div>

            {/* Center: Horizontal Navigation Links (Signature Reference Style!) */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-white/10 p-1 xl:p-1.5 rounded-full border border-white/15 backdrop-blur-md shrink min-w-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                      isActive
                        ? 'bg-white text-[#122119] font-bold shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#1c4e35]' : 'text-white/70'}`} />
                    <span>{item.shortName}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Notification Bell, Pill Search, User Avatar */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              
              {/* Notification Bell */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-colors cursor-pointer shrink-0"
                  title="Notifications"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f6b93b] ring-2 ring-[#163f2c]" />
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white text-slate-900 shadow-xl border border-gray-100 p-3 z-50 text-xs">
                    <div className="font-semibold text-slate-900 pb-2 border-b border-gray-100 flex items-center justify-between">
                      <span>Schema Alerts</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-bold">1 Critical</span>
                    </div>
                    <div className="py-2 space-y-2">
                      <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-100">
                        <div className="font-medium text-rose-700">Breaking DDL Mutation</div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-mono">users.email column drop</div>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div className="font-medium text-emerald-800">AST Lineage Synced</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">PostgreSQL 16 catalog verified</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pill Search */}
              <div className="relative hidden sm:block shrink-0">
                <Search className="w-3.5 h-3.5 text-white/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  onClick={() => setSearchModalOpen(true)}
                  readOnly
                  placeholder="Search schema..."
                  className="w-32 lg:w-36 xl:w-48 pl-8.5 pr-8 py-1.5 rounded-full bg-white/15 hover:bg-white/20 border border-white/20 text-xs text-white placeholder-white/60 backdrop-blur-md cursor-pointer focus:outline-none transition-colors"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/70 bg-white/15 px-1.5 py-0.5 rounded-full pointer-events-none">
                  ⌘K
                </kbd>
              </div>

              {/* Mobile / Compact Search Icon Button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="sm:hidden w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-colors cursor-pointer shrink-0"
                title="Search schema"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* User Avatar Circle */}
              <button
                onClick={() => setLoginModalOpen(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer border-2 border-emerald-300 shrink-0"
                title="Account Settings"
              >
                {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'JD'}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 p-3 rounded-2xl bg-white/15 backdrop-blur-lg border border-white/20 grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-left transition-colors ${
                      isActive ? 'bg-white text-slate-900 font-bold' : 'text-white hover:bg-white/15'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Hero Section: Display Title, Key Telemetry KPIs, and Right Schema Hardware Visual */}
          <div className="mt-8 sm:mt-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            {/* Left: Huge Title + Telemetry Row */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                {pageMeta.title}
              </h1>

              {/* Horizontal Telemetry Metrics Row (Exact Reference Style: Water 85%, PH 6.5, Temp 24°C) */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1 text-white">
                
                {/* Metric 1 */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pageMeta.kpi1.color }} />
                    <span>{pageMeta.kpi1.label}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">
                    {pageMeta.kpi1.value}
                  </div>
                </div>

                {/* Metric 2 */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pageMeta.kpi2.color }} />
                    <span>{pageMeta.kpi2.label}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">
                    {pageMeta.kpi2.value}
                  </div>
                </div>

                {/* Metric 3 */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pageMeta.kpi3.color }} />
                    <span>{pageMeta.kpi3.label}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5">
                    {pageMeta.kpi3.value}
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Signature Visual with Floating Interactive Tag Pills (Matching reference device with ● Health, ● Water, ● ph Level) */}
            <div className="hidden md:flex relative items-center justify-center p-4">
              
              {/* Glass Pedestal Unit */}
              <div className="w-64 h-28 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-300" />
                    <span className="text-xs font-bold text-white tracking-wide">POSTGRES CATALOG</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    AST Online
                  </span>
                </div>

                <div className="flex justify-between items-end text-[11px] text-white/80">
                  <span>Downstream Consumers</span>
                  <span className="font-mono font-bold text-[#f6b93b]">6 Nodes Mapped</span>
                </div>
              </div>

              {/* Floating Tag Pill 1: Risk Gate (Top Left) */}
              <div className="absolute -top-1 left-2 px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-md flex items-center gap-1.5 animate-bounce [animation-duration:3s]">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Gate: BLOCK</span>
              </div>

              {/* Floating Tag Pill 2: AST Parser (Right Side) */}
              <div className="absolute top-8 -right-3 px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>AST Parser</span>
              </div>

              {/* Floating Tag Pill 3: Zero Downtime (Bottom Left) */}
              <div className="absolute -bottom-2 left-6 px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Zero Downtime Safe</span>
              </div>

            </div>

          </div>

        </header>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN OUTLET CONTAINER (Cleanly positioned below canopy with zero overlap) */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 relative z-20">
        <Outlet />
      </main>

      {/* ========================================================================= */}
      {/* 3. MODALS: Quick Search & User Authentication */}
      {/* ========================================================================= */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Search Schema & Dependency Lineage"
        description="Jump to database tables, SQLAlchemy models, Pydantic schemas, or FastAPI routes"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. users.email, SQLAlchemy User model, GET /users..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#f4f7f4] border border-[#e2e7e2] rounded-xl focus:outline-none focus:bg-white focus:border-[#1c4e35] text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Suggested Entities
            </div>
            {[
              { type: 'Column', name: 'users.email', path: '/analyze', desc: 'PostgreSQL VARCHAR(255)' },
              { type: 'Model', name: 'User.email', path: '/graph', desc: 'SQLAlchemy Column in backend/models.py' },
              { type: 'Schema', name: 'UserResponse.email', path: '/impact', desc: 'Pydantic BaseModel in backend/schemas.py' },
              { type: 'Endpoint', name: 'GET /users/{id}', path: '/risk', desc: 'FastAPI Public Route in backend/routes.py' },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  navigate(item.path);
                  setSearchModalOpen(false);
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-[#f4f7f4] cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-mono text-xs font-semibold text-slate-900">{item.name}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* User Login & SSO Modal */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title={currentUser ? "User Profile & Environment" : "Sign In to DBscope"}
        description={currentUser ? `Logged in as ${currentUser.email}` : "Authenticate with your engineering credentials"}
        maxWidth="md"
        footer={
          currentUser ? (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="danger"
                size="sm"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                onClick={() => {
                  setCurrentUser(null);
                  setLoginModalOpen(false);
                }}
              >
                Sign Out
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLoginModalOpen(false)}
              >
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#f4f7f4] border border-[#e2e7e2] flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#1c4e35] text-white flex items-center justify-center font-bold text-sm shadow-md">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{currentUser.name}</div>
                <div className="text-xs text-slate-500">{currentUser.email}</div>
                <div className="text-[10px] font-mono text-emerald-700 font-semibold mt-0.5">{currentUser.role}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-slate-500">Connected Database:</span>
                <span className="font-mono font-medium text-slate-800">PostgreSQL 16.2 AST</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-slate-500">Active Workspace:</span>
                <span className="font-medium text-slate-800">ecommerce_prod</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-slate-500">Security Clearance:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Enterprise Verified
                </span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <Input
              label="Work Email"
              type="email"
              placeholder="developer@company.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <Input
              label="Password / API Token"
              type="password"
              placeholder="••••••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => {
                  setCurrentUser({
                    name: 'Demo Engineer',
                    email: 'demo@dbscope.dev',
                    role: 'Lead Architect',
                  });
                  setLoginModalOpen(false);
                }}
              >
                Use Demo Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                leftIcon={<LogIn className="w-3.5 h-3.5" />}
              >
                Sign In
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
