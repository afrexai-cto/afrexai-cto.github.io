/**
 * Asana client - creates structured task cards in the Video Pipeline project.
 * Uses Asana REST API v1: POST /tasks
 */
const config = require('./config.json');

const ASANA_BASE = 'https://app.asana.com/api/1.0';

async function asanaFetch(method, endpoint, body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.ASANA_ACCESS_TOKEN || config.asana.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify({ data: body });

  const resp = await fetch(`${ASANA_BASE}${endpoint}`, opts);
  if (!resp.ok) {
    throw new Error(`Asana API ${resp.status}: ${await resp.text()}`);
  }
  return resp.json();
}

/**
 * Create a video idea card in Asana.
 * Returns { gid, permalink_url }
 */
async function createVideoIdeaCard({
  idea,
  researchFindings,
  kbSources,
  suggestedAngles,
  slackUser,
  slackChannel,
}) {
  // Build rich notes in HTML format (Asana supports html_notes)
  const htmlNotes = `
<body>
  <h2>Video Idea</h2>
  <p>${escapeHtml(idea)}</p>

  <h2>Research Findings</h2>
  <p><strong>Tweets analyzed:</strong> ${researchFindings.tweetCount || 0}</p>
  <p><strong>Themes:</strong> ${(researchFindings.themes || []).join(', ') || 'None found'}</p>
  ${researchFindings.topTweet ? `<p><strong>Top tweet:</strong> ${escapeHtml(researchFindings.topTweet.text)}</p>` : ''}

  <h2>Related Knowledge Base Sources</h2>
  <ul>
    ${(kbSources || []).map(s => `<li><a href="${s.url || '#'}">${escapeHtml(s.title)}</a> (${(s.similarity * 100).toFixed(0)}% relevant)</li>`).join('\n    ')}
  </ul>
  ${kbSources.length === 0 ? '<p>No related content found in knowledge base.</p>' : ''}

  <h2>Suggested Angles</h2>
  <ul>
    ${suggestedAngles.map(a => `<li>${escapeHtml(a)}</li>`).join('\n    ')}
  </ul>

  <hr>
  <p><em>Submitted by Slack user ${slackUser || 'unknown'} in channel ${slackChannel || 'unknown'}</em></p>
</body>`.trim();

  const taskData = {
    name: `🎬 Video Idea: ${idea.slice(0, 100)}`,
    html_notes: htmlNotes,
    projects: [process.env.ASANA_PROJECT_GID || config.asana.projectGid],
    workspace: process.env.ASANA_WORKSPACE_GID || config.asana.workspaceGid,
    custom_fields: {},
  };

  const result = await asanaFetch('POST', '/tasks', taskData);
  const task = result.data;

  return {
    gid: task.gid,
    url: task.permalink_url || `https://app.asana.com/0/${config.asana.projectGid}/${task.gid}`,
  };
}

/** Get a task by GID */
async function getTask(taskGid) {
  const result = await asanaFetch('GET', `/tasks/${taskGid}`);
  return result.data;
}

/** Update task (e.g., mark complete, change section) */
async function updateTask(taskGid, fields) {
  const result = await asanaFetch('PUT', `/tasks/${taskGid}`, fields);
  return result.data;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { createVideoIdeaCard, getTask, updateTask };
