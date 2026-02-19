import { BasePersona } from './base-persona.js';

export class FinancialAnalyst extends BasePersona {
  constructor() {
    super('FinancialAnalyst', 'Financial Analysis', ['finances', 'costs', 'runway', 'unit_economics']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.finances) {
      const { burn_rate, runway_months, gross_margin, revenue_growth } = data.finances;
      if (runway_months && runway_months < 12) {
        recs.push({ title: `${runway_months} months runway remaining`, body: `At current burn of $${burn_rate}/mo, runway is tight. Start fundraising or cut costs.`, priority: 'critical', category: 'runway', confidence: 0.95 });
      }
      if (gross_margin && gross_margin < 0.6) {
        recs.push({ title: 'Gross margin below 60%', body: `Margin at ${(gross_margin*100).toFixed(0)}%. Review COGS and optimize infrastructure costs.`, priority: 'high', category: 'margins', confidence: 0.8 });
      }
    }

    if (data.costs) {
      const { top_expense, trend, infra_pct } = data.costs;
      if (infra_pct && infra_pct > 0.3) {
        recs.push({ title: 'Infrastructure costs over 30% of spend', body: `Infra is ${(infra_pct*100).toFixed(0)}% of total costs. Optimize or renegotiate contracts.`, priority: 'high', category: 'costs', confidence: 0.8 });
      }
      if (trend === 'increasing') {
        recs.push({ title: 'Costs trending upward', body: `Top expense: ${top_expense}. Review all line items for optimization.`, priority: 'medium', category: 'costs', confidence: 0.7 });
      }
    }

    if (data.unit_economics) {
      const { cac_payback_months, ltv_cac_ratio } = data.unit_economics;
      if (cac_payback_months && cac_payback_months > 18) {
        recs.push({ title: 'CAC payback exceeds 18 months', body: `Payback period: ${cac_payback_months} months. Improve activation or reduce acquisition cost.`, priority: 'high', category: 'unit_economics', confidence: 0.85 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Financials look healthy', body: 'Key financial metrics within acceptable ranges.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
