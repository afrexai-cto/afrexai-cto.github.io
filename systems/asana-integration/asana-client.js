/**
 * Asana REST API Client
 * Uses native fetch (Node 18+). No external dependencies.
 * 
 * Asana API v1 Reference: https://developers.asana.com/reference/rest-api-reference
 * Base URL: https://app.asana.com/api/1.0
 * Auth: Bearer token (Personal Access Token)
 */

const fs = require('fs');
const path = require('path');

class AsanaClient {
  constructor(config = null) {
    if (!config) {
      config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
    }
    this.token = process.env.ASANA_PAT || config.asana.personalAccessToken;
    this.baseUrl = config.asana.baseUrl || 'https://app.asana.com/api/1.0';
    this.workspaceGid = config.asana.workspaceGid || '';
    this.config = config;
  }

  async _request(method, endpoint, body = null, query = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }

    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
      },
    };

    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify({ data: body });
    }

    const res = await fetch(url.toString(), opts);
    const json = await res.json();

    if (!res.ok) {
      const msg = json.errors ? json.errors.map(e => e.message).join('; ') : res.statusText;
      throw new Error(`Asana API ${method} ${endpoint} failed (${res.status}): ${msg}`);
    }

    return json.data;
  }

  // ── Workspaces ──
  // GET /workspaces
  async getWorkspaces() {
    return this._request('GET', '/workspaces');
  }

  // ── Projects ──
  // GET /projects?workspace={gid}
  async getProjects(workspaceGid = this.workspaceGid) {
    return this._request('GET', '/projects', null, {
      workspace: workspaceGid,
      opt_fields: 'name,gid,archived,created_at,modified_at,notes,color',
    });
  }

  // GET /projects/{project_gid}
  async getProject(projectGid) {
    return this._request('GET', `/projects/${projectGid}`, null, {
      opt_fields: 'name,gid,notes,archived,sections,created_at,modified_at',
    });
  }

  // GET /projects/{project_gid}/sections
  async getSections(projectGid) {
    return this._request('GET', `/projects/${projectGid}/sections`);
  }

  // ── Tasks ──
  // GET /tasks?project={gid}
  async getTasksForProject(projectGid, optFields = null) {
    const fields = optFields || 'name,gid,completed,assignee,due_on,notes,created_at,modified_at,memberships.section.name';
    return this._request('GET', '/tasks', null, {
      project: projectGid,
      opt_fields: fields,
    });
  }

  // GET /tasks/{task_gid}
  async getTask(taskGid) {
    return this._request('GET', `/tasks/${taskGid}`, null, {
      opt_fields: 'name,gid,notes,completed,assignee,due_on,projects,memberships.section.name,custom_fields,created_at,modified_at',
    });
  }

  // POST /tasks
  async createTask({ name, notes = '', projectGid, sectionGid, assignee, dueOn, customFields }) {
    const body = { name, notes };
    if (projectGid) body.projects = [projectGid];
    if (assignee) body.assignee = assignee;
    if (dueOn) body.due_on = dueOn;
    if (customFields) body.custom_fields = customFields;

    const task = await this._request('POST', '/tasks', body);

    // Move to section if specified (POST /sections/{section_gid}/addTask)
    if (sectionGid) {
      await this._request('POST', `/sections/${sectionGid}/addTask`, { task: task.gid });
    }

    return task;
  }

  // PUT /tasks/{task_gid} — used sparingly; prefer comments for updates
  async updateTask(taskGid, fields) {
    return this._request('PUT', `/tasks/${taskGid}`, fields);
  }

  // ── Stories (Comments) ──
  // GET /tasks/{task_gid}/stories — returns all stories (comments + system events)
  async getStories(taskGid) {
    return this._request('GET', `/tasks/${taskGid}/stories`, null, {
      opt_fields: 'gid,text,type,resource_subtype,created_at,created_by.name',
    });
  }

  // POST /tasks/{task_gid}/stories — add a comment
  async addComment(taskGid, text) {
    return this._request('POST', `/tasks/${taskGid}/stories`, { text });
  }

  // ── Search ──
  // GET /workspaces/{workspace_gid}/tasks/search
  async searchTasks(query, workspaceGid = this.workspaceGid) {
    return this._request('GET', `/workspaces/${workspaceGid}/tasks/search`, null, {
      'text': query,
      'opt_fields': 'name,gid,completed,assignee.name,due_on,notes',
    });
  }

  // ── Helpers ──
  async findProjectByName(name, workspaceGid = this.workspaceGid) {
    const projects = await this.getProjects(workspaceGid);
    return projects.find(p => p.name.toLowerCase() === name.toLowerCase());
  }

  async findSectionByName(projectGid, sectionName) {
    const sections = await this.getSections(projectGid);
    return sections.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
  }

  async resolveWorkspace() {
    if (this.workspaceGid) return this.workspaceGid;
    const workspaces = await this.getWorkspaces();
    if (workspaces.length === 0) throw new Error('No workspaces found');
    this.workspaceGid = workspaces[0].gid;
    return this.workspaceGid;
  }
}

module.exports = AsanaClient;
