import React from 'react';
import {
  Workflow,
  Database,
  Layers,
  FileCode,
  Globe,
  Terminal,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';

export const Architecture: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#232733]">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Workflow className="w-5 h-5 text-blue-400" />
          <span>Architecture Overview</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Layered static analysis pipeline for database change impact assessment.
        </p>
      </div>

      {/* Ripple Pipeline Flow */}
      <div className="rounded-lg p-5 bg-[#141720] border border-[#232733] space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Static Impact Trace Pipeline
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          When a schema modification is proposed, DBScope traverses dependency relationships across each architectural layer:
        </p>

        <div className="flex items-center justify-between gap-2 p-3.5 rounded bg-[#10131B] border border-[#232733] overflow-x-auto text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40 flex-shrink-0">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>PostgreSQL Catalog</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

          <div className="flex items-center gap-2 px-3 py-2 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 flex-shrink-0">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>SQLAlchemy ORM</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

          <div className="flex items-center gap-2 px-3 py-2 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 flex-shrink-0">
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pydantic Schemas</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

          <div className="flex items-center gap-2 px-3 py-2 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 flex-shrink-0">
            <Globe className="w-3.5 h-3.5 text-rose-400" />
            <span>FastAPI Endpoints</span>
          </div>
        </div>
      </div>

      {/* Layer 1 — Application Layer */}
      <div className="rounded-lg p-5 bg-[#141720] border border-[#232733] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#232733]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-semibold">Layer 1</span>
              <h3 className="text-sm font-semibold text-white">Application Layer</h3>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Consumer Codebase</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>FastAPI REST Services</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Traces public HTTP endpoints, routing decorators (<code className="text-slate-300">@router.get</code>), and contract parameters exposed to external clients.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>SQLAlchemy ORM Models</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps database tables to Python model classes, declarative column definitions, and relationship cascades.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Pydantic Schemas</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyzes request/response serialization schemas, field validation rules, and JSON payload contracts.
            </p>
          </div>
        </div>
      </div>

      {/* Layer 2 — DBScope Analysis */}
      <div className="rounded-lg p-5 bg-[#141720] border border-[#232733] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#232733]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">Layer 2</span>
              <h3 className="text-sm font-semibold text-white">DBScope Analysis Engine</h3>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Static Verification</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Migration Analysis</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Parses proposed DDL SQL into abstract syntax tree operations (DROP, ADD, ALTER, RENAME) to extract targeted entities safely.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Schema Metadata Analyzer</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Read-only PostgreSQL catalog inspection (<code className="text-slate-300">information_schema</code>) ensuring zero modifications or execution against live databases.
            </p>
          </div>

          <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-medium text-xs">
              <Workflow className="w-4 h-4 text-indigo-400" />
              <span>Dependency Extraction</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Static Python AST visitor traversing models, schemas, and routes in-memory to trace ripple dependencies end-to-end.
            </p>
          </div>
        </div>
      </div>

      {/* Layer 3 — Database */}
      <div className="rounded-lg p-5 bg-[#141720] border border-[#232733] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#232733]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">Layer 3</span>
              <h3 className="text-sm font-semibold text-white">Database Layer</h3>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Relational Storage</span>
        </div>

        <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-2">
          <div className="flex items-center gap-2 text-white font-medium text-xs">
            <Database className="w-4 h-4 text-blue-400" />
            <span>PostgreSQL Relational Schema & Catalog Metadata</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Source of schema truth providing tables, column attributes, data types, nullability rules, foreign keys, and primary key constraints queried via standard system catalogs without executing any DDL or DML statements.
          </p>
        </div>
      </div>
    </div>
  );
};
