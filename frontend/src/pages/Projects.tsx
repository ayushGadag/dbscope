import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ExternalLink,
  Scan,
  Settings,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import type { Project } from '../types';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-ecommerce-demo');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    projectService.getProjects().then((data) => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0]);
    });
  }, []);

  const handleOpen = (project: Project) => {
    setActiveProjectId(project.id);
    setNotification(`Switched active project to "${project.name}"`);
    setTimeout(() => setNotification(null), 3000);
    navigate('/');
  };

  const handleScan = (project: Project) => {
    setActiveProjectId(project.id);
    navigate('/scanner');
  };

  const handleOpenSettings = (project: Project) => {
    setSelectedProject(project);
    setSettingsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Projects</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configured application repositories and target database connections.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-[#141720] px-2.5 py-1 rounded border border-[#232733]">
          {projects.length} Registered Project{projects.length > 1 ? 's' : ''}
        </span>
      </div>

      {notification && (
        <div className="p-2.5 rounded bg-[#192233] border border-blue-900/50 text-blue-300 text-xs flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const isActive = proj.id === activeProjectId;

          return (
            <div
              key={proj.id}
              className={`rounded-lg p-4 bg-[#141720] border transition-colors flex flex-col justify-between ${
                isActive
                  ? 'border-blue-500/50'
                  : 'border-[#232733] hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-[#191D28] border border-[#2B3142] flex items-center justify-center text-slate-400">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{proj.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500">ID: {proj.id}</span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#191D28] text-slate-500">
                      Configured
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
                  {proj.description}
                </p>

                {/* Technology Info */}
                <div className="space-y-1 mb-4 text-xs font-mono">
                  <div className="flex items-center justify-between py-1 px-2 rounded bg-[#191D28] border border-[#232733]">
                    <span className="text-slate-500 text-[11px]">Database:</span>
                    <span className="text-slate-200">{proj.database}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2 rounded bg-[#191D28] border border-[#232733]">
                    <span className="text-slate-500 text-[11px]">Framework:</span>
                    <span className="text-slate-200">{proj.framework}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 px-2 rounded bg-[#191D28] border border-[#232733]">
                    <span className="text-slate-500 text-[11px]">ORM:</span>
                    <span className="text-slate-200">{proj.orm}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>Last Scanned: {proj.lastScanned || 'Never'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#232733] flex items-center gap-2">
                <button
                  onClick={() => handleOpen(proj)}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-[#191D28] hover:bg-[#202534] text-slate-300 border border-[#2B3142]'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>

                <button
                  onClick={() => handleScan(proj)}
                  className="py-1.5 px-3 rounded bg-[#191D28] hover:bg-[#202534] text-xs font-medium text-slate-300 border border-[#2B3142] transition flex items-center gap-1"
                >
                  <Scan className="w-3.5 h-3.5 text-blue-400" />
                  <span>Scan</span>
                </button>

                <button
                  onClick={() => handleOpenSettings(proj)}
                  className="p-1.5 rounded bg-[#191D28] hover:bg-[#202534] text-slate-400 hover:text-slate-200 border border-[#2B3142] transition"
                  title="Project Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings Modal */}
      {settingsModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141720] border border-[#232733] rounded-lg max-w-md w-full p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#232733] mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">
                  Settings: {selectedProject.name}
                </h3>
              </div>
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Project Name</label>
                <input
                  type="text"
                  readOnly
                  value={selectedProject.name}
                  className="w-full bg-[#191D28] border border-[#232733] rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Database</label>
                <input
                  type="text"
                  readOnly
                  value="PostgreSQL (Schema: public)"
                  className="w-full bg-[#191D28] border border-[#232733] rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Framework</label>
                  <input
                    type="text"
                    readOnly
                    value="FastAPI"
                    className="w-full bg-[#191D28] border border-[#232733] rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">ORM</label>
                  <input
                    type="text"
                    readOnly
                    value="SQLAlchemy"
                    className="w-full bg-[#191D28] border border-[#232733] rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  readOnly
                  value={selectedProject.description}
                  className="w-full bg-[#191D28] border border-[#232733] rounded px-2.5 py-1.5 text-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#232733] flex items-center justify-end">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-3.5 py-1.5 rounded bg-[#191D28] hover:bg-[#202534] text-slate-200 border border-[#2B3142] text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
