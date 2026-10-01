import React from 'react';
import {
  Database,
  Layers,
  FileCode,
  Globe,
  Terminal,
  Cpu,
  ShieldCheck,
  Server
} from 'lucide-react';

export const Architecture: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Architecture Pipeline:</span>
          <span className="text-xs font-mono px-3 py-1 bg-white border border-[#e2e7e2] text-slate-900 rounded-full shadow-2xs font-semibold">
            v2.1 Deterministic Engine
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            3-Tier Static AST Lineage
          </span>
        </div>
      </div>

      {/* Horizontal Lineage Flow Diagram */}
      <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
          End-to-End Dependency Lineage Flow
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-[#f4f7f4] border border-[#e2e7e2] text-center space-y-1.5 hover:border-[#1c4e35] transition-all">
            <Database className="w-5 h-5 text-sky-600 mx-auto" />
            <div className="text-xs font-bold text-slate-900">PostgreSQL</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Physical Catalog</div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-[#f4f7f4] border border-[#e2e7e2] text-center space-y-1.5 hover:border-[#1c4e35] transition-all">
            <Layers className="w-5 h-5 text-emerald-600 mx-auto" />
            <div className="text-xs font-bold text-slate-900">SQLAlchemy ORM</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Model Mapping</div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-[#f4f7f4] border border-[#e2e7e2] text-center space-y-1.5 hover:border-[#1c4e35] transition-all">
            <FileCode className="w-5 h-5 text-purple-600 mx-auto" />
            <div className="text-xs font-bold text-slate-900">Pydantic Schemas</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Serialization Contract</div>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-[#f4f7f4] border border-[#e2e7e2] text-center space-y-1.5 hover:border-[#1c4e35] transition-all">
            <Globe className="w-5 h-5 text-amber-600 mx-auto" />
            <div className="text-xs font-bold text-slate-900">FastAPI Routes</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Public HTTP Endpoint</div>
          </div>
        </div>
      </div>

      {/* 3-Tier Layer Details */}
      <div className="space-y-4">
        {/* Tier 1 */}
        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tier 1: Application Codebase Layer
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Python 3.11+</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 font-semibold">
                <Globe className="w-4 h-4" />
                <span>FastAPI Routes</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Traces public HTTP endpoint decorators, path parameters, and response models exposed to clients.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <Layers className="w-4 h-4" />
                <span>SQLAlchemy Models</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Inspects declarative class mappings, <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200 text-slate-900">mapped_column</code>, and cascades linking tables to Python entities.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center gap-2 text-purple-700 font-semibold">
                <FileCode className="w-4 h-4" />
                <span>Pydantic Schemas</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Analyzes request and response serialization schemas and payload contracts generated for client responses.
              </p>
            </div>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tier 2: DBscope Static AST Engine
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Core Engine</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <Terminal className="w-4 h-4" />
                <span>AST Parser</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Parses proposed DDL into abstract syntax tree operations (DROP, ADD, ALTER, RENAME) to isolate schema targets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Metadata Verifier</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Queries PostgreSQL catalogs (<code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200 text-slate-900">information_schema</code>) in read-only mode to confirm physical existence.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center gap-2 text-purple-700 font-semibold">
                <Server className="w-4 h-4" />
                <span>Blast Radius Extractor</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Traverses Python ASTs to trace how changes in table definitions propagate through fields to public HTTP response boundaries.
              </p>
            </div>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tier 3: PostgreSQL Relational Storage
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Read-Only Introspection</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            PostgreSQL relational storage serves as the authoritative source of schema definitions, constraints, nullability properties, and data types. DBscope only inspects system catalog views (<code className="font-mono bg-gray-100 px-1 rounded border border-gray-200 text-slate-900">information_schema.columns</code>, <code className="font-mono bg-gray-100 px-1 rounded border border-gray-200 text-slate-900">pg_catalog</code>) and never acquires table locks or modifies live database state.
          </p>
        </div>
      </div>
    </div>
  );
};
