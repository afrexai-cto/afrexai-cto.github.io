/**
 * Todoist Sync - Creates tasks in Todoist for approved action items.
 * Only syncs items with status 'approved' and no existing todoist_task_id.
 */
import { getDb, initDb } from './db.js';
import config from './config.json' with { type: 'json' };

class TodoistClient {
  constructor(apiKey, baseUrl, projectId) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.projectId = projectId;
  }

  async createTask({ content, description, dueDate, priority }) {
    // STUB: POST {baseUrl}/tasks
    // Headers: Authorization: Bearer {apiKey}
    console.log(`[todoist] Would create task: "${content}"`);
    return { id: `stub_${Date.now()}` };
  }

  async completeTask(taskId) {
    // STUB: POST {baseUrl}/tasks/{taskId}/close
    console.log(`[todoist] Would complete task: ${taskId}`);
    return true;
  }

  async getTask(taskId) {
    // STUB: GET {baseUrl}/tasks/{taskId}
    console.log(`[todoist] Would fetch task: ${taskId}`);
    return { id: taskId, is_completed: false };
  }
}

export async function syncApprovedItems() {
  const db = initDb();
  const client = new TodoistClient(config.todoist.apiKey, config.todoist.baseUrl, config.todoist.projectId);

  const approved = db.prepare(`
    SELECT ai.*, m.title as meeting_title
    FROM action_items ai
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.status = 'approved' AND ai.todoist_task_id IS NULL AND ai.ownership = 'mine'
  `).all();

  let synced = 0;
  for (const item of approved) {
    try {
      const task = await client.createTask({
        content: item.description,
        description: `From meeting: ${item.meeting_title || 'Unknown'}`,
        dueDate: item.due_date,
        priority: Math.min(4, item.priority + 1),
      });

      db.prepare('UPDATE action_items SET todoist_task_id = ?, status = \'in_progress\', updated_at = datetime(\'now\') WHERE id = ?')
        .run(task.id, item.id);
      synced++;
    } catch (err) {
      console.error(`[todoist] Failed to sync ${item.id}:`, err.message);
    }
  }

  return { synced, total: approved.length };
}

export async function checkTaskCompletion() {
  const db = initDb();
  const client = new TodoistClient(config.todoist.apiKey, config.todoist.baseUrl, config.todoist.projectId);

  const inProgress = db.prepare(`
    SELECT * FROM action_items WHERE status = 'in_progress' AND todoist_task_id IS NOT NULL
  `).all();

  let completed = 0;
  for (const item of inProgress) {
    try {
      const task = await client.getTask(item.todoist_task_id);
      if (task.is_completed) {
        db.prepare('UPDATE action_items SET status = \'done\', updated_at = datetime(\'now\') WHERE id = ?')
          .run(item.id);
        completed++;
      }
    } catch (err) {
      console.error(`[todoist] Check failed for ${item.id}:`, err.message);
    }
  }

  return { completed, checked: inProgress.length };
}

export default { syncApprovedItems, checkTaskCompletion };
