import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Database,
  Code,
  Layers,
  Globe,
  Droplets,
  Activity,
  Cpu
} from 'lucide-react';

export const Overview: React.FC = () => {
  const navigate = useNavigate();

  // State for weekday selector in Activity Overview card
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>('Fri');

  // Critical Alerts List (matching the middle warm amber card)
  const criticalAlerts = [
    {
      id: 'alt-1',
      title: 'users.email',
      subtitle: 'DROP COLUMN causes 500 runtime error',
      type: 'breaking',
      icon: Database,
      resolved: false,
    },
    {
      id: 'alt-2',
      title: 'UserResponse.email',
      subtitle: 'Downstream Pydantic contract drift',
      type: 'warning',
      icon: Layers,
      resolved: false,
    },
    {
      id: 'alt-3',
      title: 'orders.currency',
      subtitle: 'Nullable ADD COLUMN safe rollout',
      type: 'safe',
      icon: Code,
      resolved: true,
    },
  ];

  // Active Schema Entities (matching the bottom table with circular arc gauges!)
  const activeEntities = [
    {
      no: '№1',
      name: 'users.email',
      type: 'PostgreSQL Column',
      health: 96,
      water: '88%',
      ph: '4 Tiers',
      nutrient: '85%',
      temp: 'FastAPI Public',
      path: '/analyze',
    },
    {
      no: '№2',
      name: 'User.email',
      type: 'SQLAlchemy Model',
      health: 78,
      water: '74%',
      ph: '3 Tiers',
      nutrient: '67%',
      temp: 'Persistence ORM',
      path: '/graph',
    },
    {
      no: '№3',
      name: 'GET /users/{id}',
      type: 'FastAPI Endpoint',
      health: 62,
      water: '43%',
      ph: '4.2k req/m',
      nutrient: '92%',
      temp: 'Public Gateway',
      path: '/risk',
    },
    {
      no: '№4',
      name: 'orders.currency',
      type: 'PostgreSQL Column',
      health: 98,
      water: '26%',
      ph: '2 Tiers',
      nutrient: '95%',
      temp: 'Billing Service',
      path: '/impact',
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* 1. THREE-CARD OVERLAPPING BENTO ROW (Exact Match to Reference Screenshot) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* CARD 1: Dark Pine Card - Growth Analytics / Migration Velocity (4 cols) */}
        <div className="lg:col-span-4 pine-card-bg p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">
              Growth analytics
            </h2>
            <button
              onClick={() => navigate('/graph')}
              className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Details
            </button>
          </div>

          {/* Center Chart: Neon Curved Vector Line + Floating Tooltip Pill */}
          <div className="my-6 relative">
            
            {/* Floating Metric Tooltip Pill: 1.2 cm/day (Exact Match!) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-[#122119] text-xs font-bold shadow-lg flex items-center gap-1.5 z-20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>1.2 cm/day</span>
            </div>

            {/* Vector Curve SVG */}
            <svg className="w-full h-32 overflow-visible" viewBox="0 0 280 120">
              {/* Subtle Grid Guidelines */}
              <line x1="10" y1="40" x2="270" y2="40" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="10" y1="80" x2="270" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Vertical Guideline at Peak */}
              <line x1="140" y1="20" x2="140" y2="105" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="2 2" />

              {/* Dashed Secondary Line (Amber / Lime) */}
              <path
                d="M 10 90 C 80 90, 120 75, 180 70 C 230 65, 260 55, 270 50"
                fill="none"
                stroke="#84cc16"
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.8"
              />

              {/* Glowing Primary Line (Neon Emerald Curve) */}
              <path
                d="M 10 95 C 60 92, 100 80, 140 38 C 180 20, 220 28, 270 32"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
              />

              {/* Active Guideline Dot */}
              <circle cx="140" cy="38" r="4.5" fill="#ffffff" stroke="#22c55e" strokeWidth="2.5" />
            </svg>

            {/* X-Axis Timeline Labels */}
            <div className="flex justify-between text-[11px] font-mono text-white/50 pt-2 px-1">
              <span>0 days</span>
              <span className="text-white/80 font-bold">42 days</span>
              <span>70 days</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <span>AST Deterministic Engine</span>
            <span className="text-emerald-400 font-medium">94.8% Stability</span>
          </div>
        </div>

        {/* CARD 2: Warm Vibrant Amber Card - Critical Alerts (4 cols) */}
        <div className="lg:col-span-4 amber-card-bg p-6 flex flex-col justify-between shadow-xl">
          
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950 tracking-tight">
              Critical Alerts
            </h2>
            <button
              onClick={() => navigate('/risk')}
              className="text-xs font-semibold text-slate-900/70 hover:text-slate-950 transition-colors cursor-pointer"
            >
              See All
            </button>
          </div>

          {/* 3 Translucent White Rounded Capsules (Exact Match!) */}
          <div className="my-4 space-y-3">
            {criticalAlerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.id}
                  onClick={() => navigate('/analyze')}
                  className="bg-white/90 hover:bg-white backdrop-blur-sm rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Round White/Emerald Icon Container */}
                    <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                      <Icon className="w-4 h-4 text-emerald-700" />
                    </div>

                    {/* Alert Text */}
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">
                        {alert.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator Icon */}
                  <div className="shrink-0">
                    {alert.resolved ? (
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-between text-xs text-slate-900/80 font-medium">
            <span>Requires Platform Approval</span>
            <span className="font-bold underline cursor-pointer" onClick={() => navigate('/plan')}>
              View Checklist →
            </span>
          </div>
        </div>

        {/* CARD 3: Light Soft Activity Card - Rollout Milestones & Schedule (4 cols) */}
        <div className="lg:col-span-4 greenish-light-card p-6 flex flex-col justify-between shadow-xl">
          
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#122119] tracking-tight">
              Activity Overview
            </h2>
            <button
              onClick={() => navigate('/plan')}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Details
            </button>
          </div>

          {/* Weekday Selector Pills: Mon Tue Wed Thu Fri(active) Sat */}
          <div className="flex items-center justify-between gap-1 mt-3">
            {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer text-center ${
                  selectedDay === day
                    ? 'bg-[#122119] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-[#e8ede8]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Activity Wavy Line with Tooltip Badge (Watering -> Dual-Write) */}
          <div className="my-3 relative">
            {/* Tooltip Badge: Watering / Dual-Write */}
            <div className="absolute top-1 left-1/3 px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-slate-800 text-[10px] font-semibold shadow-xs flex items-center gap-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f6b93b]" />
              <span>Watering</span>
            </div>

            <svg className="w-full h-16 overflow-visible" viewBox="0 0 260 60">
              <line x1="0" y1="30" x2="260" y2="30" stroke="#f1f5f1" strokeWidth="1" strokeDasharray="3 3" />
              <path
                d="M 5 35 C 40 45, 60 20, 95 38 C 130 55, 150 15, 185 30 C 220 45, 240 25, 255 35"
                fill="none"
                stroke="#3d5045"
                strokeWidth="1.75"
              />
              <circle cx="95" cy="38" r="3.5" fill="#f6b93b" />
            </svg>

            {/* Time stamps */}
            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>16:00</span>
              <span>18:00</span>
            </div>
          </div>

          {/* Scheduled Tasks List with Status Pills */}
          <div className="space-y-2 pt-1 border-t border-[#e2e7e2]">
            <div className="flex items-center justify-between text-xs py-1">
              <div>
                <div className="font-semibold text-slate-900">Watering System Adjustment</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">⏱ 10:30–11:00</div>
              </div>
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Scheduled
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <div>
                <div className="font-semibold text-slate-900">Fertilizer Check</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">⏱ 11:30–12:00</div>
              </div>
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Completed
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <div>
                <div className="font-semibold text-slate-900">Lighting Adjustment</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">⏱ 18:00–18:30</div>
              </div>
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                In Progress
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVE CONTAINERS STATUS TABLE (Signature Arc Gauge & Card Rows) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-extrabold tracking-tight text-[#122119]">
            Active Containers Status
          </h2>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-semibold text-slate-600 hover:text-[#1c4e35] transition-colors cursor-pointer"
          >
            Explore all
          </button>
        </div>

        {/* Column Headers (Matching reference: №, HEALTH, WATER, PH LEVEL, NUTRIENT, TEMPERATURE) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-1">№</div>
          <div className="col-span-2 text-center">HEALTH</div>
          <div className="col-span-2">WATER (%)</div>
          <div className="col-span-2">PH LEVEL</div>
          <div className="col-span-2">NUTRIENT (%)</div>
          <div className="col-span-2">TEMPERATURE (°C)</div>
          <div className="col-span-1 text-right">ACTION</div>
        </div>

        {/* Row Cards (Stacked rounded white cards with radial arc gauge!) */}
        <div className="space-y-3">
          {activeEntities.map((item) => (
            <div
              key={item.no}
              className="greenish-table-row p-4 sm:px-6 sm:py-4 flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 border border-[#e2e7e2]"
            >
              
              {/* № Number (№1, №2) */}
              <div className="md:col-span-1 flex items-center justify-between md:justify-start">
                <span className="text-xl font-bold font-serif text-[#122119]">
                  {item.no}
                </span>
                <span className="md:hidden text-xs font-semibold text-slate-500 font-mono">
                  {item.name}
                </span>
              </div>

              {/* Health Radial Gauge (Semi-circular arc with green stroke!) */}
              <div className="md:col-span-2 flex items-center justify-center">
                <div className="relative w-16 h-10 flex items-center justify-center">
                  <svg className="w-16 h-12 overflow-visible" viewBox="0 0 60 36">
                    {/* Background track arc */}
                    <path
                      d="M 6 30 A 24 24 0 0 1 54 30"
                      fill="none"
                      stroke="#e5eae5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    {/* Foreground colored arc */}
                    <path
                      d="M 6 30 A 24 24 0 0 1 54 30"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="75"
                      strokeDashoffset={75 - (75 * item.health) / 100}
                    />
                  </svg>
                  <span className="absolute bottom-0 text-xs font-bold text-slate-900 font-mono">
                    {item.health}%
                  </span>
                </div>
              </div>

              {/* Water (%) */}
              <div className="md:col-span-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.water}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Blast Radius</div>
                </div>
              </div>

              {/* PH Level */}
              <div className="md:col-span-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.ph}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Dependency Depth</div>
                </div>
              </div>

              {/* Nutrient (%) */}
              <div className="md:col-span-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.nutrient}</div>
                  <div className="text-[10px] text-slate-400 font-mono">AST Coverage</div>
                </div>
              </div>

              {/* Temperature (°C) */}
              <div className="md:col-span-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{item.temp}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Consumer Tier</div>
                </div>
              </div>

              {/* Action: Details Pill Button (Signature forest green pill!) */}
              <div className="md:col-span-1 flex justify-end">
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full md:w-auto px-5 py-1.5 rounded-full bg-[#1c4e35] hover:bg-[#143d2a] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Details
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
