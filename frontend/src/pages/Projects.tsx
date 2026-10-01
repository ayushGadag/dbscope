import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Scan,
  Settings,
  Calendar,
  Search,
  ArrowRight,
  CheckCircle2,
  Plus,
  Database,
  Layers
} from 'lucide-react';
import { projectService } from '../services/projectService';
import type { Project } from '../types';
import {
  Modal,
  Input,
  Textarea,
  Button
} from '../components/ui';

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    setNotification(`Active project switched to "${project.name}"`);
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

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-3 px-4 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces by name, framework, orm..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-[#e2e7e2] rounded-full focus:outline-none focus:border-[#1c4e35] focus:ring-2 focus:ring-emerald-200/50 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Showing {filteredProjects.length} of {projects.length} workspaces
          </span>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate('/scanner')}
          >
            Connect Codebase
          </Button>
        </div>
      </div>

      {/* Workspaces List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const isActive = project.id === activeProjectId;

          return (
            <div
              key={project.id}
              className={`rounded-2xl bg-white border p-6 shadow-[0_4px_20px_-2px_rgba(18,33,25,0.04)] space-y-4 transition-all ${
                isActive
                  ? 'border-emerald-600/60 ring-2 ring-emerald-500/20 bg-[#f9faf9]'
                  : 'border-[#e2e7e2] hover:border-emerald-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${
                    isActive 
                      ? 'bg-[#1c4e35] text-white border-[#1c4e35]' 
                      : 'bg-[#f4f7f4] border-[#e2e7e2] text-emerald-800'
                  }`}>
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{project.name}</h3>
                      {isActive ? (
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          Active Context
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-gray-100 text-slate-600 border border-gray-200">
                          Configured
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">{project.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenSettings(project)}
                    className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-[#e8ede8] border border-[#e2e7e2] transition-colors cursor-pointer"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Scan className="w-3.5 h-3.5 text-slate-500" />}
                    onClick={() => handleScan(project)}
                  >
                    Scan
                  </Button>
                  <Button
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => handleOpen(project)}
                  >
                    {isActive ? 'Selected' : 'Switch Context'}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {project.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f7f4] text-[#122119] border border-[#e2e7e2] text-[11px] font-medium">
                    <Database className="w-3 h-3 text-emerald-700" />
                    PostgreSQL 16
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f7f4] text-[#122119] border border-[#e2e7e2] text-[11px] font-medium">
                    <Layers className="w-3 h-3 text-emerald-700" />
                    FastAPI + SQLAlchemy
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Last scanned: 2026-09-23 16:30 UTC</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={settingsModalOpen && !!selectedProject}
        onClose={() => setSettingsModalOpen(false)}
        title="Workspace Configuration"
        description={selectedProject ? `Settings for ${selectedProject.name}` : undefined}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSettingsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSettingsModalOpen(false);
                setNotification('Workspace settings updated successfully');
                setTimeout(() => setNotification(null), 3000);
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {selectedProject && (
          <div className="space-y-4 text-xs">
            <Input
              label="Workspace Name"
              defaultValue={selectedProject.name}
            />
            <Textarea
              label="Description"
              defaultValue={selectedProject.description}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Database Type"
                defaultValue="PostgreSQL"
                disabled
              />
              <Input
                label="Database Version"
                defaultValue="16.2"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
