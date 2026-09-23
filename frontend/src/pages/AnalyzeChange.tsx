import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode2,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { migrationService } from '../services/migrationService';
import type { MigrationAnalysis } from '../types';

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
  const [analysisResult, setAnalysisResult] = useState<MigrationAnalysis | null>({
    operation: 'DROP_COLUMN',
    table: 'users',
    column: 'email',
    changed_object: 'users.email',
    status: 'Detected',
    message: 'Destructive DDL change: Column deletion removes data and affects downstream application references.',
  });

  const handleAnalyze = () => {
    setAnalyzing(true);
    migrationService.analyzeMigration(sql).then((res) => {
      setAnalysisResult(res);
      setAnalyzing(false);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Analyze Migration Change</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Static DDL migration statement analysis.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#141720] text-slate-400 border border-[#232733]">
          Static Parser
        </span>
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
                setAnalysisResult(null);
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
            Static analysis only. SQL is never executed against PostgreSQL.
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
      {analysisResult && (
        <div className="rounded-lg p-4 bg-[#141720] border border-[#232733] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232733]">
            <div className="flex items-center gap-2">
              {analysisResult.status === 'Detected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <h3 className="text-xs font-semibold text-white">Migration Analysis Result</h3>
            </div>

            {analysisResult.operation && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191D28] text-slate-300 border border-[#2B3142]">
                {analysisResult.operation}
              </span>
            )}
          </div>

          {/* Structured Properties Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
              <span className="text-[9px] text-slate-500 uppercase block">Operation</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {analysisResult.operation || 'None'}
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
              <span className="text-[9px] text-slate-500 uppercase block">Table</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {analysisResult.table || 'N/A'}
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
              <span className="text-[9px] text-slate-500 uppercase block">Column</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {analysisResult.column || analysisResult.old_column || 'N/A'}
              </p>
            </div>

            <div className="p-2.5 rounded bg-[#191D28] border border-[#232733]">
              <span className="text-[9px] text-slate-500 uppercase block">Object</span>
              <p className="font-semibold text-blue-400 mt-0.5">
                {analysisResult.changed_object || 'N/A'}
              </p>
            </div>
          </div>

          {analysisResult.message && (
            <p className="text-xs text-slate-400 font-mono bg-[#10131A] p-2.5 rounded border border-[#232733]">
              {analysisResult.message}
            </p>
          )}

          {/* Direct CTA to View Dependencies */}
          {analysisResult.status === 'Detected' && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono text-[11px]">
                Detected object: {analysisResult.changed_object}
              </span>
              <button
                type="button"
                onClick={() => navigate('/graph')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition flex items-center gap-1.5"
              >
                <span>View Dependencies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
