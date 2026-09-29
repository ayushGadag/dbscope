import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Layers,
  FileCode,
  AlertTriangle,
  Code2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Globe,
  Database
} from 'lucide-react';
import { migrationService } from '../services/migrationService';
import type { UnifiedAnalysisResult } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const exampleSnippets = [
  {
    label: 'DROP COLUMN',
    sql: 'ALTER TABLE users DROP COLUMN email;',
    desc: 'Destructive deletion of column',
  },
  {
    label: 'ADD COLUMN',
    sql: 'ALTER TABLE users ADD COLUMN age INTEGER;',
    desc: 'New schema attribute addition',
  },
  {
    label: 'ALTER COLUMN TYPE',
    sql: 'ALTER TABLE users ALTER COLUMN age TYPE BIGINT;',
    desc: 'Data type modification',
  },
  {
    label: 'RENAME COLUMN',
    sql: 'ALTER TABLE users RENAME COLUMN email TO email_address;',
    desc: 'Column rename refactor',
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
      status: 'Verified',
      message: 'Column email confirmed in table users',
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
        description: 'FastAPI route endpoint returning UserResponse with email',
      },
    ],
    potential_impact: {
      severity: 'High',
      summary: 'Destructive column drop on users.email',
      affected_count: 3,
      updates: {
        orm_model: 'User in models.py:17',
        pydantic_schema: 'UserResponse in schemas.py:12',
        fastapi_route: 'GET /users/{id} in routes.py:12',
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
    if (!sql.trim()) return;
    setAnalyzing(true);
    migrationService.analyzeUnified(sql).then((res) => {
      setUnifiedResult(res);
      setAnalyzing(false);
    });
  };

  const migration = unifiedResult?.migration;
  const deps = unifiedResult?.application_dependencies || [];
  const impact = unifiedResult?.potential_impact;

  return (
    <div className="space-y-6">


      {/* SQL Workbench */}
      <div className="rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Editor Toolbar */}
        <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-900">
              SQL DDL Statement
            </span>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 mr-1">
              Presets:
            </span>
            {exampleSnippets.map((snippet) => (
              <button
                key={snippet.label}
                type="button"
                onClick={() => setSql(snippet.sql)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer border ${
                  sql === snippet.sql
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-100 hover:text-slate-900'
                }`}
                title={snippet.desc}
              >
                {snippet.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea Editor */}
        <div className="p-4 bg-[#fbfcfd]">
          <div className="flex font-mono text-xs">
            <div className="select-none text-slate-300 text-right pr-3 pt-2 w-7 border-r border-gray-200">
              1
            </div>
            <textarea
              rows={3}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="w-full bg-transparent text-slate-900 font-mono text-xs pl-3 py-2 focus:outline-none resize-none leading-relaxed selection:bg-slate-200 placeholder:text-slate-400"
              placeholder="ALTER TABLE users DROP COLUMN email;"
            />
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 bg-white border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Deterministic AST inspection only. No live mutations applied.
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSql('')}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyze}
              disabled={!sql.trim() || analyzing}
              isLoading={analyzing}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              {analyzing ? 'Analyzing AST...' : 'Run Impact Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {unifiedResult && migration && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                AST Trace Results
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Target: {migration.table}.{migration.column || migration.old_column}
              </span>
            </div>

            <button
              onClick={() => navigate('/graph')}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span>View in Dependency Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4-Step Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1: DDL Op */}
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                1. DDL Operation
              </div>
              <div className="text-sm font-mono font-semibold text-slate-900 mt-1">
                {migration.operation}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Target: {migration.table}
              </div>
            </div>

            {/* 2: Catalog Status */}
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                2. Catalog Verification
              </div>
              <div className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reference Verified</span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                PostgreSQL Catalog: Exists
              </div>
            </div>

            {/* 3: Blast Radius */}
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                3. Application Blast Radius
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {deps.length} Affected Artifacts
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                1 ORM • 1 Schema • 1 Route
              </div>
            </div>

            {/* 4: Risk Verdict */}
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                4. Safety Rating
              </div>
              <div className="mt-1">
                <RiskBadge level={impact?.severity === 'High' ? 'HIGH' : 'MEDIUM'} score={88} showScore />
              </div>
              <div className="text-xs text-rose-600 font-medium mt-1">
                Breaking Change Gate
              </div>
            </div>
          </div>

          {/* Breaking Change Warning if high risk */}
          {migration.message && (
            <div className="p-3.5 sm:px-4 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-rose-800">Migration Risk Notice</span>
                <p className="text-rose-700 text-xs mt-0.5 leading-relaxed">
                  {migration.message}
                </p>
              </div>
            </div>
          )}

          {/* Dependencies Table */}
          <div className="rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-900">
                  Downstream Application Dependencies
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-gray-100 text-slate-600 rounded-full border border-gray-200">
                  {deps.length} references
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 text-slate-500 text-[10px] font-medium uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-5">Component</th>
                    <th className="py-2.5 px-5">Architecture Layer</th>
                    <th className="py-2.5 px-5">File Location</th>
                    <th className="py-2.5 px-5">Binding Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deps.map((dep, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-5 font-mono font-semibold text-slate-900">
                        {dep.name}
                      </td>
                      <td className="py-3 px-5">
                        <Badge
                          variant={
                            dep.type === 'orm_model'
                              ? 'lime'
                              : dep.type === 'pydantic_schema'
                              ? 'purple'
                              : 'cyan'
                          }
                          size="xs"
                        >
                          {dep.type === 'orm_model'
                            ? 'SQLAlchemy'
                            : dep.type === 'pydantic_schema'
                            ? 'Pydantic'
                            : 'FastAPI'}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-500">
                        {dep.file}:{dep.line}
                      </td>
                      <td className="py-3 px-5 text-slate-600">
                        {dep.relationship}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Required Application Adaptations Grid */}
          {impact && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Required Application Refactorings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1: Model */}
                <div className="p-4 rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-900">SQLAlchemy Model</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Remove attribute <code className="font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-200 text-slate-900">email</code> from class <code className="font-mono text-slate-900">User</code> in <code className="font-mono text-slate-600">models.py:17</code>.
                  </p>
                </div>

                {/* 2: Schema */}
                <div className="p-4 rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-900">Pydantic Schema</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Update <code className="font-mono text-slate-900">UserResponse</code> in <code className="font-mono text-slate-600">schemas.py:12</code> to remove or set <code className="font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-200 text-slate-900">email: Optional[str] = None</code>.
                  </p>
                </div>

                {/* 3: Route */}
                <div className="p-4 rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-900">FastAPI Endpoint</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Verify handler <code className="font-mono text-slate-900">GET /users/{'{id}'}</code> in <code className="font-mono text-slate-600">routes.py:12</code> to ensure no direct dictionary access on email.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => navigate('/plan')}
                >
                  Open Step-by-Step Migration Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
