import { BasePersona } from './base-persona.js';

export class CustomerAdvocate extends BasePersona {
  constructor() {
    super('CustomerAdvocate', 'Customer Health', ['customers', 'support', 'nps', 'churn']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.customers) {
      const { churn_rate, ltv, cac, health_score } = data.customers;
      if (churn_rate && churn_rate > 0.05) {
        recs.push({ title: 'Customer churn too high', body: `Monthly churn at ${(churn_rate*100).toFixed(1)}%. Implement churn prediction and proactive outreach.`, priority: 'critical', category: 'churn', confidence: 0.9 });
      }
      if (ltv && cac && ltv / cac < 3) {
        recs.push({ title: 'LTV:CAC ratio below 3:1', body: `LTV:CAC is ${(ltv/cac).toFixed(1)}:1. Either reduce acquisition cost or improve retention.`, priority: 'high', category: 'economics', confidence: 0.85 });
      }
      if (health_score && health_score < 60) {
        recs.push({ title: 'Customer health score declining', body: `Average health score: ${health_score}/100. Segment at-risk accounts and intervene.`, priority: 'high', category: 'health', confidence: 0.8 });
      }
    }

    if (data.support) {
      const { ticket_volume_trend, csat, avg_response_hrs } = data.support;
      if (csat && csat < 4.0) {
        recs.push({ title: 'CSAT below target', body: `CSAT at ${csat}/5. Review top complaint categories and address root causes.`, priority: 'high', category: 'satisfaction', confidence: 0.8 });
      }
      if (avg_response_hrs && avg_response_hrs > 24) {
        recs.push({ title: 'Support response time too slow', body: `Average first response: ${avg_response_hrs}h. Set SLAs and consider automation.`, priority: 'medium', category: 'support', confidence: 0.75 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Customer health looks good', body: 'Satisfaction and retention metrics within range. Keep listening.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
