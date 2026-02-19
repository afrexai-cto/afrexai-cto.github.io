/**
 * Data collector stubs. Each returns domain-specific business data.
 * Replace with real API integrations (Stripe, Mixpanel, etc.)
 */

export async function collectRevenue() {
  return { mrr: 45000, arr: 540000, growth_rate: 0.02, churn_revenue: 3200 };
}

export async function collectPricing() {
  return { annual_option: false, last_change_days: 420, tiers: 3 };
}

export async function collectUsers() {
  return { total: 2800, active_pct: 0.25, signup_rate: -0.05, top_source: 'organic search' };
}

export async function collectMarket() {
  return { tam: '2B', penetration: 0.0003 };
}

export async function collectIncidents() {
  return { count_30d: 7, avg_resolution_hrs: 6, severity_trend: 'worsening' };
}

export async function collectDependencies() {
  return { single_points: ['payment processor', 'email provider'], vendor_risks: [] };
}

export async function collectTeam() {
  return { bus_factor: 1, burnout_risk: 0.75, headcount: 8 };
}

export async function collectContent() {
  return { posts_30d: 2, avg_engagement: 0.03, top_format: 'Video', declining_topics: ['tutorials', 'news'] };
}

export async function collectSeo() {
  return { organic_trend: 'down', top_pages_declining: 5 };
}

export async function collectCompetitors() {
  return { new_entrants: ['StartupX'], feature_gaps: ['mobile app', 'API v2'], pricing_moves: ['CompA dropped prices 20%'] };
}

export async function collectMarketPosition() {
  return { share: 0.02, trend: 'losing' };
}

export async function collectCustomers() {
  return { churn_rate: 0.07, ltv: 2400, cac: 1200, health_score: 55 };
}

export async function collectSupport() {
  return { ticket_volume_trend: 'up', csat: 3.6, avg_response_hrs: 28 };
}

export async function collectTechDebt() {
  return { score: 75, outdated_deps: 14, test_coverage: 0.38 };
}

export async function collectInfrastructure() {
  return { uptime: 0.997, scalability_ceiling: 1.5, cost_trend: 'up' };
}

export async function collectSecurity() {
  return { vulnerabilities: 3, last_audit_days: 180 };
}

export async function collectFinances() {
  return { burn_rate: 85000, runway_months: 8, gross_margin: 0.55, revenue_growth: 0.02 };
}

export async function collectCosts() {
  return { top_expense: 'Engineering salaries', trend: 'increasing', infra_pct: 0.35 };
}

export async function collectUnitEconomics() {
  return { cac_payback_months: 22, ltv_cac_ratio: 2.0 };
}

/** Collect all data sources in parallel, return keyed object */
export async function collectAll() {
  const [revenue, pricing, users, market, incidents, dependencies, team, content, seo,
    competitors, market_position, customers, support, tech_debt, infrastructure, security,
    finances, costs, unit_economics] = await Promise.all([
    collectRevenue(), collectPricing(), collectUsers(), collectMarket(),
    collectIncidents(), collectDependencies(), collectTeam(),
    collectContent(), collectSeo(), collectCompetitors(), collectMarketPosition(),
    collectCustomers(), collectSupport(), collectTechDebt(), collectInfrastructure(),
    collectSecurity(), collectFinances(), collectCosts(), collectUnitEconomics(),
  ]);
  return { revenue, pricing, users, market, incidents, dependencies, team, content, seo,
    competitors, market_position, customers, support, tech_debt, infrastructure, security,
    finances, costs, unit_economics };
}
