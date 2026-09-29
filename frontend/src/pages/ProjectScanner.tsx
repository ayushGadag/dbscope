import React, { useState } from 'react';
import {
  Upload,
  FileArchive,
  CheckCircle2,
  RefreshCw,
  Trash2,
  GitBranch,
  Lock,
  ArrowRight,
  ShieldAlert,
  Scan
} from 'lucide-react';
import { scannerService } from '../services/scannerService';
import type { DatabaseConfig } from '../types';
import { Input, Button } from '../components/ui';

export const ProjectScanner: React.FC = () => {
  // Source Method: 'zip' or 'github'
  const [sourceType, setSourceType] = useState<'zip' | 'github'>('zip');

  // ZIP Method State
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string } | null>({
    name: 'ecommerce-backend-v2.zip',
    size: '4.85 MB',
  });

  // GitHub Method State
  const [githubUrl, setGithubUrl] = useState('https://github.com/example/ecommerce-demo');
  const [githubStatus, setGithubStatus] = useState<string | null>(null);

  // Database Config State
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    type: 'PostgreSQL',
    host: 'localhost',
    port: 5432,
    database: 'ecommerce_prod',
    username: 'postgres',
    password: '',
    ssl: true,
  });

  // Action States
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    details: string;
  } | null>(null);

  const [scanningDatabase, setScanningDatabase] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    tablesCount?: number;
    columnsCount?: number;
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setSelectedFile({
        name: file.name,
        size: `${sizeMB} MB`,
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUseGithub = () => {
    if (!githubUrl.trim()) return;
    setGithubStatus('Cloning repository AST trees into workspace...');
    setTimeout(() => {
      setGithubStatus('Repository parsed: Found 8 models, 14 schemas, 22 endpoints');
    }, 1500);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await scannerService.testDatabaseConnection(dbConfig);
      setConnectionResult(res);
    } catch {
      setConnectionResult({
        success: false,
        message: 'Connection failed',
        details: 'Could not connect to PostgreSQL instance at localhost:5432',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleScanCatalog = async () => {
    setScanningDatabase(true);
    setScanResult(null);
    try {
      const res = await scannerService.scanDatabaseSchema(dbConfig);
      setScanResult(res);
    } catch {
      setScanResult({
        success: false,
        message: 'Schema introspection failed. Check database credentials.',
      });
    } finally {
      setScanningDatabase(false);
    }
  };

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Step 1: Codebase Ingestion Card */}
        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-6 sm:p-7 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Application Codebase Source
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Python / AST</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Upload repository files or connect a GitHub repository to extract SQLAlchemy ORM models, Pydantic schemas, and FastAPI route handlers.
          </p>

          {/* Toggle Tab */}
          <div className="p-1 rounded-lg bg-gray-100 border border-gray-200/60 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setSourceType('zip')}
              className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sourceType === 'zip'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ZIP Archive</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('github')}
              className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                sourceType === 'github'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub URL</span>
            </button>
          </div>

          {/* Option A: ZIP Upload */}
          {sourceType === 'zip' && (
            <div className="space-y-3">
              {selectedFile ? (
                <div className="p-3.5 border border-gray-200 bg-gray-50/50 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                      <FileArchive className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {selectedFile.name}
                      </p>
                      <span className="text-[11px] font-mono text-slate-400">
                        {selectedFile.size}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-2xs transition-colors">
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      <span>Replace</span>
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleRemoveFile}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border border-dashed border-gray-300 hover:border-slate-500 bg-gray-50/50 hover:bg-gray-50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center">
                  <Upload className="w-7 h-7 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-800">
                    Upload project ZIP archive
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Drag & drop or browse for repository archive (.zip)
                  </span>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Option B: GitHub */}
          {sourceType === 'github' && (
            <div className="space-y-3">
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/organization/repository"
                mono
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleUseGithub}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Connect Repository
              </Button>

              {githubStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-mono text-[11px]">{githubStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* Architectural Frameworks Detected */}
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
              Detected Architectural Frameworks
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] text-slate-400 block">API Framework</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">FastAPI</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] text-slate-400 block">ORM Layer</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">SQLAlchemy</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] text-slate-400 block">Schemas</span>
                <span className="text-xs font-semibold text-slate-800 mt-0.5 block">Pydantic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Database Connection Card */}
        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-6 sm:p-7 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                PostgreSQL Catalog Connection
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Port: 5432</span>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900">
            <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Read-only catalog inspection for <code className="font-mono bg-white px-1 rounded border border-blue-200 text-blue-900">information_schema</code>. Credentials remain local.
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Host"
                  value={dbConfig.host}
                  onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                  mono
                />
              </div>
              <div>
                <Input
                  label="Port"
                  type="number"
                  value={dbConfig.port}
                  onChange={(e) => setDbConfig({ ...dbConfig, port: parseInt(e.target.value) || 5432 })}
                  mono
                />
              </div>
            </div>

            <Input
              label="Database Name"
              value={dbConfig.database}
              onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
              mono
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Username"
                value={dbConfig.username}
                onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                mono
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={dbConfig.password}
                onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                mono
              />
            </div>

            {/* Test Connection Result */}
            {connectionResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                  connectionResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {connectionResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">{connectionResult.message}</span>
                  <span className="text-[11px] opacity-80 font-mono block mt-0.5">
                    {connectionResult.details}
                  </span>
                </div>
              </div>
            )}

            {/* Scan Catalog Result */}
            {scanResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                  scanResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">{scanResult.message}</span>
                  {scanResult.tablesCount !== undefined && (
                    <span className="text-[11px] opacity-90 font-mono block mt-0.5">
                      Introspected {scanResult.tablesCount} tables and {scanResult.columnsCount} columns.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                disabled={testingConnection}
                isLoading={testingConnection}
                className="flex-1"
              >
                Test Connection
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleScanCatalog}
                disabled={scanningDatabase}
                isLoading={scanningDatabase}
                leftIcon={<Scan className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Scan Catalog
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
