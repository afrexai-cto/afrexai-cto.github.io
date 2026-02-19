/**
 * Generates narrative earnings summaries.
 * Fetches actual results + price movement, produces a human-readable report.
 */
import { fmpEarningsSurprises, fmpQuote, fmpStockNews } from './api-client.js';
import { getDb } from './db.js';

const db = getDb();

function verdict(actual, estimate) {
  if (actual == null || estimate == null) return 'unknown';
  const diff = actual - estimate;
  const pct = estimate !== 0 ? (diff / Math.abs(estimate)) * 100 : 0;
  if (pct > 2) return 'beat';
  if (pct < -2) return 'miss';
  return 'met';
}

function formatCurrency(n) {
  if (n == null) return 'N/A';
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(2)}`;
}

export async function generateReport(ticker, reportDate) {
  // Fetch earnings surprise data
  let surprises, quote, news;
  try {
    [surprises, quote, news] = await Promise.all([
      fmpEarningsSurprises(ticker),
      fmpQuote(ticker),
      fmpStockNews(ticker, 5),
    ]);
  } catch (e) {
    return { success: false, error: e.message };
  }

  // Find the relevant quarter
  const latest = surprises?.[0];
  const epsActual = latest?.actualEarningResult ?? null;
  const epsEstimate = latest?.estimatedEarning ?? null;

  // Get calendar data for revenue
  const calRow = db.prepare('SELECT * FROM earnings_calendar WHERE ticker = ? AND report_date = ?').get(ticker, reportDate);
  const revEstimate = calRow?.revenue_estimate;

  const v = verdict(epsActual, epsEstimate);
  const priceNow = quote?.price ?? null;
  const priceChange = quote?.changesPercentage ?? null;
  const prevClose = quote?.previousClose ?? null;

  // Build narrative
  const lines = [];

  // Opening verdict
  if (v === 'beat') {
    lines.push(`**${ticker} beat expectations.** The company reported EPS of $${epsActual?.toFixed(2)} versus the Street's estimate of $${epsEstimate?.toFixed(2)} — a solid beat that shows the business is executing.`);
  } else if (v === 'miss') {
    lines.push(`**${ticker} missed expectations.** EPS came in at $${epsActual?.toFixed(2)} against an estimate of $${epsEstimate?.toFixed(2)} — a disappointing miss that raises questions about near-term momentum.`);
  } else if (v === 'met') {
    lines.push(`**${ticker} met expectations.** EPS of $${epsActual?.toFixed(2)} was roughly in line with the $${epsEstimate?.toFixed(2)} estimate — no fireworks, but no alarm bells either.`);
  } else {
    lines.push(`**${ticker} earnings results are in.** Detailed figures are still being compiled.`);
  }

  // Market reaction
  if (priceChange != null) {
    const direction = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'flat';
    const emoji = priceChange > 2 ? '🚀' : priceChange < -2 ? '📉' : '➡️';
    lines.push(`\n${emoji} **Market reaction:** The stock is ${direction} ${Math.abs(priceChange).toFixed(1)}% at $${priceNow?.toFixed(2)} (prev close $${prevClose?.toFixed(2)}). ${priceChange > 0 && v === 'miss' ? 'Interestingly, the market shrugged off the miss — perhaps guidance was strong.' : priceChange < 0 && v === 'beat' ? 'Despite the beat, shares are under pressure — the bar was clearly higher than the headline numbers.' : ''}`);
  }

  // Takeaways from news
  lines.push('\n**Key takeaways:**');
  if (news?.length) {
    const topNews = news.slice(0, 3);
    topNews.forEach((n, i) => {
      lines.push(`${i + 1}. ${n.title || n.text || 'Developing story'}`);
    });
  } else {
    lines.push('1. Full details are still being digested by the market.');
    lines.push('2. Watch for guidance commentary on the earnings call.');
    lines.push('3. Sector peers may move in sympathy — keep an eye on the broader group.');
  }

  const narrative = lines.join('\n');

  // Store in DB
  db.prepare(`
    INSERT OR REPLACE INTO past_reports (ticker, report_date, eps_actual, eps_estimate, revenue_actual, revenue_estimate, verdict, price_before, price_after, price_change_pct, narrative)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticker, reportDate, epsActual, epsEstimate, null, revEstimate, v, prevClose, priceNow, priceChange, narrative);

  return { success: true, narrative, verdict: v, ticker, reportDate };
}

// Generate from sample data (for testing without API)
export function generateSampleReport(ticker, data) {
  const { epsActual, epsEstimate, priceChange, priceBefore, priceAfter, newsHeadlines } = data;

  const v = verdict(epsActual, epsEstimate);
  const lines = [];

  if (v === 'beat') {
    lines.push(`**${ticker} beat expectations.** The company reported EPS of $${epsActual.toFixed(2)} versus the Street's estimate of $${epsEstimate.toFixed(2)} — a solid beat that shows the business is executing.`);
  } else if (v === 'miss') {
    lines.push(`**${ticker} missed expectations.** EPS came in at $${epsActual.toFixed(2)} against an estimate of $${epsEstimate.toFixed(2)} — a disappointing miss that raises questions about near-term momentum.`);
  } else {
    lines.push(`**${ticker} met expectations.** EPS of $${epsActual.toFixed(2)} was roughly in line with the $${epsEstimate.toFixed(2)} estimate — no fireworks, but no alarm bells either.`);
  }

  const direction = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'flat';
  const emoji = priceChange > 2 ? '🚀' : priceChange < -2 ? '📉' : '➡️';
  lines.push(`\n${emoji} **Market reaction:** The stock is ${direction} ${Math.abs(priceChange).toFixed(1)}% at $${priceAfter.toFixed(2)} (prev close $${priceBefore.toFixed(2)}).`);

  lines.push('\n**Key takeaways:**');
  newsHeadlines.forEach((h, i) => lines.push(`${i + 1}. ${h}`));

  return { narrative: lines.join('\n'), verdict: v };
}
