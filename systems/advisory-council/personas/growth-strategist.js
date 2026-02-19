import { BasePersona } from './base-persona.js';

export class GrowthStrategist extends BasePersona {
  constructor() {
    super('GrowthStrategist', 'Growth & Expansion', ['users', 'signups', 'funnel', 'market', 'channels']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.users) {
      const { total, active_pct, signup_rate, top_source } = data.users;
      if (active_pct && active_pct < 0.3) {
        recs.push({ title: 'Low activation rate', body: `Only ${(active_pct*100).toFixed(0)}% of users are active. Focus on onboarding improvements and activation triggers.`, priority: 'high', category: 'activation', confidence: 0.85 });
      }
      if (signup_rate && signup_rate < 0) {
        recs.push({ title: 'Signup rate declining', body: 'New signups are trending down. Audit acquisition channels and messaging.', priority: 'high', category: 'acquisition', confidence: 0.8 });
      }
      if (top_source) {
        recs.push({ title: `Double down on ${top_source}`, body: `Top acquisition channel is ${top_source}. Allocate more resources here while exploring adjacent channels.`, priority: 'medium', category: 'channels', confidence: 0.7 });
      }
    }

    if (data.market) {
      const { tam, penetration } = data.market;
      if (penetration && penetration < 0.01) {
        recs.push({ title: 'Massive market headroom', body: `Market penetration is ${(penetration*100).toFixed(2)}%. TAM of $${tam}. Prioritize growth over optimization.`, priority: 'medium', category: 'expansion', confidence: 0.75 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Growth metrics stable', body: 'No urgent growth issues. Consider A/B testing new acquisition channels.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
