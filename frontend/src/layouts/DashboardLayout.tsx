import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  Workflow,
  Database,
} from 'lucide-react';

const navigationItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Project Scanner', path: '/scanner', icon: Scan },
  { name: 'Analyze Change', path: '/analyze', icon: FileCode2 },
  { name: 'Dependency Graph', path: '/graph', icon: Network },
  { name: 'Impact Analysis', path: '/impact', icon: Activity },
  { name: 'Risk Assessment', path: '/risk', icon: ShieldAlert },
  { name: 'Migration Plan', path: '/plan', icon: ClipboardList },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Architecture', path: '/architecture', icon: Workflow },
];

export const DashboardLayout: React.FC = () => {
  const location = useLocation();

  const currentPage = navigationItems.find(
    (item) => item.path === location.pathname
  ) || navigationItems[0];

  return (
    <div className="flex min-h-screen bg-[#0C0E14] text-[#F3F4F6]">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[#232733] bg-[#11141D] flex flex-col flex-shrink-0">
        {/* Logo and Brand */}
        <div className="p-4 border-b border-[#232733] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-[#1C212E] border border-[#2B3142] flex items-center justify-center text-slate-300">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-wide text-white">DBScope</span>
              <span className="block text-[9px] uppercase font-mono tracking-wider text-slate-400">
                Change Impact Analysis
              </span>
            </div>
          </div>
        </div>

        {/* Active Project Banner */}
        <div className="px-3 py-2.5 mx-3 my-3 rounded bg-[#161922] border border-[#232733]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">
              Project
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-xs font-semibold text-slate-200 truncate">E-Commerce Demo</p>
          <div className="flex items-center gap-1 mt-1.5 flex-wrap text-[9px] font-mono text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-[#1E2330] border border-[#2B3142]">PostgreSQL</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1E2330] border border-[#2B3142]">FastAPI</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1E2330] border border-[#2B3142]">SQLAlchemy</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1C2230] text-blue-400 border border-[#2D364A] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#161922]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-[#232733] bg-[#11141D] px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold text-white tracking-tight">
              {currentPage.name}
            </h1>
            <span className="text-slate-600 text-xs">/</span>
            <span className="text-[11px] font-mono text-slate-400">
              E-Commerce Demo • users.email
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/analyze"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Analyze SQL</span>
            </NavLink>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
