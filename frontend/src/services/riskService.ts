import { requestJson } from './api';
import { mockRiskAssessment } from '../mock/risk';
import type { DatabaseConfig, RiskAssessment, RiskEvidence } from '../types';

export const riskService = {
  /**
   * Perform database change risk assessment.
   * Calls real backend POST /api/risk/analyze with fallback to mock data if offline.
   */
  async getRiskAssessment(
    changedObject: string = 'users.email',
    dbConfig?: DatabaseConfig,
    sql?: string
  ): Promise<RiskAssessment> {
    const payload = {
      sql: sql ? sql.trim() : undefined,
      changed_object: changedObject,
      host: dbConfig?.host,
      port: dbConfig?.port,
      database: dbConfig?.database,
      username: dbConfig?.username,
      password: dbConfig?.password && !dbConfig.password.startsWith('••••') ? dbConfig.password : undefined,
    };

    const res = await requestJson<{
      risk_score: number;
      impact_score: number;
      likelihood_score: number;
      risk_level: string;
      recommended_action: string;
      affected_components: string[];
      affected_layers: string[];
      reasons: string[];
      operation: string;
      database_object: string;
      table: string;
      column?: string;
      dependency_count: number;
      impact_factors: string[];
      likelihood_factors: string[];
    }>('/api/risk/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      const d = res.data;
      const rawFactors = [...(d.reasons || []), ...(d.impact_factors || []), ...(d.likelihood_factors || [])];
      const factors = Array.from(new Set(rawFactors));

      const evidence: RiskEvidence[] = (d.affected_components || []).map((comp) => {
        const isRoute = comp.includes('/') || comp.includes('GET') || comp.includes('POST');
        const isSchema = comp.includes('Response') || comp.includes('Schema');
        return {
          category: isRoute ? 'API Route Contract' : isSchema ? 'Pydantic Schema' : 'ORM Model Binding',
          title: comp,
          detail: `Downstream component directly affected by schema alteration on ${d.database_object}.`,
        };
      });

      const normalizedLevel = (d.risk_level || 'HIGH') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

      return {
        changed_object: d.database_object || changedObject,
        riskLevel: normalizedLevel,
        score: d.risk_score,
        impactScore: d.impact_score,
        likelihoodScore: d.likelihood_score,
        rawScore: d.risk_score,
        reasons: d.reasons || [],
        action: d.recommended_action || 'REVIEW',
        affectedLayers: d.affected_layers || [],
        operation: d.operation || 'DROP_COLUMN',
        impactFactors: d.impact_factors || [],
        likelihoodFactors: d.likelihood_factors || [],
        factors: factors.length > 0 ? factors : [`Affected downstream dependencies: ${d.dependency_count}`],
        evidence: evidence.length > 0 ? evidence : mockRiskAssessment.evidence,
        recommendation:
          d.recommended_action === 'ALLOW'
            ? 'Safe migration change. The change does not cause breaking AST errors and can be applied without downtime.'
            : `Decision Gate: Review Required. ${d.reasons?.[0] || 'Direct schema execution affects downstream application components and requires coordinated deployment.'}`,
      };
    }

    // Fallback prototype mock data
    return {
      ...mockRiskAssessment,
      changed_object: changedObject,
    };
  },
};
