import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Database,
  Layers,
  FileCode,
  Globe
} from 'lucide-react';
import { impactService } from '../services/impactService';
import type { ImpactResult } from '../types';
import { RiskBadge } from '../components/ui/RiskBadge';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const ImpactAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [impactData, setImpactData] = useState<ImpactResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    impactService.getImpactAnalysis('users.email').then(setImpactData);
  }, []);

  const components = impactData?.components || [];

  const filtered = components.filter((comp) => {
    const matchesSearch =
      comp.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.relationship.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === 'all' ||
      (selectedType === 'orm' && comp.type === 'orm_model') ||
      (selectedType === 'schema' && comp.type === 'pydantic_schema') ||
      (selectedType === 'route' && comp.type === 'fastapi_route');
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Target Entity:</span>
          <span className="text-xs font-mono px-3 py-1 bg-white border border-[#e2e7e2] text-slate-900 rounded-full shadow-2xs font-semibold">
            users.email
          </span>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            ({components.length} bound code references)
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => navigate('/risk')}
        >
          Proceed to Risk Assessment
        </Button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Target Schema Object
          </span>
          <div className="text-base font-semibold font-mono text-slate-900">users.email</div>
          <div className="text-xs text-slate-500">PostgreSQL physical column (VARCHAR 255)</div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Total Bound References
          </span>
          <div className="text-base font-semibold text-slate-900">
            {components.length} Downstream Components
          </div>
          <div className="text-xs text-slate-500">SQLAlchemy, Pydantic, FastAPI</div>
        </div>

        <div className="rounded-2xl bg-white border border-[#e2e7e2] p-5 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Severity Rating
          </span>
          <div className="flex items-center gap-2">
            <RiskBadge level={components[0]?.severity ? (components[0].severity.toUpperCase() as 'HIGH') : 'HIGH'} score={88} showScore />
          </div>
          <div className="text-xs text-rose-600 font-medium">Immediate runtime failure without update</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter components, files, or bindings..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-[#e2e7e2] rounded-full focus:outline-none focus:border-[#1c4e35] focus:ring-2 focus:ring-emerald-200/50 shadow-xs"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="p-1 rounded-full bg-white border border-[#e2e7e2] flex items-center gap-1 text-xs shrink-0 shadow-xs">
          {[
            { id: 'all', label: 'All Artifacts' },
            { id: 'orm', label: 'ORM Models' },
            { id: 'schema', label: 'Schemas' },
            { id: 'route', label: 'Routes' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                selectedType === type.id
                  ? 'bg-[#1c4e35] text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#edf1ed]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Impact Matrix Table */}
      <div className="rounded-2xl bg-white border border-[#e2e7e2] shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Downstream Component Manifest
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {filtered.length} of {components.length} components shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 text-slate-500 text-[10px] font-medium uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-5">Component Identifier</th>
                <th className="py-2.5 px-5">Architectural Layer</th>
                <th className="py-2.5 px-5">File Location</th>
                <th className="py-2.5 px-5">Dependency Binding</th>
                <th className="py-2.5 px-5">Impact Severity</th>
                <th className="py-2.5 px-5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-5 font-mono font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      {item.type === 'fastapi_route' ? (
                        <Globe className="w-3.5 h-3.5 text-amber-600" />
                      ) : item.type === 'pydantic_schema' ? (
                        <FileCode className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <Database className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{item.component}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <Badge
                      variant={
                        item.type === 'orm_model'
                          ? 'lime'
                          : item.type === 'pydantic_schema'
                          ? 'purple'
                          : 'warning'
                      }
                      size="xs"
                    >
                      {item.type === 'orm_model'
                        ? 'SQLAlchemy'
                        : item.type === 'pydantic_schema'
                        ? 'Pydantic'
                        : 'FastAPI'}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 font-mono text-slate-500">
                    {item.file}:{item.line}
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    {item.relationship}
                  </td>
                  <td className="py-3 px-5">
                    <RiskBadge level={item.severity as 'HIGH'} />
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => navigate('/graph')}
                      className="text-xs font-medium text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      Trace →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
