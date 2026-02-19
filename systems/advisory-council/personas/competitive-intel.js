import { BasePersona } from './base-persona.js';

export class CompetitiveIntel extends BasePersona {
  constructor() {
    super('CompetitiveIntel', 'Competitive Intelligence', ['competitors', 'market_position', 'industry']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.competitors) {
      const { new_entrants, feature_gaps, pricing_moves } = data.competitors;
      if (new_entrants?.length) {
        recs.push({ title: 'New competitors entered market', body: `Watch: ${new_entrants.join(', ')}. Assess their positioning and differentiation.`, priority: 'medium', category: 'landscape', confidence: 0.7 });
      }
      if (feature_gaps?.length) {
        recs.push({ title: 'Feature gaps vs competitors', body: `Competitors offer: ${feature_gaps.join(', ')}. Evaluate build/buy/partner for each.`, priority: 'high', category: 'product', confidence: 0.75 });
      }
      if (pricing_moves?.length) {
        recs.push({ title: 'Competitor pricing changes', body: `Recent moves: ${pricing_moves.join('; ')}. Review positioning.`, priority: 'medium', category: 'pricing', confidence: 0.7 });
      }
    }

    if (data.market_position) {
      const { share, trend } = data.market_position;
      if (trend === 'losing') {
        recs.push({ title: 'Market share eroding', body: `Current share: ${(share*100).toFixed(1)}%, trending down. Differentiate or compete on value.`, priority: 'critical', category: 'position', confidence: 0.85 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Competitive landscape stable', body: 'No major competitor movements detected. Continue monitoring.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
