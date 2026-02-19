import { BasePersona } from './base-persona.js';

export class ContentAnalyst extends BasePersona {
  constructor() {
    super('ContentAnalyst', 'Content & Engagement', ['content', 'engagement', 'social', 'seo']);
  }

  async analyze(allData, preferences) {
    const data = this.filterData(allData);
    const recs = [];

    if (data.content) {
      const { posts_30d, avg_engagement, top_format, declining_topics } = data.content;
      if (posts_30d !== undefined && posts_30d < 4) {
        recs.push({ title: 'Content output too low', body: `Only ${posts_30d} pieces in 30 days. Increase cadence or repurpose existing content.`, priority: 'high', category: 'cadence', confidence: 0.8 });
      }
      if (declining_topics?.length) {
        recs.push({ title: 'Declining topic performance', body: `These topics are losing engagement: ${declining_topics.join(', ')}. Refresh or retire.`, priority: 'medium', category: 'topics', confidence: 0.7 });
      }
      if (top_format) {
        recs.push({ title: `${top_format} content outperforming`, body: `${top_format} gets highest engagement. Shift production mix toward this format.`, priority: 'medium', category: 'format', confidence: 0.75 });
      }
    }

    if (data.seo) {
      const { organic_trend, top_pages_declining } = data.seo;
      if (organic_trend === 'down') {
        recs.push({ title: 'Organic traffic declining', body: 'SEO traffic trending down. Audit top pages, check for algorithm changes, refresh stale content.', priority: 'high', category: 'seo', confidence: 0.8 });
      }
    }

    if (recs.length === 0) {
      recs.push({ title: 'Content performance stable', body: 'No urgent content issues. Consider testing new formats or channels.', priority: 'low', category: 'status', confidence: 0.5 });
    }

    return this.applyPreferenceBias(recs, preferences);
  }
}
