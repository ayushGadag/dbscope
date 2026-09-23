import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { riskService } from '../services/riskService';
import type { RiskAssessment as RiskType } from '../types';

export const RiskAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState<RiskType | null>(null);

  useEffect(() => {
    riskService.getRiskAssessment('users.email').then(setRiskData);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Risk Assessment</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates the severity and breaking potential of proposed schema changes on <code className="text-amber-300 font-mono">users.email</code>.
          </p>
        </div>

        <button
          onClick={() => navigate('/plan')}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>Safe Migration Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Risk Score Card */}
      <div className="rounded-lg p-5 bg-[#141720] border border-[#232733] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#232733]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#1C1824] border border-rose-900/50 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Calculated Risk
              </span>
              <div className="flex items-baseline gap-2 mt-0.5 font-mono">
                <span className="text-lg font-bold text-rose-400">
                  {riskData?.riskLevel || 'HIGH'}
                </span>
                <span className="text-xs text-slate-400">
                  (Score: {riskData?.score || 88} / 100)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-[#10131A] border border-[#232733] text-xs font-mono text-slate-300 max-w-md">
            <span className="text-[10px] uppercase text-slate-500 block mb-0.5">Recommendation</span>
            <p className="text-[11px] leading-relaxed">
              {riskData?.recommendation}
            </p>
          </div>
        </div>

        {/* Risk Factors Checklist */}
        <div>
          <h3 className="text-xs font-mono uppercase text-slate-400 mb-2.5">
            Contributing Risk Factors
          </h3>

          <div className="space-y-1.5 font-mono text-xs">
            {riskData?.factors.map((factor, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-[#191D28] border border-[#232733] flex items-start gap-2 text-slate-300"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] leading-relaxed">{factor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technical Evidence Cards */}
      <div>
        <h3 className="text-xs font-semibold text-white mb-2.5">Technical Evidence</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {riskData?.evidence.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-[#141720] border border-[#232733] space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#191D28] text-slate-400 border border-[#2B3142] uppercase">
                  {item.category}
                </span>
                <span className="text-[10px] text-slate-600">#{idx + 1}</span>
              </div>

              <h4 className="text-xs font-semibold text-white font-sans">{item.title}</h4>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-[#10131A] p-2.5 rounded border border-[#232733]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
