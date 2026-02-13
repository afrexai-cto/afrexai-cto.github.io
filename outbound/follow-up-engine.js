#!/usr/bin/env node
/**
 * AfrexAI Follow-Up Engine
 * 
 * Reads outreach-tracker.csv, determines which prospects need follow-ups,
 * generates personalised emails from templates, saves as Gmail drafts,
 * and updates the CSV.
 * 
 * Usage: node follow-up-engine.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// ─── Config ───────────────────────────────────────────────────────────────────
const CSV_PATH = path.resolve(__dirname, '../prospects/outreach-tracker.csv');
const TEMPLATES_DIR = path.resolve(__dirname, 'templates');
const CREDENTIALS_PATH = process.env.GMAIL_CREDENTIALS || path.resolve(__dirname, '../credentials/gmail-oauth.json');
const TOKEN_PATH = process.env.GMAIL_TOKEN || path.resolve(__dirname, '../credentials/gmail-token.json');
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'kalin@afrexai.com';
const DRY_RUN = process.argv.includes('--dry-run');

const FOLLOW_UP_SCHEDULE = [
  { day: 3,  status: 'follow-up-1', template: 'follow-up-1.html', subject: 'Re: Quick question for {{company}}' },
  { day: 7,  status: 'follow-up-2', template: 'follow-up-2.html', subject: 'Re: Thought this might help — {{company}}' },
  { day: 14, status: 'follow-up-3', template: 'follow-up-3.html', subject: 'Re: Last note from me — {{company}}' },
];

// ─── Vertical Content ─────────────────────────────────────────────────────────
const VERTICAL_CONTENT = {
  // Legal / Law
  legal: {
    hook: "We built something called <a href='https://afrexai.com'>VADIS</a> — it helps legal teams cut through document review using AI that actually understands context, not just keywords.",
    insight: "Law firms we've spoken to are spending 30-40% of associate time on document triage that AI can handle in minutes. Our <strong>VADIS</strong> system was built specifically for this — structured AI that respects the nuance legal work demands.",
    parting: "Just in case it's useful later — here's a quick look at how <a href='https://afrexai.com'>VADIS</a> handles legal document intelligence. No strings attached.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Construction / Architecture
  construction: {
    hook: "We're building <a href='https://afrexai.com'>SiteVoice</a> — think of it as a voice-first AI assistant for site teams. Log issues, pull drawings, check specs — all hands-free.",
    insight: "Construction teams lose 2-3 hours daily searching for project info across scattered systems. <strong>SiteVoice</strong> consolidates that into a single voice/chat interface your site teams can use on the go.",
    parting: "If you ever want to explore how AI could help on-site coordination, <a href='https://afrexai.com'>SiteVoice</a> will be here. Built by people who've actually been on sites.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Marketing / Agency / PR / Creative / SEO / Digital
  agency: {
    hook: "We help agencies like yours deploy custom AI assistants that handle client reporting, content briefs, and internal workflows — without the generic ChatGPT wrapper feel.",
    insight: "Agencies are finding that bespoke AI tools (not off-the-shelf) are becoming a real differentiator. We've been packaging AI capabilities that agencies can white-label or use internally to 2-3x output. <a href='https://afrexai-cto.github.io/context-packs/'>Here's how we think about it.</a>",
    parting: "If you ever want to explore custom AI tooling for your team (or as a client offering), we'd love to chat. <a href='https://afrexai.com'>afrexai.com</a>",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // SaaS / Tech / AI
  saas: {
    hook: "We build AI systems that integrate deeply with existing SaaS products — not surface-level chatbots, but real workflow automation that your users would actually love.",
    insight: "The SaaS teams seeing the best AI ROI are the ones embedding it into existing UX rather than bolting on a separate 'AI feature'. We've been helping companies do exactly that — <a href='https://afrexai-cto.github.io/context-packs/'>here's our approach</a>.",
    parting: "If AI integration ever moves up the roadmap, we'd love to help. <a href='https://afrexai.com'>afrexai.com</a> — we build what your users will actually use.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Healthcare / Dental
  healthcare: {
    hook: "We're building AI tools that help healthcare practices automate patient comms, triage enquiries, and streamline admin — all while staying compliant.",
    insight: "Dental groups and healthcare practices are finding that AI-driven patient communication (smart scheduling, follow-ups, intake) reduces no-shows by 20-30%. We built tools specifically for this. <a href='https://afrexai-cto.github.io/context-packs/'>See how.</a>",
    parting: "If patient comms or admin automation ever becomes a priority, we're here: <a href='https://afrexai.com'>afrexai.com</a>. Built with healthcare compliance in mind.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Financial Advisory / Accounting / Insurance
  finance: {
    hook: "We help financial firms automate document-heavy workflows — think client onboarding, report generation, and compliance checks — using AI that understands your domain.",
    insight: "Financial advisory firms are saving 10+ hours/week by automating client report prep and compliance documentation with purpose-built AI. We've been packaging exactly this. <a href='https://afrexai-cto.github.io/context-packs/'>Here's the detail.</a>",
    parting: "If operational efficiency or AI-assisted compliance ever becomes a focus, we'd love to help: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // E-commerce / DTC
  ecommerce: {
    hook: "We build AI-powered customer experience tools for e-commerce brands — smart product recommendations, automated support, and personalised shopping journeys.",
    insight: "DTC brands using AI for personalised customer journeys are seeing 15-25% lifts in conversion. We build these systems bespoke, not cookie-cutter. <a href='https://afrexai-cto.github.io/context-packs/'>Here's our approach.</a>",
    parting: "If you ever want to explore AI-driven CX for {{company}}, we're always here: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Recruitment / Staffing
  recruitment: {
    hook: "We're building AI tools that help recruitment firms screen candidates faster, automate outreach, and match talent more accurately — without losing the human touch.",
    insight: "Recruitment firms using AI-assisted candidate matching are filling roles 40% faster. We build these tools to work with your existing ATS, not replace it. <a href='https://afrexai-cto.github.io/context-packs/'>See how.</a>",
    parting: "If AI-powered recruitment tools ever make sense for your team, we'd love to chat: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Logistics / Supply Chain
  logistics: {
    hook: "We help logistics companies build AI systems for route optimisation, demand forecasting, and warehouse automation — practical tools that save real money.",
    insight: "Logistics firms using AI for demand forecasting and route planning are cutting costs 15-20%. We build these systems tailored to your operations. <a href='https://afrexai-cto.github.io/context-packs/'>Here's how.</a>",
    parting: "If AI-driven ops ever becomes a priority, we're here: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Real Estate / PropTech
  realestate: {
    hook: "We build AI tools for property teams — automated valuations, smart lead nurturing, and document processing that saves hours per deal.",
    insight: "Real estate firms using AI for lead scoring and automated follow-ups are converting 30% more enquiries. We build these tools bespoke. <a href='https://afrexai-cto.github.io/context-packs/'>Here's the approach.</a>",
    parting: "If AI-powered property tools ever make sense, we're always here: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Manufacturing
  manufacturing: {
    hook: "We help manufacturers build AI systems for quality control, predictive maintenance, and production optimisation — real ROI, not science projects.",
    insight: "Manufacturers deploying AI for predictive maintenance are cutting unplanned downtime by 30-50%. We build these systems to integrate with your existing equipment and workflows. <a href='https://afrexai-cto.github.io/context-packs/'>See how.</a>",
    parting: "If AI-driven manufacturing ever moves up the agenda, we'd love to chat: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // EdTech
  edtech: {
    hook: "We build AI tools for education platforms — adaptive learning, automated grading, and intelligent tutoring that actually improves outcomes.",
    insight: "EdTech companies embedding AI for personalised learning paths are seeing 2x engagement improvements. We build these systems to enhance your existing platform. <a href='https://afrexai-cto.github.io/context-packs/'>Here's our approach.</a>",
    parting: "If AI-enhanced learning features ever hit the roadmap, we're here: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Hospitality
  hospitality: {
    hook: "We build AI tools for hospitality groups — smart reservations, guest experience personalisation, and operational automation that frees up your team.",
    insight: "Restaurant groups using AI for demand forecasting and guest personalisation are seeing 15-20% revenue lifts. We build these tools to work with your existing POS and reservation systems. <a href='https://afrexai-cto.github.io/context-packs/'>See how.</a>",
    parting: "If AI-powered hospitality tools ever make sense, we're here: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Consulting
  consulting: {
    hook: "We help consulting firms automate research, report generation, and client deliverables using AI that understands your methodology.",
    insight: "Consulting firms using AI for research synthesis and report drafting are delivering 2x faster without sacrificing quality. We build these tools bespoke. <a href='https://afrexai-cto.github.io/context-packs/'>Here's how.</a>",
    parting: "If AI-assisted consulting delivery ever becomes a focus, we'd love to help: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // IT / Managed Services / Cyber
  it: {
    hook: "We build AI-powered monitoring, ticket triage, and automated remediation tools for IT service providers — fewer escalations, faster resolution.",
    insight: "MSPs using AI for ticket classification and automated L1 resolution are cutting response times by 60%. We build these to integrate with your existing PSA/RMM stack. <a href='https://afrexai-cto.github.io/context-packs/'>See how.</a>",
    parting: "If AI-driven service automation ever moves up the priority list, we're here: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
  // Default fallback
  default: {
    hook: "We build custom AI systems that help growing teams automate the work that's slowing them down — not generic tools, but solutions built around how your team actually operates.",
    insight: "Companies our size are finding that purpose-built AI (not off-the-shelf) delivers 3-5x better ROI because it's designed around actual workflows. <a href='https://afrexai-cto.github.io/context-packs/'>Here's how we approach it.</a>",
    parting: "If AI ever becomes a priority for {{company}}, we'd genuinely love to help: <a href='https://afrexai.com'>afrexai.com</a>.",
    contextPack: "https://afrexai-cto.github.io/context-packs/",
  },
};

// ─── Industry Classifier ──────────────────────────────────────────────────────
function classifyVertical(industry) {
  const i = industry.toLowerCase();
  if (i.includes('law') || i.includes('legal') || i.includes('litigation')) return 'legal';
  if (i.includes('construction') || i.includes('architect') || i.includes('hvac') || i.includes('plumbing') || i.includes('building')) return 'construction';
  if (i.includes('marketing') || i.includes('agency') || i.includes('pr ') || i.includes('creative') || i.includes('seo') || i.includes('digital') || i.includes('advertising') || i.includes('design') || i.includes('social media') || i.includes('content')) return 'agency';
  if (i.includes('saas') || i.includes('ai') || i.includes('tech') || i.includes('api') || i.includes('fintech')) return 'saas';
  if (i.includes('dental') || i.includes('health')) return 'healthcare';
  if (i.includes('account') || i.includes('cpa') || i.includes('financial') || i.includes('wealth') || i.includes('insurance') || i.includes('advisory')) return 'finance';
  if (i.includes('e-commerce') || i.includes('ecommerce') || i.includes('dtc') || i.includes('shopify')) return 'ecommerce';
  if (i.includes('recruit') || i.includes('staffing')) return 'recruitment';
  if (i.includes('logist') || i.includes('supply chain') || i.includes('freight') || i.includes('fulfilment')) return 'logistics';
  if (i.includes('real estate') || i.includes('proptech') || i.includes('brokerage')) return 'realestate';
  if (i.includes('manufactur') || i.includes('aerospace') || i.includes('plastic') || i.includes('industrial') || i.includes('machinery')) return 'manufacturing';
  if (i.includes('edtech') || i.includes('learning') || i.includes('tutor') || i.includes('education')) return 'edtech';
  if (i.includes('hospitality') || i.includes('restaurant')) return 'hospitality';
  if (i.includes('consult')) return 'consulting';
  if (i.includes('it ') || i.includes('managed service') || i.includes('cyber')) return 'it';
  return 'default';
}

// ─── CSV Helpers ──────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
    return obj;
  });
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => row[h] || '').join(','));
  }
  return lines.join('\n') + '\n';
}

// ─── Template Renderer ────────────────────────────────────────────────────────
function renderTemplate(templateFile, vars) {
  let html = fs.readFileSync(path.join(TEMPLATES_DIR, templateFile), 'utf8');
  for (const [key, val] of Object.entries(vars)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
  }
  return html;
}

// ─── Gmail Draft Creator ──────────────────────────────────────────────────────
async function getGmailClient() {
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = creds.installed || creds.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oAuth2Client.setCredentials(token);
  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

function buildRawEmail(to, subject, htmlBody) {
  const boundary = '----=_AfrexAI_' + Date.now();
  const raw = [
    `From: ${SENDER_EMAIL}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ].join('\r\n');
  return Buffer.from(raw).toString('base64url');
}

async function createDraft(gmail, to, subject, htmlBody) {
  const raw = buildRawEmail(to, subject, htmlBody);
  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw } },
  });
  return res.data.id;
}

// ─── Main Logic ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`🚀 AfrexAI Follow-Up Engine ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log(`📅 Today: ${new Date().toISOString().split('T')[0]}\n`);

  const csvText = fs.readFileSync(CSV_PATH, 'utf8');
  const prospects = parseCSV(csvText);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let gmail;
  if (!DRY_RUN) {
    try {
      gmail = await getGmailClient();
    } catch (err) {
      console.error('⚠️  Gmail auth failed. Run with --dry-run to preview, or set up credentials.');
      console.error(err.message);
      process.exit(1);
    }
  }

  let draftsCreated = 0;

  for (const prospect of prospects) {
    if (prospect.status === 'bounced' || prospect.status === 'replied' || prospect.status === 'follow-up-3') {
      continue; // Skip bounced, replied, or fully followed-up
    }

    const sentDate = new Date(prospect.date);
    sentDate.setHours(0, 0, 0, 0);
    const daysSinceSent = Math.floor((today - sentDate) / (1000 * 60 * 60 * 24));

    // Determine which follow-up is needed
    let nextFollowUp = null;
    for (const step of FOLLOW_UP_SCHEDULE) {
      if (prospect.status === 'sent' && step.status === 'follow-up-1' && daysSinceSent >= step.day) {
        nextFollowUp = step;
        break;
      }
      if (prospect.status === 'follow-up-1' && step.status === 'follow-up-2' && daysSinceSent >= step.day) {
        nextFollowUp = step;
        break;
      }
      if (prospect.status === 'follow-up-2' && step.status === 'follow-up-3' && daysSinceSent >= step.day) {
        nextFollowUp = step;
        break;
      }
    }

    if (!nextFollowUp) continue;

    const vertical = classifyVertical(prospect.industry || '');
    const content = VERTICAL_CONTENT[vertical] || VERTICAL_CONTENT.default;
    const contactName = prospect.contact_name === 'Team' ? 'there' : prospect.contact_name.split(' ')[0];

    const vars = {
      contact_name: contactName,
      company: prospect.company,
      vertical_hook: content.hook.replace(/\{\{company\}\}/g, prospect.company),
      vertical_insight: content.insight.replace(/\{\{company\}\}/g, prospect.company),
      vertical_parting: content.parting.replace(/\{\{company\}\}/g, prospect.company),
      context_pack_link: content.contextPack,
    };

    const subject = nextFollowUp.subject.replace(/\{\{company\}\}/g, prospect.company);
    const html = renderTemplate(nextFollowUp.template, vars);

    console.log(`📧 ${prospect.company} (${prospect.email}) → ${nextFollowUp.status} [${vertical}]`);

    if (!DRY_RUN) {
      try {
        const draftId = await createDraft(gmail, prospect.email, subject, html);
        console.log(`   ✅ Draft created: ${draftId}`);
        prospect.status = nextFollowUp.status;
        draftsCreated++;
      } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
      }
    } else {
      console.log(`   [DRY RUN] Would create draft: "${subject}"`);
      prospect.status = nextFollowUp.status;
      draftsCreated++;
    }
  }

  // Update CSV
  if (draftsCreated > 0 && !DRY_RUN) {
    fs.writeFileSync(CSV_PATH, toCSV(prospects));
    console.log(`\n📝 CSV updated with ${draftsCreated} status changes.`);
  }

  console.log(`\n✅ Done. ${draftsCreated} follow-up${draftsCreated !== 1 ? 's' : ''} ${DRY_RUN ? 'identified' : 'drafted'}.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
