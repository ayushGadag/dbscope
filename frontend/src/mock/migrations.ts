import type { Migration, MigrationAnalysis } from '../types';

export const mockMigrations: Migration[] = [
  {
    id: 'mig-001',
    title: 'Drop User Email Column',
    sql: 'ALTER TABLE users DROP COLUMN email;',
    description: 'Proposed migration to remove deprecated email column from core users table.',
    createdAt: '2026-09-23 15:45:00 UTC',
  },
  {
    id: 'mig-002',
    title: 'Add User Age Column',
    sql: 'ALTER TABLE users ADD COLUMN age INTEGER;',
    description: 'Add optional customer age attribute.',
    createdAt: '2026-09-22 09:20:00 UTC',
  },
  {
    id: 'mig-003',
    title: 'Alter Age Column Type',
    sql: 'ALTER TABLE users ALTER COLUMN age TYPE BIGINT;',
    description: 'Expand numeric precision for age.',
    createdAt: '2026-09-21 14:10:00 UTC',
  },
  {
    id: 'mig-004',
    title: 'Rename Email Column',
    sql: 'ALTER TABLE users RENAME COLUMN email TO email_address;',
    description: 'Standardize naming conventions across user columns.',
    createdAt: '2026-09-20 18:00:00 UTC',
  },
];

export const mockAnalysisResults: Record<string, MigrationAnalysis> = {
  'ALTER TABLE users DROP COLUMN email;': {
    operation: 'DROP_COLUMN',
    table: 'users',
    column: 'email',
    changed_object: 'users.email',
    status: 'Detected',
    message: 'Destructive DDL change detected: Column deletion directly impacts persistence layer and downstream consumers.',
  },
  'ALTER TABLE users ADD COLUMN age INTEGER;': {
    operation: 'ADD_COLUMN',
    table: 'users',
    column: 'age',
    data_type: 'INTEGER',
    changed_object: 'users.age',
    status: 'Detected',
    message: 'Additive non-breaking DDL change detected: New column requires ORM model declaration.',
  },
  'ALTER TABLE users ALTER COLUMN age TYPE BIGINT;': {
    operation: 'ALTER_COLUMN',
    table: 'users',
    column: 'age',
    clause: 'TYPE BIGINT',
    new_type: 'BIGINT',
    changed_object: 'users.age',
    status: 'Detected',
    message: 'Type modification detected: Verify Python integer bounds and serialization compatibility.',
  },
  'ALTER TABLE users RENAME COLUMN email TO email_address;': {
    operation: 'RENAME_COLUMN',
    table: 'users',
    old_column: 'email',
    new_column: 'email_address',
    changed_object: 'users.email',
    status: 'Detected',
    message: 'Column rename detected: Requires coordinated update to SQLAlchemy Column mapping and schema bindings.',
  },
};
