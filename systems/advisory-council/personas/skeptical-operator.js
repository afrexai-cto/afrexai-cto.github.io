import { BasePersona } from './base-persona.js';

export class SkepticalOperator extends BasePersona {
  constructor() {
    super('SkepticalOperator', 'Operational Risk', ['incidents', 'dependencies', 'team', 'compliance', 'operations']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.incidents) {
      const { count_30d, avg_resolution_hrs, severity_trend } = data.incidents;
      if (count_30d && count_30d > 5) {
        recs.push({ title: 'High incident frequency', body: `${count_30d} incidents in 30 days. Trend: ${severity_trend || 'unknown'}. Implement post-mortems and preventive measures.`, priority: 'critical', category: 'reliability', confidence: 0.9 });
      }
      if (avg_resolution_hrs && avg_resolution_hrs > 4) {
        recs.push({ title: 'Slow incident resolution', body: `Average resolution time: ${avg_resolution_hrs}h. Create runbooks and improve on-call processes.`, priority: 'high', category: 'operations', confidence: 0.85 });
      }
    }

    if (data.dependencies) {
      const { single_points, vendor_risks } = data.dependencies;
      if (single_points && single_points.length > 0) {
        recs.push({ title: 'Single points of failure detected', body: `Critical dependencies without redundancy: ${single_points.join(', ')}. Build fallbacks.`, priority: 'high', category: 'risk', confidence: 0.85 });
      }
    }

    if (data.team) {
      const { bus_factor, burnout_risk } = data.team;
      if (bus_factor && bus_factor <= 1) {
        recs.push({ title: 'Bus factor of 1', body: 'Critical knowledge concentrated in one person. Cross-train and document immediately.', priority: 'critical', category: 'team', confidence: 0.95 });
      }
      if (burnout_risk && burnout_risk > 0.7) {
        recs.push({ title: 'Team burnout risk elevated', body: `Burnout risk score: ${(burnout_risk*100).toFixed(0)}%. Review workload and hiring priorities.`, priority: 'high', category: 'team', confidence: 0.8 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Operations look stable', body: 'No major red flags. Stay vigilant — complacency is the real risk.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
