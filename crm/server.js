const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: 'localhost',
  database: 'afrexai_crm',
  user: 'openclaw',
});

// Serve dashboard
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

// --- API Routes ---

// Pipeline overview stats
app.get('/api/stats', async (req, res) => {
  try {
    const [companies, contacts, activities, dealsByStage, recentActivity] = await Promise.all([
      pool.query('SELECT count(*) FROM companies'),
      pool.query('SELECT count(*) FROM contacts'),
      pool.query('SELECT count(*) FROM activities'),
      pool.query("SELECT COALESCE(stage,'unset') as stage, count(*), COALESCE(sum(value),0) as total_value FROM deals GROUP BY stage ORDER BY count DESC"),
      pool.query("SELECT count(*) FROM activities WHERE created_at > now() - interval '7 days'"),
    ]);
    res.json({
      companies: +companies.rows[0].count,
      contacts: +contacts.rows[0].count,
      activities: +activities.rows[0].count,
      recentActivities: +recentActivity.rows[0].count,
      dealsByStage: dealsByStage.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Companies list with search/filter
app.get('/api/companies', async (req, res) => {
  try {
    const { search, industry, city, minEmployees, maxEmployees, limit = 50, offset = 0 } = req.query;
    let where = [], params = [], i = 1;
    if (search) { where.push(`(name ILIKE $${i} OR website ILIKE $${i})`); params.push(`%${search}%`); i++; }
    if (industry) { where.push(`industry ILIKE $${i}`); params.push(`%${industry}%`); i++; }
    if (city) { where.push(`city ILIKE $${i}`); params.push(`%${city}%`); i++; }
    if (minEmployees) { where.push(`employees >= $${i}`); params.push(+minEmployees); i++; }
    if (maxEmployees) { where.push(`employees <= $${i}`); params.push(+maxEmployees); i++; }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const q = `SELECT c.*, (SELECT count(*) FROM contacts WHERE company_id=c.id) as contact_count,
      (SELECT count(*) FROM activities WHERE company_id=c.id) as activity_count
      FROM companies c ${whereClause} ORDER BY c.updated_at DESC NULLS LAST LIMIT $${i} OFFSET $${i+1}`;
    params.push(+limit, +offset);
    const result = await pool.query(q, params);
    const total = await pool.query(`SELECT count(*) FROM companies ${whereClause}`, params.slice(0, -2));
    res.json({ rows: result.rows, total: +total.rows[0].count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Company detail
app.get('/api/companies/:id', async (req, res) => {
  try {
    const company = await pool.query('SELECT * FROM companies WHERE id=$1', [req.params.id]);
    const contacts = await pool.query('SELECT * FROM contacts WHERE company_id=$1 ORDER BY last_name', [req.params.id]);
    const activities = await pool.query('SELECT * FROM activities WHERE company_id=$1 ORDER BY created_at DESC', [req.params.id]);
    const deals = await pool.query('SELECT * FROM deals WHERE company_id=$1 ORDER BY created_at DESC', [req.params.id]);
    const tags = await pool.query('SELECT t.name FROM tags t JOIN company_tags ct ON t.id=ct.tag_id WHERE ct.company_id=$1', [req.params.id]);
    if (!company.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...company.rows[0], contacts: contacts.rows, activities: activities.rows, deals: deals.rows, tags: tags.rows.map(r=>r.name) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const { search, companyId, limit = 50, offset = 0 } = req.query;
    let where = [], params = [], i = 1;
    if (search) { where.push(`(c.first_name ILIKE $${i} OR c.last_name ILIKE $${i} OR c.email ILIKE $${i})`); params.push(`%${search}%`); i++; }
    if (companyId) { where.push(`c.company_id=$${i}`); params.push(+companyId); i++; }
    const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const q = `SELECT c.*, co.name as company_name FROM contacts c LEFT JOIN companies co ON c.company_id=co.id ${wc} ORDER BY c.updated_at DESC NULLS LAST LIMIT $${i} OFFSET $${i+1}`;
    params.push(+limit, +offset);
    res.json({ rows: (await pool.query(q, params)).rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Contact detail with timeline
app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await pool.query('SELECT c.*, co.name as company_name FROM contacts c LEFT JOIN companies co ON c.company_id=co.id WHERE c.id=$1', [req.params.id]);
    const activities = await pool.query('SELECT * FROM activities WHERE contact_id=$1 ORDER BY created_at DESC', [req.params.id]);
    const deals = await pool.query('SELECT * FROM deals WHERE contact_id=$1 ORDER BY created_at DESC', [req.params.id]);
    if (!contact.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...contact.rows[0], activities: activities.rows, deals: deals.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Agent activity feed
app.get('/api/activities', async (req, res) => {
  try {
    const { agent, type, limit = 100, offset = 0 } = req.query;
    let where = [], params = [], i = 1;
    if (agent) { where.push(`a.agent=$${i}`); params.push(agent); i++; }
    if (type) { where.push(`a.type=$${i}`); params.push(type); i++; }
    const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const q = `SELECT a.*, co.name as company_name, ct.first_name || ' ' || ct.last_name as contact_name
      FROM activities a LEFT JOIN companies co ON a.company_id=co.id LEFT JOIN contacts ct ON a.contact_id=ct.id
      ${wc} ORDER BY a.created_at DESC LIMIT $${i} OFFSET $${i+1}`;
    params.push(+limit, +offset);
    res.json({ rows: (await pool.query(q, params)).rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Untouched prospects
app.get('/api/untouched', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const q = `SELECT c.* FROM companies c WHERE NOT EXISTS (SELECT 1 FROM activities WHERE company_id=c.id)
      ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`;
    const total = await pool.query('SELECT count(*) FROM companies c WHERE NOT EXISTS (SELECT 1 FROM activities WHERE company_id=c.id)');
    res.json({ rows: (await pool.query(q, [+limit, +offset])).rows, total: +total.rows[0].count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Deals pipeline
app.get('/api/deals', async (req, res) => {
  try {
    const q = `SELECT d.*, co.name as company_name, ct.first_name || ' ' || ct.last_name as contact_name
      FROM deals d LEFT JOIN companies co ON d.company_id=co.id LEFT JOIN contacts ct ON d.contact_id=ct.id ORDER BY d.stage, d.updated_at DESC`;
    res.json({ rows: (await pool.query(q)).rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Filter options
app.get('/api/filters', async (req, res) => {
  try {
    const [industries, cities, agents, types] = await Promise.all([
      pool.query("SELECT DISTINCT industry FROM companies WHERE industry IS NOT NULL ORDER BY industry"),
      pool.query("SELECT DISTINCT city FROM companies WHERE city IS NOT NULL ORDER BY city"),
      pool.query("SELECT DISTINCT agent FROM activities WHERE agent IS NOT NULL ORDER BY agent"),
      pool.query("SELECT DISTINCT type FROM activities WHERE type IS NOT NULL ORDER BY type"),
    ]);
    res.json({
      industries: industries.rows.map(r=>r.industry),
      cities: cities.rows.map(r=>r.city),
      agents: agents.rows.map(r=>r.agent),
      activityTypes: types.rows.map(r=>r.type),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Quick actions
app.post('/api/activities', async (req, res) => {
  try {
    const { company_id, contact_id, deal_id, agent, type, subject, body, direction, status } = req.body;
    const r = await pool.query(
      `INSERT INTO activities (company_id,contact_id,deal_id,agent,type,subject,body,direction,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [company_id||null, contact_id||null, deal_id||null, agent||'dashboard', type, subject, body||null, direction||'outbound', status||'completed']
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/deals', async (req, res) => {
  try {
    const { company_id, contact_id, name, stage, value, currency } = req.body;
    const r = await pool.query(
      `INSERT INTO deals (company_id,contact_id,name,stage,value,currency) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [company_id||null, contact_id||null, name, stage||'prospect', value||0, currency||'USD']
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/deals/:id/stage', async (req, res) => {
  try {
    const r = await pool.query('UPDATE deals SET stage=$1, updated_at=now() WHERE id=$2 RETURNING *', [req.body.stage, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 3456;
app.listen(PORT, () => console.log(`AfrexAI CRM Dashboard running on http://localhost:${PORT}`));
