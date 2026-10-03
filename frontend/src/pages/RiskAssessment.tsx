import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  FileSearch,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { riskService } from '../services/riskService';
import { scannerService } from '../services/scannerService';
import type { RiskAssessment as RiskType } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const RiskAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState<RiskType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const activeDb = scannerService.getActiveDbConfig();
    riskService
      .getRiskAssessment('users.email', activeDb)
      .then((data) => {
        setRiskData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const isCritical = riskData?.riskLevel === 'CRITICAL';
  const isHigh = riskData?.riskLevel === 'HIGH' || isCritical;
  const isMedium = riskData?.riskLevel === 'MEDIUM';
  const score = riskData?.rawScore ?? (riskData?.score ? (riskData.score > 10 ? riskData.score / 10 : riskData.score) : (isCritical ? 8.0 : isHigh ? 7.0 : isMedium ? 4.5 : 1.5));
  const changedObj = riskData?.changed_object || 'users.email';

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Evaluation Scope:</span>
          <span className="text-xs font-mono px-3 py-1 bg-white border border-[#e2e7e2] text-slate-900 rounded-full shadow-2xs font-semibold">
            {changedObj} DDL Mutation
          </span>
          <span
            className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
              isHigh
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isMedium
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isHigh ? 'High Severity Gate' : isMedium ? 'Moderate Severity Gate' : 'Low Severity Gate'}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => navigate('/plan')}
        >
          Generate Migration Plan
        </Button>
      </div>

      {loading && !riskData ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-[#e2e7e2] flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-xs">Evaluating risk model and downstream impact...</span>
        </div>
      ) : (
        <>
          {/* Decision Gate Card */}
          <div className="rounded-2xl bg-white border border-[#e2e7e2] shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Score column (4 cols) */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-[#f4f7f4] border border-[#e2e7e2] space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Calculated Risk Index</span>
                    <RiskBadge level={riskData?.riskLevel || 'HIGH'} />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-bold font-mono ${
                        isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {score.toFixed(1)}
                    </span>
                    <span className="text-xs font-medium text-slate-400">/ 10</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 shadow-2xs ${
                          isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, Math.min(100, (score / 10) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0.0 (Safe)</span>
                      <span>5.0 (Moderate)</span>
                      <span>10.0 (Critical)</span>
                    </div>
                  </div>
                </div>

                {/* Recommendation & Gate Verdict (8 cols) */}
                <div className="lg:col-span-8 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                        isHigh
                          ? 'text-rose-700'
                          : isMedium
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {isHigh
                        ? 'Decision Gate Verdict: Action Required'
                        : isMedium
                        ? 'Decision Gate Verdict: Review Advisory'
                        : 'Decision Gate Verdict: Safe to Deploy'}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-900 leading-relaxed">
                    {riskData?.recommendation ||
                      'Destructive schema modification alters runtime attributes on downstream application layers.'}
                  </p>

                  <div
                    className={`p-3.5 rounded-lg border text-xs flex items-center gap-3 ${
                      isHigh
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    {isHigh ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>
                      {isHigh
                        ? 'Direct uncoordinated deployment may cause runtime attribute failures on downstream API endpoints.'
                        : 'Non-breaking additive schema changes can proceed without coordinated application downtime.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contributing Risk Factors */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                Contributing Risk Factors
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                {riskData?.factors && riskData.factors.length > 0 ? (
                  riskData.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white border border-gray-200/80 hover:border-gray-300 transition-all flex items-start gap-2.5 text-slate-700 shadow-2xs"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isHigh ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      />
                      <span className="leading-relaxed">{factor}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs italic py-2">
                    No severe risk factors recorded for this target object.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Technical Evidence Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-200/80">
              <FileSearch className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Architectural Evidence Findings
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {riskData?.evidence && riskData.evidence.length > 0 ? (
                riskData.evidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-white border border-gray-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4 hover:border-gray-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <Badge variant="neutral" size="xs">
                          {item.category}
                        </Badge>
                        <span className="font-mono text-slate-400">Finding #{idx + 1}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">AST Verified</span>
                      <span className={isHigh ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                        {isHigh ? 'High Severity' : 'Verified Safe'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-6 text-slate-500 text-xs bg-white rounded-xl border border-gray-200/90">
                  No downstream architectural conflicts detected.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
