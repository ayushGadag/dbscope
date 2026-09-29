import React, { useEffect, useState } from 'react';
import { Printer, ArrowRight } from 'lucide-react';
import { reportService } from '../services/reportService';
import type { Report } from '../types';
import { Modal } from '../components/ui';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Button } from '../components/ui/Button';

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
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Audit Repository:</span>
          <span className="text-xs font-mono px-3 py-1 bg-white border border-[#e2e7e2] text-slate-900 rounded-full shadow-2xs font-semibold">
            {reports.length} Records Verified
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            SOC-2 Compliance Telemetry
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={handlePrint}
          >
            Export / Print
          </Button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="rounded-2xl bg-white border border-[#e2e7e2] p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-4 hover:border-emerald-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold text-slate-900">{report.projectName}</span>
                <span className="text-[11px] font-mono text-slate-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {report.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge level={report.riskLevel as 'HIGH' | 'MEDIUM' | 'LOW'} />
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date(report.timestamp).toISOString().replace('T', ' ').slice(0, 16)} UTC
                </span>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Database</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{report.targetDatabase}</span>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Target DDL</span>
                <span className="font-mono text-slate-900 font-semibold truncate block mt-0.5">
                  {report.proposedMigration}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Lineage Depth</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{report.dependenciesCount} References</span>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Remediation</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{report.planStepsCount || 9} Phased Tasks</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {report.summary}
            </p>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Engine: DBscope AST v2.1
              </span>
              <button
                onClick={() => handleOpenView(report)}
                className="text-xs font-medium text-slate-900 hover:text-blue-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>View Full Record</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Record Modal */}
      <Modal
        isOpen={viewModalOpen && !!selectedReport}
        onClose={() => setViewModalOpen(false)}
        title="Audit Record Detail"
        description={selectedReport ? `${selectedReport.id} • ${selectedReport.projectName}` : undefined}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setViewModalOpen(false)}
            >
              Close
            </Button>
          </>
        }
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                Executive Finding
              </span>
              <p className="text-slate-800 leading-relaxed">
                DDL statement <code className="font-mono bg-white px-1.5 py-0.5 border border-gray-200 rounded text-slate-900">{selectedReport.proposedMigration}</code> evaluated against active FastAPI routes and SQLAlchemy models. Confirmed breaking change without client deprecation.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                Lineage Chain Trace
              </span>
              <ul className="space-y-2 font-mono text-[11px] text-slate-700 pl-3 border-l-2 border-slate-300">
                <li>• PostgreSQL: Column <span className="font-semibold text-slate-900">users.email</span></li>
                <li>• SQLAlchemy: <span className="font-semibold text-slate-900">User.email</span> (models.py:17)</li>
                <li>• Pydantic: <span className="font-semibold text-slate-900">UserResponse.email</span> (schemas.py:12)</li>
                <li>• FastAPI: <span className="font-semibold text-slate-900">GET /users/{'{id}'}</span> (routes.py:12)</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <span className="font-semibold block">Policy Verdict: REJECTED FOR DIRECT RUN</span>
              <p className="text-[11px] mt-0.5 text-rose-800">
                Engineering policy requires zero-downtime deprecation sequencing before dropping columns with active client references.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
