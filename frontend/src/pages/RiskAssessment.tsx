import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  FileSearch
} from 'lucide-react';
import { riskService } from '../services/riskService';
import type { RiskAssessment as RiskType } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const RiskAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState<RiskType | null>(null);

  useEffect(() => {
    riskService.getRiskAssessment('users.email').then(setRiskData);
  }, []);

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Evaluation Scope:</span>
          <span className="text-xs font-mono px-3 py-1 bg-white border border-[#e2e7e2] text-slate-900 rounded-full shadow-2xs font-semibold">
            users.email DDL Mutation
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-200 font-semibold">
            High Severity Gate
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
                <span className="text-4xl font-bold font-mono text-rose-600">
                  {riskData?.score || 88}
                </span>
                <span className="text-xs font-medium text-slate-400">/ 100</span>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-700 shadow-2xs"
                    style={{ width: `${riskData?.score || 88}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0 (Safe)</span>
                  <span>50 (Moderate)</span>
                  <span>100 (Critical)</span>
                </div>
              </div>
            </div>

            {/* Recommendation & Gate Verdict (8 cols) */}
            <div className="lg:col-span-8 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 font-mono">
                  Decision Gate Verdict: Action Required
                </span>
              </div>

              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                {riskData?.recommendation ||
                  'Destructive DROP COLUMN operation directly causes runtime attribute errors on active FastAPI route contracts. Multi-step zero-downtime deployment is required.'}
              </p>

              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Direct execution will cause HTTP 500 errors on <code className="font-mono font-semibold text-amber-900">GET /users/{'{id}'}</code>.
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
            {riskData?.factors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white border border-gray-200/80 hover:border-gray-300 transition-all flex items-start gap-2.5 text-slate-700 shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{factor}</span>
              </div>
            ))}
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
          {riskData?.evidence.map((item, idx) => (
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
                <span className="text-rose-600 font-semibold">High Severity</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
