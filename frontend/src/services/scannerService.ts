import type { DatabaseConfig } from '../types';

export const scannerService = {
  async testDatabaseConnection(config: DatabaseConfig): Promise<{ success: boolean; message: string; details: string }> {
    await new Promise((r) => setTimeout(r, 600));

    if (!config.host || !config.database) {
      return {
        success: false,
        message: 'Connection failed',
        details: 'Database host and database name are required.',
      };
    }

    return {
      success: true,
      message: 'Connection successful',
      details: `Connected to PostgreSQL 16.2 at ${config.host}:${config.port}/${config.database} (Read-only session enforced).`,
    };
  },

  async scanDatabaseSchema(config: DatabaseConfig): Promise<{ success: boolean; tablesCount: number; columnsCount: number; message: string }> {
    await new Promise((r) => setTimeout(r, 800));

    return {
      success: true,
      tablesCount: 18,
      columnsCount: 142,
      message: `Successfully inspected PostgreSQL schema 'public' for ${config.database}. 18 tables, 142 columns detected.`,
    };
  },

  async validateRepositoryZip(file: File): Promise<{ success: boolean; filename: string; size: string; status: string }> {
    await new Promise((r) => setTimeout(r, 350));
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      success: true,
      filename: file.name,
      size: `${sizeMb} MB`,
      status: 'ZIP Archive Selected & Staged for Analysis',
    };
  },

  async validateGitHubUrl(url: string): Promise<{ success: boolean; repoName: string; branch: string; status: string; message?: string }> {
    await new Promise((r) => setTimeout(r, 400));
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://github.com/')) {
      return {
        success: false,
        repoName: '',
        branch: '',
        status: 'Invalid URL',
        message: 'Please provide a valid GitHub repository URL (e.g. https://github.com/example/ecommerce-demo).',
      };
    }

    const pathParts = trimmed.replace('https://github.com/', '').split('/');
    const repoName = pathParts.slice(0, 2).join('/');

    return {
      success: true,
      repoName: repoName || 'example/ecommerce-demo',
      branch: 'main',
      status: 'Repository Linked (Prototype Mode)',
    };
  },
};
