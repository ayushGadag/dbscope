import React, { useEffect, useState } from 'react';
import {
  FileText,
  Printer,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import type { Report } from '../types';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    reportService.getReports().then((data) => {
      setReports(data);
      if (data.length > 0) setSelectedReport(data[0]);
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenView = (report: Report) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#232733]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Impact Analysis Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Technical audit and impact assessment records for evaluated database migrations.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-3.5 py-1.5 bg-[#1A1E29] hover:bg-[#232733] text-xs font-medium text-slate-200 border border-[#2A2F3D] rounded-md transition flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>Print / Export Audit</span>
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-lg p-5 bg-[#141720] border border-[#232733] hover:border-[#2E3547] transition space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#232733]">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Report Ref: {report.id}
                </span>
                <h3 className="text-sm font-semibold text-white mt-0.5">
                  Change Impact Audit: {report.projectName}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>RISK: {report.riskLevel}</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1A1E29] text-slate-400 border border-[#232733]">
                  {report.timestamp}
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded bg-[#1A1E29] border border-[#232733]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">Target Database</span>
                <span className="font-mono font-semibold text-blue-400 text-xs mt-1 block">{report.targetDatabase}</span>
              </div>

              <div className="p-3 rounded bg-[#1A1E29] border border-[#232733]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">Proposed SQL</span>
                <span className="font-mono text-amber-300 text-xs mt-1 truncate block">{report.proposedMigration}</span>
              </div>

              <div className="p-3 rounded bg-[#1A1E29] border border-[#232733]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">Dependencies</span>
                <span className="font-medium text-white text-xs mt-1 block">{report.dependenciesCount} Traced References</span>
              </div>

              <div className="p-3 rounded bg-[#1A1E29] border border-[#232733]">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">Remediation Steps</span>
                <span className="font-medium text-emerald-400 text-xs mt-1 block">{report.planStepsCount} Tasks</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#10131B] p-3 rounded border border-[#232733]">
              {report.summary}
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => handleOpenView(report)}
                className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Audit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Report Modal */}
      {viewModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141720] border border-[#2A2F3D] rounded-lg max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#232733] mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Database Change Impact Audit Record
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {selectedReport.id} • {selectedReport.projectName}
                </span>
              </div>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
                <span className="font-semibold text-white block uppercase tracking-wider text-[10px]">
                  1. Executive Summary
                </span>
                <p className="leading-relaxed">
                  A proposed DDL migration statement <code className="text-amber-400 font-mono">{selectedReport.proposedMigration}</code> was statically evaluated by DBScope. The analysis revealed high risk of breaking downstream consumers in FastAPI endpoints due to missing model deprecation steps.
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
                <span className="font-semibold text-white block uppercase tracking-wider text-[10px]">
                  2. Architectural Trace Results
                </span>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-300">
                  <li>PostgreSQL Catalog: Table <span className="text-blue-300">users</span>, Column <span className="text-amber-300">email</span></li>
                  <li>SQLAlchemy ORM: Attribute <span className="text-purple-300">User.email</span> (models.py:17)</li>
                  <li>Pydantic Schema: Field <span className="text-emerald-300">UserResponse.email</span> (schemas.py:12)</li>
                  <li>FastAPI Route: Endpoint <span className="text-rose-300">GET /users/{'{id}'}</span> (routes.py:12)</li>
                </ul>
              </div>

              <div className="p-3.5 rounded bg-[#1A1E29] border border-[#232733] space-y-1.5">
                <span className="font-semibold text-white block uppercase tracking-wider text-[10px]">
                  3. Recommendation & Decision Gate
                </span>
                <p className="text-rose-300 font-medium leading-relaxed">
                  GATE: REVIEW REQUIRED. Do not execute this DDL in production until API contract deprecation cycles are fulfilled according to the safe migration plan.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#232733] flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Generated client-side for audit and compliance records.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded bg-[#1A1E29] hover:bg-[#232733] text-xs font-medium text-slate-200 border border-[#2A2F3D]"
                >
                  Print
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
