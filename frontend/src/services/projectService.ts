import { mockProjects } from '../mock/projects';
import type { Project } from '../types';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockProjects];
  },

  async getProjectById(id: string): Promise<Project | undefined> {
    await new Promise((r) => setTimeout(r, 100));
    return mockProjects.find((p) => p.id === id);
  },

  async getActiveProject(): Promise<Project> {
    await new Promise((r) => setTimeout(r, 100));
    return mockProjects[0];
  },
};
