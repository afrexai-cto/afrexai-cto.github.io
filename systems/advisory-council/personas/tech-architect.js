import { BasePersona } from './base-persona.js';

export class TechArchitect extends BasePersona {
  constructor() {
    super('TechArchitect', 'Technical Architecture', ['infrastructure', 'tech_debt', 'performance', 'security']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.tech_debt) {
      const { score, outdated_deps, test_coverage } = data.tech_debt;
      if (score && score > 70) {
        recs.push({ title: 'Technical debt critical', body: `Debt score: ${score}/100. Allocate 20% sprint capacity to debt reduction.`, priority: 'critical', category: 'debt', confidence: 0.85 });
      }
      if (outdated_deps && outdated_deps > 10) {
        recs.push({ title: `${outdated_deps} outdated dependencies`, body: 'Security and compatibility risk. Schedule dependency update sprint.', priority: 'high', category: 'dependencies', confidence: 0.8 });
      }
      if (test_coverage && test_coverage < 0.5) {
        recs.push({ title: 'Test coverage below 50%', body: `Coverage at ${(test_coverage*100).toFixed(0)}%. Prioritize tests for critical paths.`, priority: 'medium', category: 'quality', confidence: 0.7 });
      }
    }

    if (data.infrastructure) {
      const { uptime, scalability_ceiling, cost_trend } = data.infrastructure;
      if (uptime && uptime < 0.999) {
        recs.push({ title: 'Uptime below three nines', body: `Uptime: ${(uptime*100).toFixed(2)}%. Investigate top failure modes.`, priority: 'high', category: 'reliability', confidence: 0.85 });
      }
      if (scalability_ceiling && scalability_ceiling < 2) {
        recs.push({ title: 'Approaching scalability limit', body: `Can handle ${scalability_ceiling}x current load. Plan capacity upgrade.`, priority: 'high', category: 'scalability', confidence: 0.8 });
      }
    }

    if (data.security) {
      const { vulnerabilities, last_audit_days } = data.security;
      if (vulnerabilities && vulnerabilities > 0) {
        recs.push({ title: `${vulnerabilities} known security vulnerabilities`, body: 'Patch immediately. Prioritize by CVSS score.', priority: 'critical', category: 'security', confidence: 0.95 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Tech stack in good shape', body: 'No critical technical issues. Continue monitoring performance and debt.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
