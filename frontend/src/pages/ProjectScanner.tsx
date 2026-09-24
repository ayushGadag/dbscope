import React, { useState } from 'react';
import {
  Upload,
  FileArchive,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Search,
  Check,
  GitBranch,
} from 'lucide-react';
import { scannerService } from '../services/scannerService';
import type { DatabaseConfig } from '../types';

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
  });

  // Action States
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string; details: string } | null>(null);

  const [scanningDatabase, setScanningDatabase] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; tablesCount?: number; columnsCount?: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      scannerService.validateRepositoryZip(file).then((res) => {
        setSelectedFile({ name: res.filename, size: res.size });
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleUseGithub = () => {
    scannerService.validateGitHubUrl(githubUrl).then((res) => {
      if (res.success) {
        setGithubStatus(`Linked: ${res.repoName} (branch: ${res.branch})`);
      } else {
        setGithubStatus(res.message || 'Error linking repository');
      }
    });
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setConnectionResult(null);
    scannerService.testDatabaseConnection(dbConfig).then((res) => {
      setConnectionResult(res);
      setTestingConnection(false);
    });
  };

  const handleScanDatabase = () => {
    setScanningDatabase(true);
    setScanResult(null);
    scannerService.scanDatabaseSchema(dbConfig).then((res) => {
      setScanResult(res);
      setScanningDatabase(false);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Project Scanner</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure application source code input and inspect PostgreSQL schema metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Application Source Repository */}
        <div className="rounded-lg p-5 bg-[#141720] border border-[#232733] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  1. Application Source Code
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Choose One</span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Provide application source files for static AST dependency extraction. Choose either a ZIP archive or a GitHub repository URL.
            </p>

            {/* Toggle Source Method */}
            <div className="flex rounded bg-[#10131A] p-0.5 border border-[#232733] mb-4">
              <button
                type="button"
                onClick={() => setSourceType('zip')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  sourceType === 'zip'
                    ? 'bg-[#1C2230] text-blue-400 border border-[#2D364A]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Option A: Upload ZIP</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType('github')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  sourceType === 'github'
                    ? 'bg-[#1C2230] text-blue-400 border border-[#2D364A]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitBranch className="w-3 h-3" />
                <span>Option B: GitHub URL</span>
              </button>
            </div>

            {/* METHOD 1: ZIP FILE */}
            {sourceType === 'zip' && (
              <div className="space-y-3">
                {selectedFile ? (
                  <div className="p-3 rounded bg-[#191D28] border border-[#2B3142] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-[#1C2230] text-blue-400 flex items-center justify-center border border-[#2B3142]">
                        <FileArchive className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-mono font-medium text-white truncate max-w-xs">
                          {selectedFile.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500">{selectedFile.size}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                            Staged
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="cursor-pointer py-1 px-2.5 rounded bg-[#1C2230] hover:bg-[#252C3D] text-[11px] font-medium text-slate-300 border border-[#2B3142] transition flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
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
                        className="p-1 rounded bg-rose-950/30 hover:bg-rose-950/50 text-rose-400 border border-rose-900/50 transition"
                        title="Remove ZIP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border border-dashed border-[#2B3142] hover:border-slate-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition bg-[#10131A] hover:bg-[#141720]">
                    <Upload className="w-6 h-6 text-slate-500 mb-2" />
                    <span className="text-xs font-medium text-slate-300">
                      Click to Select or Drop Repository ZIP
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">
                      .zip archive containing Python source files
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

            {/* METHOD 2: GITHUB URL */}
            {sourceType === 'github' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Repository URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/example/ecommerce-demo"
                      className="flex-1 bg-[#10131A] border border-[#232733] rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleUseGithub}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition"
                    >
                      Use Repository
                    </button>
                  </div>
                </div>

                {githubStatus && (
                  <div className="p-2.5 rounded bg-[#10131A] border border-[#2B3142] text-xs text-slate-300 flex items-center gap-2 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{githubStatus}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Application Technology Section */}
          <div className="mt-5 pt-4 border-t border-[#232733]">
            <span className="text-[10px] font-mono uppercase text-slate-500 block mb-2">
              Application Architecture
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#191D28] border border-[#232733]">
                <span className="text-[10px] text-slate-500 block">Framework:</span>
                <span className="font-semibold text-slate-200">FastAPI</span>
              </div>
              <div className="p-2 rounded bg-[#191D28] border border-[#232733]">
                <span className="text-[10px] text-slate-500 block">ORM:</span>
                <span className="font-semibold text-slate-200">SQLAlchemy</span>
              </div>
              <div className="p-2 rounded bg-[#191D28] border border-[#232733]">
                <span className="text-[10px] text-slate-500 block">Schema / Validation:</span>
                <span className="font-semibold text-slate-200">Pydantic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Database Configuration (PostgreSQL ONLY) */}
        <div className="rounded-lg p-5 bg-[#141720] border border-[#232733] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  2. PostgreSQL Database
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191D28] text-blue-400 border border-[#2B3142]">
                PostgreSQL
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Read-only PostgreSQL schema inspection. Credentials are used only for the connection request and are not stored by the frontend.
            </p>

            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5">Host</label>
                  <input
                    type="text"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    className="w-full bg-[#10131A] border border-[#232733] rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5">Port</label>
                  <input
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: Number(e.target.value) })}
                    className="w-full bg-[#10131A] border border-[#232733] rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-0.5">Database Name</label>
                <input
                  type="text"
                  value={dbConfig.database}
                  onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                  className="w-full bg-[#10131A] border border-[#232733] rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5">Username</label>
                  <input
                    type="text"
                    value={dbConfig.username}
                    onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })}
                    className="w-full bg-[#10131A] border border-[#232733] rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-0.5">Password</label>
                  <input
                    type="password"
                    value={dbConfig.password || ''}
                    placeholder="Enter password"
                    onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                    className="w-full bg-[#10131A] border border-[#232733] rounded px-2.5 py-1 text-xs text-slate-200 font-mono placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Test Connection Result */}
            {connectionResult && (
              <div
                className={`mt-3 p-2.5 rounded text-xs flex items-start gap-2 border font-mono ${
                  connectionResult.success
                    ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-900/50 text-rose-300'
                }`}
              >
                {connectionResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{connectionResult.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{connectionResult.details}</p>
                </div>
              </div>
            )}

            {/* Scan Result */}
            {scanResult && (
              <div className="mt-2.5 p-2.5 rounded bg-blue-950/20 border border-blue-900/50 text-xs text-blue-300 flex items-start gap-2 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">PostgreSQL Catalog Inspected</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {scanResult.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-[#232733] flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="flex-1 py-1.5 px-3 rounded bg-[#191D28] hover:bg-[#202534] text-xs font-medium text-slate-300 border border-[#2B3142] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-blue-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleScanDatabase}
              disabled={scanningDatabase}
              className="flex-1 py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {scanningDatabase ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-3 h-3" />
                  <span>Scan Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
