import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import type { PlanStep } from '../types';

export const MigrationPlan: React.FC = () => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<PlanStep[]>([]);

  useEffect(() => {
    reportService.getMigrationPlan('users.email').then((data) => {
      setSteps(data.steps);
    });
  }, []);

  const toggleStep = (id: number) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, completed: !step.completed } : step
      )
    );
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / (steps.length || 1)) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-400" />
            <span>Safe Migration Plan</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Architectural coordination checklist for deprecating <code className="text-amber-300 font-mono">users.email</code> without breaking downstream consumers.
          </p>
        </div>

        <button
          onClick={() => navigate('/reports')}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>View Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3 rounded-lg bg-[#141720] border border-[#232733] flex items-start gap-2.5 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-slate-200 block mb-0.5">Static Analysis Recommendation Only</span>
          <p className="text-slate-400 leading-normal text-[11px]">
            DBScope never executes SQL migrations. Complete these preparation steps in your version control repository before running the migration through your deployment pipeline.
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="rounded-lg p-3.5 bg-[#141720] border border-[#232733] flex items-center justify-between font-mono text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block">
            Readiness Progress
          </span>
          <p className="text-xs font-semibold text-slate-200 mt-0.5">
            {completedCount} of {steps.length} Preparation Steps Checked
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36 bg-[#10131A] rounded h-1.5 overflow-hidden border border-[#232733]">
            <div
              className="bg-blue-500 h-1.5 rounded transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-xs text-blue-400 font-bold w-10 text-right">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* 9 Recommended Steps Checklist */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => toggleStep(step.id)}
            className={`p-3 rounded-lg border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
              step.completed
                ? 'bg-[#121620] border-[#2A3347]'
                : 'bg-[#141720] border-[#232733] hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 transition ${
                  step.completed
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-600 text-transparent hover:border-blue-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-blue-400">
                    Step {step.id}
                  </span>
                  <span className="text-slate-600">•</span>
                  <h4
                    className={`text-xs font-semibold transition ${
                      step.completed ? 'text-slate-400 line-through' : 'text-slate-200'
                    }`}
                  >
                    {step.title}
                  </h4>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl font-mono">
                  {step.description}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10131A] text-slate-400 border border-[#232733] whitespace-nowrap">
              {step.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
