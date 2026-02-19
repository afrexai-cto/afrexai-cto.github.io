/**
 * Base class for all advisory council personas.
 * Each persona receives only domain-relevant data and produces recommendations.
 */
export class BasePersona {
  constructor(name, domain, dataKeys) {
    this.name = name;
    this.domain = domain;
    this.dataKeys = dataKeys; // which data-collector keys this persona sees
  }

  /** Filter full business data to only what this persona needs */
  filterData(allData) {
    const filtered = {};
    for (const key of this.dataKeys) {
      if (allData[key] !== undefined) filtered[key] = allData[key];
    }
    return filtered;
  }

  /** Produce recommendations. Override in subclass. Returns [{title, body, priority, category, confidence}] */
  async analyze(data, preferences) {
    throw new Error(`${this.name}.analyze() not implemented`);
  }

  /** Apply learned preference bias to priority */
  applyPreferenceBias(recs, preferences) {
    const pref = preferences?.find(p => p.persona === this.name);
    if (!pref) return recs;
    return recs.map(r => {
      const bias = pref.priority_bias || 0;
      const boosted = Math.min(1, Math.max(0, r.confidence + bias * 0.1));
      return { ...r, confidence: boosted };
    });
  }
}
