import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { impactService } from '../services/impactService';
import type { ImpactResult } from '../types';

export const ImpactAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [impactData, setImpactData] = useState<ImpactResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    impactService.getImpactAnalysis('users.email').then(setImpactData);
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'orm_model':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191D28] text-purple-300 border border-[#2D3142]">
            SQLAlchemy Model
          </span>
        );
      case 'pydantic_schema':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191D28] text-emerald-300 border border-[#2D3142]">
            Pydantic Schema
          </span>
        );
      case 'fastapi_route':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#191D28] text-rose-300 border border-[#2D3142]">
            FastAPI Route
          </span>
        );
      default:
        return null;
    }
  };

  const filteredComponents = impactData?.components.filter((c) => {
    const matchesSearch =
      c.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.relationship.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || c.type === selectedType;

    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Impact Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identifies application code components directly referencing changed database object <code className="text-amber-300 font-mono">users.email</code>.
          </p>
        </div>

        <button
          onClick={() => navigate('/risk')}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <span>Evaluate Risk</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Change Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-lg bg-[#141720] border border-[#232733]">
          <span className="text-[10px] text-slate-500 uppercase block">
            Changed Object
          </span>
          <p className="font-semibold text-amber-300 mt-0.5">
            {impactData?.changed_object}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">PostgreSQL schema column</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141720] border border-[#232733]">
          <span className="text-[10px] text-slate-500 uppercase block">
            Affected Code References
          </span>
          <p className="font-semibold text-white mt-0.5">
            {impactData?.affectedCount} Components
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">ORM, Schema, and Route tiers</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#141720] border border-[#232733]">
          <span className="text-[10px] text-slate-500 uppercase block">
            Impact Severity
          </span>
          <p className="font-semibold text-rose-400 mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>High Severity</span>
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Breaking public API contract</span>
        </div>
      </div>

      {/* Impact Table Container */}
      <div className="rounded-lg bg-[#141720] border border-[#232733] overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-3 border-b border-[#232733] flex flex-col md:flex-row items-center justify-between gap-2.5 bg-[#11141D]">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components or files..."
              className="w-full bg-[#161922] border border-[#232733] rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto text-xs">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-[#161922] border border-[#232733] rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden font-mono"
            >
              <option value="all">All Types</option>
              <option value="orm_model">SQLAlchemy Model</option>
              <option value="pydantic_schema">Pydantic Schema</option>
              <option value="fastapi_route">FastAPI Route</option>
            </select>
          </div>
        </div>

        {/* Components Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161922] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-[#232733]">
              <tr>
                <th className="py-2.5 px-3.5">Component</th>
                <th className="py-2.5 px-3.5">Type</th>
                <th className="py-2.5 px-3.5">File</th>
                <th className="py-2.5 px-3.5">Line</th>
                <th className="py-2.5 px-3.5">Relationship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232733] font-mono text-xs">
              {filteredComponents.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#161922] transition-colors">
                  <td className="py-2.5 px-3.5 font-semibold text-slate-200">
                    {item.component}
                  </td>
                  <td className="py-2.5 px-3.5">{getTypeBadge(item.type)}</td>
                  <td className="py-2.5 px-3.5 text-blue-300">
                    {item.file}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-400">
                    {item.line}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-300 font-sans text-xs max-w-sm">
                    {item.relationship}
                  </td>
                </tr>
              ))}

              {filteredComponents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                    No components found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-[#11141D] border-t border-[#232733] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Static AST detection (No code executed)</span>
          <span>Affected downstream count: {impactData?.affectedCount || 0}</span>
        </div>
      </div>
    </div>
  );
};
