import React, { useState, useRef } from 'react';
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
  Database,
  RefreshCw,
  Network,
  ShieldAlert,
} from 'lucide-react';
import { migrationService } from '../services/migrationService';
import { scannerService } from '../services/scannerService';
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const [sql, setSql] = useState('ALTER TABLE users DROP COLUMN email;');
  const [analyzing, setAnalyzing] = useState(false);
  const [unifiedResult, setUnifiedResult] = useState<UnifiedAnalysisResult | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleAnalyze = (targetSql: string = sql, shouldScroll: boolean = false) => {
    const trimmed = targetSql.trim();
    if (!trimmed) {
      setErrorNotice('Please enter a valid SQL statement to analyze.');
      return;
    }

    setErrorNotice(null);
    setAnalyzing(true);
    const activeDb = scannerService.getActiveDbConfig();
    const startTime = Date.now();

    migrationService
      .analyzeUnified(trimmed, activeDb)
      .then((res) => {
        // Enforce 350ms minimum visual feedback so user visibly perceives execution
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 350 - elapsed);
        setTimeout(() => {
          if (res.migration.status === 'Unsupported' || !res.migration.operation) {
            setErrorNotice(
              res.migration.message ||
                'Unsupported migration statement. DBScope prototype supports: ALTER TABLE <table> DROP / ADD / ALTER / RENAME COLUMN.'
            );
          } else {
            setErrorNotice(null);
          }
          setUnifiedResult(res);
          setLastAnalyzedAt(new Date().toLocaleTimeString());
          setAnalyzing(false);

          if (shouldScroll) {
            setTimeout(() => {
              resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          }
        }, delay);
      })
      .catch((err) => {
        setAnalyzing(false);
        setErrorNotice(err instanceof Error ? err.message : 'Error executing change impact analysis.');
      });
  };

  // Note: We do NOT auto-run on mount or preset selection.
  // Analysis is triggered ONLY when the user clicks 'Run Impact Analysis'.

  const migration = unifiedResult?.migration;
  const dbVerif = unifiedResult?.database_verification;
  const deps = unifiedResult?.application_dependencies || [];
  const impact = unifiedResult?.potential_impact;

  const isHighRisk = impact?.severity === 'High';
  const isMediumRisk = impact?.severity === 'Medium';
  const riskLevel = isHighRisk ? 'HIGH' : isMediumRisk ? 'MEDIUM' : 'LOW';
  const riskScore = isHighRisk ? 8.0 : isMediumRisk ? 4.5 : 1.5;

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
                onClick={() => {
                  setSql(snippet.sql);
                  setErrorNotice(null);
                  // Staged for analysis — requires clicking 'Run Impact Analysis'
                }}
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
              onClick={() => {
                setSql('');
                setUnifiedResult(null);
                setLastAnalyzedAt(null);
                setErrorNotice(null);
              }}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAnalyze(sql, true)}
              disabled={!sql.trim() || analyzing}
              isLoading={analyzing}
              leftIcon={analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            >
              {analyzing ? 'Analyzing AST...' : 'Run Impact Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorNotice && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-800 block">Analysis Notice</span>
            <p className="text-amber-700 leading-relaxed">{errorNotice}</p>
          </div>
        </div>
      )}

      {/* Execution Confirmation Strip */}
      {lastAnalyzedAt && unifiedResult && migration?.operation && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold">Analysis complete at {lastAnalyzedAt}</span>
              <span className="text-emerald-700 ml-1.5">
                • Target: <span className="font-mono font-semibold">{migration.table}.{migration.column || migration.old_column || ''}</span>
                {' '}({deps.length} downstream references found)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Network className="w-3.5 h-3.5 text-slate-600" />}
              onClick={() => navigate('/graph')}
              className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            >
              View Graph
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Layers className="w-3.5 h-3.5 text-slate-600" />}
              onClick={() => navigate('/impact')}
              className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            >
              Impact Matrix
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-slate-600" />}
              onClick={() => navigate('/risk')}
              className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            >
              Risk Score
            </Button>
          </div>
        </div>
      )}

      {/* Loading Overlay State */}
      {analyzing && (
        <div className="p-8 rounded-xl bg-white border border-[#e2e7e2] text-center space-y-3 shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
          <div className="text-xs font-semibold text-slate-900">Running Unified AST Analysis...</div>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Extracting affected SQLAlchemy models, Pydantic schemas, and FastAPI route handlers from source codebase.
          </p>
        </div>
      )}

      {/* Ready State (Before User Runs Analysis) */}
      {!unifiedResult && !analyzing && !errorNotice && (
        <div className="p-10 rounded-2xl bg-white border border-[#e2e7e2] text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Ready for Database Change Impact Analysis
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Select an operation preset above or write a custom DDL statement, then click <strong className="text-emerald-700 font-semibold">"Run Impact Analysis"</strong> to evaluate downstream dependencies across SQLAlchemy ORM models, Pydantic schemas, and FastAPI routes.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-500 font-mono flex-wrap">
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-slate-600 border border-gray-200">DROP COLUMN</span>
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-slate-600 border border-gray-200">ADD COLUMN</span>
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-slate-600 border border-gray-200">ALTER COLUMN TYPE</span>
            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-slate-600 border border-gray-200">RENAME COLUMN</span>
          </div>
        </div>
      )}

      {/* Analysis Results Container */}
      {unifiedResult && migration && !analyzing && (
        <div ref={resultsRef} className="space-y-6 pt-2">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                AST Trace Results
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Target: {migration.table}.{migration.column || migration.old_column || ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="cyan" size="xs">
                {dbVerif?.is_live_db ? 'Live PostgreSQL Catalog' : 'Reference Catalog'}
              </Badge>
              <Badge variant="lime" size="xs">
                AST Inspected
              </Badge>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1: DDL Type */}
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                1. DDL Classification
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                {migration.operation || 'UNKNOWN'}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                Target: {migration.table}.{migration.column || migration.old_column || ''}
              </div>
            </div>

            {/* 2: Database Catalog Verification */}
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                2. Live Schema Catalog
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{dbVerif?.status || (dbVerif?.table_exists ? 'Verified' : 'Catalog Synced')}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {dbVerif?.is_live_db ? 'Live PostgreSQL Catalog' : 'Catalog Verified'}
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
                {deps.filter((d) => d.type === 'orm_model').length} ORM •{' '}
                {deps.filter((d) => d.type === 'pydantic_schema').length} Schema •{' '}
                {deps.filter((d) => d.type === 'fastapi_route').length} Route
              </div>
            </div>

            {/* 4: Risk Verdict */}
            <div className="rounded-xl bg-white border border-gray-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                4. Safety Rating
              </div>
              <div className="mt-1">
                <RiskBadge level={riskLevel} score={riskScore} showScore />
              </div>
              <div
                className={`text-xs font-medium mt-1 ${
                  isHighRisk
                    ? 'text-rose-600'
                    : isMediumRisk
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {isHighRisk ? 'Breaking Change Gate' : isMediumRisk ? 'Advisory Review Gate' : 'Safe Migration Gate'}
              </div>
            </div>
          </div>

          {/* Migration Message Warning or Info */}
          {migration.message && (
            <div
              className={`p-3.5 sm:px-4 rounded-xl border flex items-start gap-3 text-xs ${
                isHighRisk
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
              }`}
            >
              {isHighRisk ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className={`font-semibold block ${isHighRisk ? 'text-rose-800' : 'text-blue-800'}`}>
                  {isHighRisk ? 'Migration Risk Notice' : 'Migration Operation Notice'}
                </span>
                <p className={`text-xs mt-0.5 leading-relaxed ${isHighRisk ? 'text-rose-700' : 'text-blue-700'}`}>
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
                  {deps.length > 0 ? (
                    deps.map((dep, idx) => (
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
                          {dep.relationship || dep.description || 'Code reference binding'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 px-5 text-center text-slate-500 italic">
                        No downstream code dependencies directly affected by this migration.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Required Application Adaptations Grid */}
          {impact && impact.updates && (
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
                  <p className="text-xs text-slate-600 leading-relaxed font-mono">
                    {impact.updates.orm_model || 'No model updates required.'}
                  </p>
                </div>

                {/* 2: Schema */}
                <div className="p-4 rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-900">Pydantic Schema</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono">
                    {impact.updates.pydantic_schema || 'No schema updates required.'}
                  </p>
                </div>

                {/* 3: Route */}
                <div className="p-4 rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-900">FastAPI Endpoint</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono">
                    {impact.updates.fastapi_route || 'No endpoint route contract updates required.'}
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
