/**
 * Core domain types for DBScope Enterprise Database Change Impact Analysis Platform.
 * Matches future FastAPI contracts and keeps mock/service layer decoupled.
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  database: 'PostgreSQL';
  framework: 'FastAPI';
  orm: 'SQLAlchemy';
  lastScanned?: string;
  activeMigrationCount: number;
  status: 'active' | 'configured' | 'pending';
}

export interface DatabaseConfig {
  type: 'PostgreSQL';
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl?: boolean;
}

export interface Migration {
  id: string;
  title: string;
  sql: string;
  description?: string;
  createdAt: string;
}

export interface MigrationAnalysis {
  operation: 'DROP_COLUMN' | 'ADD_COLUMN' | 'ALTER_COLUMN' | 'RENAME_COLUMN' | null;
  table?: string;
  column?: string;
  data_type?: string;
  clause?: string;
  new_type?: string;
  old_column?: string;
  new_column?: string;
  changed_object?: string;
  status: 'Detected' | 'Unsupported' | 'Invalid';
  message?: string;
}

export type DependencyNodeType =
  | 'database'
  | 'table'
  | 'column'
  | 'orm_model'
  | 'pydantic_schema'
  | 'fastapi_route';

export interface DependencyNode {
  id: string;
  label: string;
  type: DependencyNodeType;
  file?: string;
  line?: number;
  description?: string;
  blastRadius: 'High' | 'Medium' | 'Low' | 'Root';
  x?: number;
  y?: number;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

export interface DependencyGraphData {
  changed_object: string;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface ImpactComponent {
  component: string;
  type: 'orm_model' | 'pydantic_schema' | 'fastapi_route';
  file: string;
  line: number;
  relationship: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface ImpactResult {
  changed_object: string;
  affectedCount: number;
  components: ImpactComponent[];
}

export interface RiskEvidence {
  title: string;
  detail: string;
  category: string;
}

export interface RiskAssessment {
  changed_object: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  factors: string[];
  evidence: RiskEvidence[];
  recommendation: string;
}

export interface PlanStep {
  id: number;
  title: string;
  description: string;
  role: string;
  completed?: boolean;
}

export interface MigrationPlan {
  changed_object: string;
  summary: string;
  steps: PlanStep[];
}

export interface Report {
  id: string;
  projectName: string;
  targetDatabase: string;
  proposedMigration: string;
  timestamp: string;
  dependenciesCount: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  planStepsCount: number;
  summary: string;
}
