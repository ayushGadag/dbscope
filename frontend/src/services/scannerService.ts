import { requestJson } from './api';
import type { DatabaseConfig } from '../types';

interface TestConnectionResult {
  success: boolean;
  message: string;
  details: string;
}

interface ScanDatabaseResult {
  success: boolean;
  tablesCount: number;
  columnsCount: number;
  message: string;
}

interface ZipUploadResult {
  success: boolean;
  filename: string;
  size: string;
  status: string;
  message?: string;
}

interface GitHubScanResult {
  success: boolean;
  repoName: string;
  branch: string;
  status: string;
  message?: string;
}

const DEFAULT_DB_CONFIG: DatabaseConfig = {
  type: 'PostgreSQL',
  host: 'localhost',
  port: 5432,
  database: 'fastapi_demo',
  username: 'postgres',
  password: 'password',
};

let _sessionDbConfig: DatabaseConfig = { ...DEFAULT_DB_CONFIG };

const DB_CONFIG_KEY = 'dbscope_active_db_config';
const SOURCE_KEY = 'dbscope_active_source';

export const scannerService = {
  /**
   * Get current active database configuration, persisting in session memory.
   * Security: Database passwords are never retrieved from or stored in localStorage.
   */
  getActiveDbConfig(): DatabaseConfig {
    if (_sessionDbConfig.host || _sessionDbConfig.database) {
      return { ..._sessionDbConfig };
    }
    try {
      const stored = localStorage.getItem(DB_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          type: 'PostgreSQL',
          host: parsed.host || '',
          port: parsed.port || 5432,
          database: parsed.database || '',
          username: parsed.username || '',
          password: _sessionDbConfig.password || '',
        };
      }
    } catch {
      // localStorage unavailable
    }
    return { ...DEFAULT_DB_CONFIG };
  },

  /**
   * Save active database configuration for the current session.
   * Security: The database password is kept strictly in memory for connection requests
   * and is NEVER written to localStorage.
   */
  saveActiveDbConfig(config: DatabaseConfig): void {
    _sessionDbConfig = { ...config };
    try {
      const { password: _, ...safeConfig } = config;
      localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(safeConfig));
    } catch {
      // localStorage unavailable
    }
  },

  /**
   * Get current active application source archive, persisting between pages.
   */
  getActiveSource(): { name: string; size: string } | null {
    try {
      const stored = localStorage.getItem(SOURCE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // localStorage unavailable
    }
    return null;
  },

  /**
   * Save active application source archive info.
   */
  saveActiveSource(source: { name: string; size: string } | null): void {
    try {
      if (source) {
        localStorage.setItem(SOURCE_KEY, JSON.stringify(source));
      } else {
        localStorage.removeItem(SOURCE_KEY);
      }
    } catch {
      // localStorage unavailable
    }
  },

  /**
   * Test PostgreSQL connection in strict read-only mode.
   * Calls backend POST /api/metadata/test-connection with clean fallback if offline.
   */
  async testDatabaseConnection(config: DatabaseConfig): Promise<TestConnectionResult> {
    this.saveActiveDbConfig(config);
    if (!config.host || !config.database) {
      return {
        success: false,
        message: 'Connection failed',
        details: 'Database host and database name are required.',
      };
    }

    const payload = {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password && !config.password.startsWith('•') ? config.password : undefined,
      schema_name: 'public',
    };

    const res = await requestJson<{
      success: boolean;
      message: string;
      details: string;
      database?: string;
      server_version?: string;
    }>('/api/metadata/test-connection', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      return {
        success: res.data.success,
        message: res.data.message,
        details: res.data.details,
      };
    }

    if (res.isBackendOffline) {
      return {
        success: false,
        message: 'Connection failed: Backend offline',
        details: `Unable to connect to PostgreSQL at ${config.host}:${config.port}/${config.database}. DBScope backend server is offline or unreachable on port 8000.`,
      };
    }

    return {
      success: false,
      message: 'Connection failed',
      details: res.error || 'Failed to connect to PostgreSQL database.',
    };
  },

  /**
   * Inspect PostgreSQL catalog schema metadata without querying business rows.
   * Calls backend POST /api/metadata/inspect.
   */
  async scanDatabaseSchema(config: DatabaseConfig): Promise<ScanDatabaseResult> {
    this.saveActiveDbConfig(config);
    const payload = {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password && !config.password.startsWith('•') ? config.password : undefined,
      schema_name: 'public',
    };

    const res = await requestJson<{
      tables: Array<{ name: string; columns: Array<{ name: string }> }>;
      schema_name: string;
      total_tables: number;
      total_columns: number;
    }>('/api/metadata/inspect', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      const tablesCount = res.data.total_tables || res.data.tables.length;
      const columnsCount =
        res.data.total_columns ||
        res.data.tables.reduce((acc, tbl) => acc + (tbl.columns?.length || 0), 0);

      return {
        success: true,
        tablesCount,
        columnsCount,
        message: `Inspected PostgreSQL schema '${res.data.schema_name}' for ${config.database}. ${tablesCount} tables, ${columnsCount} columns detected.`,
      };
    }

    if (res.isBackendOffline) {
      return {
        success: false,
        tablesCount: 0,
        columnsCount: 0,
        message: `Failed to inspect database: DBScope backend server is offline. Please start the backend on port 8000.`,
      };
    }

    return {
      success: false,
      tablesCount: 0,
      columnsCount: 0,
      message: res.error || 'Failed to inspect PostgreSQL schema catalog.',
    };
  },

  /**
   * Upload and safely unpack application source ZIP archive for static AST analysis.
   */
  async validateRepositoryZip(file: File): Promise<ZipUploadResult> {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

    const formData = new FormData();
    formData.append('file', file);

    const res = await requestJson<{
      success: boolean;
      filename: string;
      size: string;
      files_count: number;
      status: string;
      message: string;
    }>('/api/source/upload-zip', {
      method: 'POST',
      body: formData,
    });

    if (res.ok && res.data) {
      this.saveActiveSource({ name: res.data.filename, size: res.data.size });
      return {
        success: true,
        filename: res.data.filename,
        size: res.data.size,
        status: `${res.data.status} (${res.data.files_count} Python files)`,
        message: res.data.message,
      };
    }

    return {
      success: false,
      filename: file.name,
      size: `${sizeMb} MB`,
      status: 'Upload Failed',
      message: res.error || 'Failed to upload and validate ZIP archive.',
    };
  },

  /**
   * Link and scan a public GitHub repository URL for application source code.
   */
  async validateGitHubUrl(url: string): Promise<GitHubScanResult> {
    const trimmed = url.trim();

    const res = await requestJson<{
      success: boolean;
      repo_name: string;
      branch: string;
      url: string;
      files_count: number;
      status: string;
      message: string;
    }>('/api/source/github', {
      method: 'POST',
      body: JSON.stringify({ url: trimmed }),
    });

    if (res.ok && res.data) {
      this.saveActiveSource({
        name: `${res.data.repo_name} (GitHub)`,
        size: `${res.data.files_count} Python files`,
      });
      return {
        success: true,
        repoName: res.data.repo_name,
        branch: res.data.branch,
        status: res.data.status,
        message: res.data.message,
      };
    }

    return {
      success: false,
      repoName: '',
      branch: '',
      status: 'Connection Failed',
      message: res.error || 'Failed to connect to GitHub repository.',
    };
  },

  /**
   * Query the live backend for current active application source info.
   */
  async getActiveSourceInfo(): Promise<{
    active: boolean;
    type: string;
    name?: string;
    files_count?: number;
    path?: string;
    message?: string;
  }> {
    const res = await requestJson<{
      active: boolean;
      type: string;
      name?: string;
      files_count?: number;
      path?: string;
      message?: string;
    }>('/api/source/active');

    if (res.ok && res.data) {
      if (res.data.active && res.data.name) {
        this.saveActiveSource({
          name: res.data.name,
          size: `${res.data.files_count ?? 0} Python files`,
        });
      }
      return res.data;
    }

    return {
      active: false,
      type: 'sample',
      name: 'Built-in sample_app',
      message: 'Running against default sample_app reference workspace.',
    };
  },

  /**
   * Reset backend active source to built-in sample_app reference workspace.
   */
  async resetActiveSource(): Promise<{ success: boolean; message: string }> {
    this.saveActiveSource(null);
    const res = await requestJson<{ success: boolean; message: string }>('/api/source/reset', {
      method: 'POST',
    });
    if (res.ok && res.data) {
      return res.data;
    }
    return {
      success: true,
      message: 'Reset active source to default reference workspace.',
    };
  },
};
