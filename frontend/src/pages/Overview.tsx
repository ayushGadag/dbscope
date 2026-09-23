import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  ShieldAlert,
  ClipboardList,
  FileText,
  Scan,
  FileCode2,
  Network,
  AlertTriangle,
  Server,
  Box,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import type { Project } from '../types';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    projectService.getActiveProject().then(setProject);
  }, []);

  const workflowSteps = [
    { num: 1, name: 'Projects', desc: 'Select application', path: '/projects', icon: Box },
    { num: 2, name: 'Project Scanner', desc: 'Schema & source code', path: '/scanner', icon: Scan },
    { num: 3, name: 'Analyze Change', desc: 'Parse SQL migration', path: '/analyze', icon: FileCode2 },
    { num: 4, name: 'Dependencies', desc: 'Trace DB to routes', path: '/graph', icon: Network },
    { num: 5, name: 'Impact', desc: 'Blast radius matrix', path: '/impact', icon: Activity },
    { num: 6, name: 'Risk', desc: 'Score & evaluate', path: '/risk', icon: ShieldAlert },
    { num: 7, name: 'Migration Plan', desc: 'Safe preparation steps', path: '/plan', icon: ClipboardList },
    { num: 8, name: 'Report', desc: 'Audit & verification', path: '/reports', icon: FileText },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Intro Header */}
      <div className="rounded-lg p-5 bg-[#141720] border border-[#232733]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              Database Change Impact Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Evaluate database schema changes before deployment. DBScope statically traces schema alterations through SQLAlchemy ORM models, Pydantic schemas, and FastAPI route handlers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/scanner')}
              className="px-3 py-1.5 rounded bg-[#191D28] hover:bg-[#202534] text-xs font-medium text-slate-300 border border-[#2B3142] transition flex items-center gap-1.5"
            >
              <Scan className="w-3.5 h-3.5 text-blue-400" />
              <span>Project Scanner</span>
            </button>
            <button
              onClick={() => navigate('/analyze')}
              className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition flex items-center gap-1.5"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Analyze Migration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Project & Tech Stack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-lg p-4 bg-[#141720] border border-[#232733] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-white">
                  Active Project: {project?.name || 'E-Commerce Demo'}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-mono">
                Configured
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              {project?.description}
            </p>
          </div>

          <div className="pt-3 border-t border-[#232733] flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Database: PostgreSQL (Schema: public)</span>
            <span>Last Scanned: {project?.lastScanned}</span>
          </div>
        </div>

        {/* Technology Card */}
        <div className="rounded-lg p-4 bg-[#141720] border border-[#232733]">
          <h3 className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Technology Stack</span>
          </h3>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-[#191D28] border border-[#232733]">
              <span className="text-slate-400 text-[11px]">Database:</span>
              <span className="text-slate-200">PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#191D28] border border-[#232733]">
              <span className="text-slate-400 text-[11px]">Framework:</span>
              <span className="text-slate-200">FastAPI</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#191D28] border border-[#232733]">
              <span className="text-slate-400 text-[11px]">ORM:</span>
              <span className="text-slate-200">SQLAlchemy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Pipeline Workflow */}
      <div className="rounded-lg p-4 bg-[#141720] border border-[#232733]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white">Analysis Pipeline</h3>
          <span className="text-[10px] font-mono text-slate-500">8 Analysis Stages</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.num}
                onClick={() => navigate(step.path)}
                className="group p-2.5 rounded bg-[#191D28] hover:bg-[#202534] border border-[#232733] hover:border-[#384157] transition text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-500">
                      0{step.num}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h4 className="text-xs font-medium text-slate-200 group-hover:text-white">
                    {step.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-blue-400 font-mono flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Demo Analysis Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-[#141720] border border-[#232733]">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">
            Target Migration
          </span>
          <p className="text-xs font-mono font-medium text-amber-300 mt-1 truncate">
            ALTER TABLE users DROP COLUMN email;
          </p>
          <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40 font-mono">
            DROP_COLUMN
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141720] border border-[#232733]">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">
            Impacted Object
          </span>
          <p className="text-xs font-mono font-semibold text-white mt-1">
            users.email
          </p>
          <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40 font-mono">
            Verified in Catalog
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141720] border border-[#232733]">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">
            Code Dependencies
          </span>
          <p className="text-xs font-medium text-white mt-1">
            3 Downstream References
          </p>
          <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-[#1E2330] text-slate-300 border border-[#2B3142] font-mono">
            Model → Schema → Route
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141720] border border-[#232733]">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">
            Assessed Risk
          </span>
          <p className="text-xs font-semibold text-rose-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>HIGH RISK (Score: 88/100)</span>
          </p>
          <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-400 border border-rose-800/40 font-mono">
            Review Required
          </span>
        </div>
      </div>
    </div>
  );
};
