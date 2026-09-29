import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Check,
  CircleDashed
} from 'lucide-react';
import { reportService } from '../services/reportService';
import type { PlanStep } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const MigrationPlan: React.FC = () => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<PlanStep[]>([]);

  useEffect(() => {
    reportService.getMigrationPlan('users.email').then((data) => {
      setSteps(data.steps);
    });
  }, []);

  const toggleStep = (stepId: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s))
    );
  };

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Rollout Target:</span>
          <span className="text-xs font-mono px-3 py-1 bg-white border border-[#e2e7e2] text-slate-900 rounded-full shadow-2xs font-semibold">
            users.email
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200 font-semibold">
            4-Phase Safe Deployment
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => navigate('/reports')}
        >
          View Audit Records
        </Button>
      </div>

      {/* Advisory Callout */}
      <div className="p-3.5 sm:px-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold block text-emerald-800">Advisory Static Guidance</span>
          <p className="text-emerald-700 leading-relaxed text-[11px]">
            DBscope performs deterministic static AST inspection only and never executes live DDL against your production databases. Coordinate these phased changes through your deployment pipelines.
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono block">
              Rollout Readiness Status
            </span>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">
              {completedCount} of {steps.length} Rollout Phases Confirmed
            </div>
          </div>
          <span className="text-sm font-bold font-mono text-slate-900">{progressPercent}%</span>
        </div>

        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-slate-900 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist List */}
      <div className="rounded-xl bg-white border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] divide-y divide-gray-100 overflow-hidden">
        {steps.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleStep(item.id)}
            className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer select-none ${
              item.completed ? 'bg-gray-50/60' : 'hover:bg-gray-50/70'
            }`}
          >
            {/* Custom Checkbox */}
            <div className="mt-0.5 shrink-0">
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  item.completed
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                    : 'border-gray-300 bg-white hover:border-slate-500'
                }`}
              >
                {item.completed ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <CircleDashed className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-slate-700 border border-gray-200">
                    Phase {item.id}
                  </span>
                  <h3
                    className={`text-xs font-semibold ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>

                <Badge variant="neutral" size="xs">
                  {item.role || 'Engineering'}
                </Badge>
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  item.completed ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
