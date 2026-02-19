/**
 * API clients for Financial Modeling Prep and Alpha Vantage.
 * FMP is primary (better earnings calendar), AV is fallback.
 */
import config from './config.json' with { type: 'json' };

// ---------- Financial Modeling Prep ----------

export async function fmpEarningsCalendar(from, to) {
  const url = `${config.fmp.baseUrl}/earning_calendar?from=${from}&to=${to}&apikey=${config.fmp.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP earnings calendar failed: ${res.status}`);
  return res.json();
  // Returns: [{ date, symbol, eps, epsEstimated, revenue, revenueEstimated, time, ... }]
}

export async function fmpEarningsConfirmed(from, to) {
  const url = `${config.fmp.baseUrl}/earning-calendar-confirmed?from=${from}&to=${to}&apikey=${config.fmp.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP confirmed earnings failed: ${res.status}`);
  return res.json();
}

export async function fmpQuote(ticker) {
  const url = `${config.fmp.baseUrl}/quote/${ticker}?apikey=${config.fmp.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP quote failed: ${res.status}`);
  const data = await res.json();
  return data[0] || null;
  // Returns: { symbol, price, changesPercentage, change, previousClose, ... }
}

export async function fmpEarningsSurprises(ticker) {
  const url = `${config.fmp.baseUrl}/earnings-surprises/${ticker}?apikey=${config.fmp.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP earnings surprises failed: ${res.status}`);
  return res.json();
  // Returns: [{ date, actualEarningResult, estimatedEarning, symbol }]
}

export async function fmpStockNews(ticker, limit = 5) {
  const url = `${config.fmp.baseUrl}/stock_news?tickers=${ticker}&limit=${limit}&apikey=${config.fmp.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FMP news failed: ${res.status}`);
  return res.json();
}

// ---------- Alpha Vantage (fallback) ----------

export async function avEarningsCalendar(horizon = '3month') {
  const url = `${config.alphaVantage.baseUrl}?function=EARNINGS_CALENDAR&horizon=${horizon}&apikey=${config.alphaVantage.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AV earnings calendar failed: ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv);
  // Returns: [{ symbol, name, reportDate, fiscalDateEnding, estimate, currency }]
}

export async function avEarnings(ticker) {
  const url = `${config.alphaVantage.baseUrl}?function=EARNINGS&symbol=${ticker}&apikey=${config.alphaVantage.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AV earnings failed: ${res.status}`);
  return res.json();
  // Returns: { quarterlyEarnings: [{ reportedDate, reportedEPS, estimatedEPS, surprise, surprisePercentage }] }
}

export async function avQuote(ticker) {
  const url = `${config.alphaVantage.baseUrl}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${config.alphaVantage.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AV quote failed: ${res.status}`);
  return res.json();
}

// ---------- Helpers ----------

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim());
    return obj;
  });
}
