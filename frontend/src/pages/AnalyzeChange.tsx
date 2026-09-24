import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode2,
  Play,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Database,
  Layers,
  FileCode,
  Globe,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { migrationService } from '../services/migrationService';
import type { UnifiedAnalysisResult } from '../types';

const exampleSnippets = [
  {
    label: 'DROP COLUMN',
    sql: 'ALTER TABLE users DROP COLUMN email;',
  },
  {
    label: 'ADD COLUMN',
    sql: 'ALTER TABLE users ADD COLUMN age INTEGER;',
  },
  {
    label: 'ALTER COLUMN TYPE',
    sql: 'ALTER TABLE users ALTER COLUMN age TYPE BIGINT;',
  },
  {
    label: 'RENAME COLUMN',
    sql: 'ALTER TABLE users RENAME COLUMN email TO email_address;',
  },
];

export const AnalyzeChange: React.FC = () => {
  const navigate = useNavigate();
  const [sql, setSql] = useState('ALTER TABLE users DROP COLUMN email;');
  const [analyzing, setAnalyzing] = useState(false);
  const [unifiedResult, setUnifiedResult] = useState<UnifiedAnalysisResult | null>({
    migration: {
      operation: 'DROP_COLUMN',
      table: 'users',
      column: 'email',
      changed_object: 'users.email',
      status: 'Detected',
      message: 'Destructive DDL change: Column deletion removes data and affects downstream application references.',
    },
    database_verification: {
      is_live_db: false,
      table: 'users',
      table_exists: true,
      column: 'email',
      column_exists: true,
      data_type: 'VARCHAR(255)',
      status: 'Reference Verified',
      message: "Table 'users' and column 'email' exist in schema catalog.",
    },
    application_dependencies: [
      {
        name: 'User.email',
        type: 'orm_model',
        file: 'models.py',
        line: 17,
        relationship: 'Maps to users.email column',
        description: 'SQLAlchemy Column attribute defined on class User',
      },
      {
        name: 'UserResponse.email',
        type: 'pydantic_schema',
        file: 'schemas.py',
        line: 12,
        relationship: 'Serializes users.email attribute',
        description: 'Pydantic BaseModel attribute used for serialization',
      },
      {
        name: 'GET /users/{id}',
        type: 'fastapi_route',
        file: 'routes.py',
        line: 12,
        relationship: 'Declares response_model=UserResponse',
        description: 'FastAPI route handler declaring response_model=UserResponse',
      },
    ],
    potential_impact: {
      severity: 'High',
      summary: 'Destructive DROP COLUMN operation affects 3 downstream application components.',
      affected_count: 3,
      updates: {
        orm_model: 'User.email attribute must be removed from models.py.',
        pydantic_schema: 'UserResponse.email field must be removed or made Optional.',
        fastapi_route: 'GET /users/{id} response contract must be updated for API consumers.',
      },
    },
    graph: {
      changed_object: 'users.email',
      nodes: [],
      edges: [],
    },
    is_live_db: false,
  });

  const handleAnalyze = () => {
    setAnalyzing(true);
    migrationService.analyzeUnified(sql).then((res) => {
      setUnifiedResult(res);
      setAnalyzing(false);
    });
  };

  const migration = unifiedResult?.migration;
  const dbVerif = unifiedResult?.database_verification;
  const deps = unifiedResult?.application_dependencies || [];
  const impact = unifiedResult?.potential_impact;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Analyze Migration Change</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Static DDL statement inspection, database catalog verification, and application dependency trace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unifiedResult && (
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                unifiedResult.is_live_db
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/50'
                  : 'bg-blue-950/30 text-blue-300 border-blue-800/50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${unifiedResult.is_live_db ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
              <span>{unifiedResult.is_live_db ? 'Live PostgreSQL Verified' : 'Reference / Demo Mode'}</span>
            </span>
          )}
        </div>
      </div>

      {/* SQL Input Container */}
      <div className="rounded-lg p-4 bg-[#141720] border border-[#232733] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
            <span>SQL Statement</span>
          </label>
          <span className="text-[10px] font-mono text-slate-500">
            Supported: DROP, ADD, ALTER, RENAME COLUMN
          </span>
        </div>

        {/* Preset Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-mono">Presets:</span>
          {exampleSnippets.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => {
                setSql(snippet.sql);
                setUnifiedResult(null);
              }}
              className={`text-[11px] px-2 py-0.5 rounded transition font-mono border ${
                sql === snippet.sql
                  ? 'bg-[#1C2230] text-blue-400 border-[#2D364A]'
                  : 'bg-[#191D28] text-slate-400 border-[#232733] hover:text-slate-200'
              }`}
            >
              {snippet.label}
            </button>
          ))}
        </div>

        {/* Code Editor */}
        <div className="relative">
          <textarea
            rows={3}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="w-full bg-[#10131A] border border-[#232733] focus:border-blue-500/70 rounded p-3 text-xs text-slate-200 font-mono focus:outline-hidden leading-relaxed"
            placeholder="ALTER TABLE users DROP COLUMN email;"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-mono text-slate-500">
            Read-only AST & catalog analysis. SQL is never executed against PostgreSQL.
          </span>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !sql.trim()}
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Analyze Change</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {unifiedResult && migration && (
        <div className="space-y-4">
          {/* SECTION 1: Migration Analysis */}
          <div className="rounded-lg p-4 bg-[#141720] border border-[#232733] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#232733]">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  1. Migration Analysis
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191D28] text-slate-300 border border-[#2B3142]">
                {migration.operation || 'None'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
                <span className="text-[9px] text-slate-500 uppercase block">Operation</span>
                <p className="font-semibold text-slate-200 mt-0.5">{migration.operation || 'N/A'}</p>
              </div>

              <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
                <span className="text-[9px] text-slate-500 uppercase block">Table</span>
                <p className="font-semibold text-slate-200 mt-0.5">{migration.table || 'N/A'}</p>
              </div>

              <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
                <span className="text-[9px] text-slate-500 uppercase block">Column</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {migration.column || migration.old_column || 'N/A'}
                </p>
              </div>

              <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
                <span className="text-[9px] text-slate-500 uppercase block">Data Type</span>
                <p className="font-semibold text-blue-400 mt-0.5">
                  {migration.data_type || migration.new_type || migration.clause || 'VARCHAR(255)'}
                </p>
              </div>
            </div>

            {migration.message && (
              <p className="text-xs text-slate-400 font-mono bg-[#10131A] p-2.5 rounded border border-[#232733]">
                {migration.message}
              </p>
            )}
          </div>

          {/* SECTION 2: Database Verification */}
          {dbVerif && (
            <div className="rounded-lg p-4 bg-[#141720] border border-[#232733] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#232733]">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    2. Database Verification
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {dbVerif.is_live_db ? 'Live Catalog' : 'Reference Schema'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-[#191D28] border border-[#232733] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Table Status</span>
                    <span className="font-semibold text-slate-200">{dbVerif.table} table</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[11px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Exists</span>
                  </span>
                </div>

                <div className="p-3 rounded bg-[#191D28] border border-[#232733] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Column Status</span>
                    <span className="font-semibold text-slate-200">{dbVerif.column}</span>
                  </div>
                  {dbVerif.column_exists ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Exists ({dbVerif.data_type || 'VARCHAR'})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">
                      <span>New Column to Add</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Application Dependency Check */}
          <div className="rounded-lg p-4 bg-[#141720] border border-[#232733] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#232733]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  3. Application Dependency Check
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {deps.length} references detected
              </span>
            </div>

            {deps.length > 0 ? (
              <div className="space-y-2 font-mono text-xs">
                {deps.map((d, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-[#191D28] border border-[#232733] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                          d.type === 'orm_model'
                            ? 'bg-purple-950/50 text-purple-300 border border-purple-800/50'
                            : d.type === 'pydantic_schema'
                            ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                            : 'bg-rose-950/50 text-rose-300 border border-rose-800/50'
                        }`}
                      >
                        {d.type.replace('_', ' ')}
                      </span>
                      <span className="font-semibold text-slate-200">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>{d.file}:{d.line}</span>
                      <span className="text-slate-500 font-sans text-xs max-w-xs truncate">
                        {d.relationship}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded bg-[#10131B] border border-[#232733] text-xs font-mono text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Existing references to {migration.table}.{migration.column}: None found in application source.</span>
              </div>
            )}
          </div>

          {/* SECTION 4: Potential Impact / Application Updates */}
          {impact && (
            <div className="rounded-lg p-4 bg-[#141720] border border-[#232733] space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#232733]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    4. Potential Application Updates
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    impact.severity === 'High'
                      ? 'bg-rose-950/30 text-rose-300 border-rose-800/50'
                      : 'bg-blue-950/30 text-blue-300 border-blue-800/50'
                  }`}
                >
                  {impact.severity} Severity
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded bg-[#191D28] border border-[#232733] space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold text-[11px]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>SQLAlchemy Model</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {impact.updates.orm_model}
                  </p>
                </div>

                <div className="p-3 rounded bg-[#191D28] border border-[#232733] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Pydantic Schema</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {impact.updates.pydantic_schema}
                  </p>
                </div>

                <div className="p-3 rounded bg-[#191D28] border border-[#232733] space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-[11px]">
                    <Globe className="w-3.5 h-3.5" />
                    <span>FastAPI Endpoints</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {impact.updates.fastapi_route}
                  </p>
                </div>
              </div>

              {/* Direct CTA to View Dependencies Graph */}
              <div className="pt-2 flex items-center justify-between border-t border-[#232733]">
                <span className="text-xs text-slate-400 font-mono text-[11px]">
                  Target analyzed: {migration.table}.{migration.column || migration.old_column}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/graph')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition flex items-center gap-1.5"
                >
                  <span>View Dependency Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
