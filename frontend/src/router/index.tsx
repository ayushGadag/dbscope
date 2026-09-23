import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Overview } from '../pages/Overview';
import { Projects } from '../pages/Projects';
import { ProjectScanner } from '../pages/ProjectScanner';
import { AnalyzeChange } from '../pages/AnalyzeChange';
import { DependencyGraph } from '../pages/DependencyGraph';
import { ImpactAnalysis } from '../pages/ImpactAnalysis';
import { RiskAssessment } from '../pages/RiskAssessment';
import { MigrationPlan } from '../pages/MigrationPlan';
import { Reports } from '../pages/Reports';
import { Architecture } from '../pages/Architecture';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'projects', element: <Projects /> },
      { path: 'scanner', element: <ProjectScanner /> },
      { path: 'analyze', element: <AnalyzeChange /> },
      { path: 'graph', element: <DependencyGraph /> },
      { path: 'impact', element: <ImpactAnalysis /> },
      { path: 'risk', element: <RiskAssessment /> },
      { path: 'plan', element: <MigrationPlan /> },
      { path: 'reports', element: <Reports /> },
      { path: 'architecture', element: <Architecture /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
