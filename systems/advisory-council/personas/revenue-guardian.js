import { BasePersona } from './base-persona.js';

export class RevenueGuardian extends BasePersona {
  constructor() {
    super('RevenueGuardian', 'Revenue & Monetization', ['revenue', 'pricing', 'subscriptions', 'transactions']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.revenue) {
      const { mrr, arr, growth_rate, churn_revenue } = data.revenue;
      if (churn_revenue && mrr && churn_revenue / mrr > 0.05) {
        recs.push({ title: 'Revenue churn exceeds 5% of MRR', body: `Revenue churn is ${((churn_revenue/mrr)*100).toFixed(1)}% of MRR ($${churn_revenue} lost). Investigate downgrade patterns and implement save offers.`, priority: 'critical', category: 'churn', confidence: 0.9 });
      }
      if (growth_rate !== undefined && growth_rate < 0.03) {
        recs.push({ title: 'Revenue growth stalling', body: `Monthly growth at ${(growth_rate*100).toFixed(1)}%. Consider new pricing tiers, upsell campaigns, or expansion revenue strategies.`, priority: 'high', category: 'growth', confidence: 0.8 });
      }
      if (mrr && !data.pricing?.annual_option) {
        recs.push({ title: 'Consider annual pricing discount', body: 'No annual plan detected. Offering 15-20% annual discount could improve cash flow and reduce churn.', priority: 'medium', category: 'pricing', confidence: 0.7 });
      }
    }

    if (data.pricing) {
      const { last_change_days } = data.pricing;
      if (last_change_days && last_change_days > 365) {
        recs.push({ title: 'Pricing hasn\'t changed in over a year', body: `Last pricing change was ${last_change_days} days ago. Review market positioning and consider value-based adjustments.`, priority: 'medium', category: 'pricing', confidence: 0.65 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Revenue streams appear healthy', body: 'No critical revenue issues detected. Continue monitoring key metrics.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
