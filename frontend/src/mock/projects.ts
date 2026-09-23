import type { Project } from '../types';

export const mockProjects: Project[] = [
  {
    id: 'proj-ecommerce-demo',
    name: 'E-Commerce Demo',
    description: 'Enterprise online storefront backend managing accounts, shopping carts, orders, and checkout APIs.',
    database: 'PostgreSQL',
    framework: 'FastAPI',
    orm: 'SQLAlchemy',
    lastScanned: '2026-09-23 16:30 UTC',
    activeMigrationCount: 1,
    status: 'active',
  },
  {
    id: 'proj-billing-service',
    name: 'Subscription Billing Core',
    description: 'Recurring invoice processing and payment gateway dispatcher microservice.',
    database: 'PostgreSQL',
    framework: 'FastAPI',
    orm: 'SQLAlchemy',
    lastScanned: '2026-09-22 11:15 UTC',
    activeMigrationCount: 0,
    status: 'configured',
  }
];
