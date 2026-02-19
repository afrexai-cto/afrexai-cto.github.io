import { readFile } from 'fs/promises';

export async function getTasks(config, targetDate) {
  const data = JSON.parse(await readFile(new URL(`../${config.path}`, import.meta.url), 'utf8'));
  const dateStr = targetDate.toISOString().slice(0, 10);
  const pending = data.tasks.filter(t => t.status === 'pending' && t.due <= dateStr);
  const overdue = data.tasks.filter(t => t.status === 'overdue' || (t.status === 'pending' && t.due < dateStr));
  const waiting = data.tasks.filter(t => t.status === 'waiting');
  const upcoming = data.tasks.filter(t => t.status === 'pending' && t.due > dateStr && t.due <= addDays(dateStr, 3));
  return { pending, overdue, waiting, upcoming };
}

function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
