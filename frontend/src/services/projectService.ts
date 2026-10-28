import { scannerService } from './scannerService';
import type { Project } from '../types';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const info = await scannerService.getActiveSourceInfo();
    const projects: Project[] = [];

    if (info && info.active && info.name) {
      projects.push({
        id: 'active-connected-repo',
        name: info.name,
        description: `Connected application source (${info.type === 'github' ? 'GitHub Repository' : 'Uploaded ZIP Archive'}). Parsed ${info.files_count ?? 0} Python modules for AST change impact analysis.`,
        database: 'PostgreSQL',
        framework: 'FastAPI',
        orm: 'SQLAlchemy',
        lastScanned: 'Active Session',
        activeMigrationCount: 1,
        status: 'active',
      });
    }

    projects.push({
      id: 'proj-sample-app',
      name: 'Built-in Reference Workspace (sample_app)',
      description: 'Hermetic test codebase containing standard SQLAlchemy User models, Pydantic schemas, and FastAPI endpoints.',
      database: 'PostgreSQL',
      framework: 'FastAPI',
      orm: 'SQLAlchemy',
      lastScanned: 'Built-in',
      activeMigrationCount: 0,
      status: info && info.active ? 'configured' : 'active',
    });

    return projects;
  },

  async getProjectById(id: string): Promise<Project | undefined> {
    const all = await this.getProjects();
    return all.find((p) => p.id === id);
  },

  async getActiveProject(): Promise<Project> {
    const all = await this.getProjects();
    return all[0];
  },
};
