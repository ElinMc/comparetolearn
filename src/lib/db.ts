import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'comparetolearn.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    criteria TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'teacher'
  );

  CREATE TABLE IF NOT EXISTS artefacts (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS judgements (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    artefact_a_id TEXT NOT NULL,
    artefact_b_id TEXT NOT NULL,
    chosen_id TEXT NOT NULL,
    reasoning TEXT,
    judge_id TEXT NOT NULL,
    time_taken_ms INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (artefact_a_id) REFERENCES artefacts(id),
    FOREIGN KEY (artefact_b_id) REFERENCES artefacts(id),
    FOREIGN KEY (chosen_id) REFERENCES artefacts(id)
  );

  CREATE TABLE IF NOT EXISTS judges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'learner',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;

// Helper functions
export function createTask(id: string, title: string, subject: string, criteria: string, description?: string) {
  const stmt = db.prepare('INSERT INTO tasks (id, title, subject, criteria, description) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, title, subject, criteria, description || '');
}

export function getTasks() {
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}

export function getTask(id: string) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function createArtefact(id: string, taskId: string, title: string, content: string, type: string = 'text') {
  const stmt = db.prepare('INSERT INTO artefacts (id, task_id, title, content, type) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, taskId, title, content, type);
}

export function getArtefacts(taskId: string) {
  return db.prepare('SELECT * FROM artefacts WHERE task_id = ? ORDER BY created_at').all(taskId);
}

export function createJudgement(
  id: string,
  taskId: string,
  artefactAId: string,
  artefactBId: string,
  chosenId: string,
  reasoning: string,
  judgeId: string,
  timeTakenMs: number
) {
  const stmt = db.prepare(
    'INSERT INTO judgements (id, task_id, artefact_a_id, artefact_b_id, chosen_id, reasoning, judge_id, time_taken_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, taskId, artefactAId, artefactBId, chosenId, reasoning, judgeId, timeTakenMs);
}

export function getJudgements(taskId: string) {
  return db.prepare('SELECT * FROM judgements WHERE task_id = ? ORDER BY created_at DESC').all(taskId);
}

export function getJudgeJudgements(judgeId: string, taskId: string) {
  return db.prepare('SELECT * FROM judgements WHERE judge_id = ? AND task_id = ? ORDER BY created_at DESC').all(judgeId, taskId);
}

export function createJudge(id: string, name: string, role: string = 'learner') {
  const stmt = db.prepare('INSERT OR IGNORE INTO judges (id, name, role) VALUES (?, ?, ?)');
  stmt.run(id, name, role);
}

export function getJudge(id: string) {
  return db.prepare('SELECT * FROM judges WHERE id = ?').get(id);
}

// Get a random pair of artefacts the judge hasn't compared yet
export function getNextPair(taskId: string, judgeId: string): { a: unknown; b: unknown } | null {
  const artefacts = getArtefacts(taskId) as { id: string }[];
  if (artefacts.length < 2) return null;

  // Get all pairs this judge has already compared
  const compared = db.prepare(`
    SELECT artefact_a_id, artefact_b_id FROM judgements 
    WHERE task_id = ? AND judge_id = ?
  `).all(taskId, judgeId) as { artefact_a_id: string; artefact_b_id: string }[];

  const comparedSet = new Set<string>();
  compared.forEach(j => {
    comparedSet.add(`${j.artefact_a_id}-${j.artefact_b_id}`);
    comparedSet.add(`${j.artefact_b_id}-${j.artefact_a_id}`);
  });

  // Find an uncompared pair
  for (let i = 0; i < artefacts.length; i++) {
    for (let j = i + 1; j < artefacts.length; j++) {
      const key = `${artefacts[i].id}-${artefacts[j].id}`;
      if (!comparedSet.has(key)) {
        // Randomize order
        if (Math.random() > 0.5) {
          return { a: artefacts[i], b: artefacts[j] };
        } else {
          return { a: artefacts[j], b: artefacts[i] };
        }
      }
    }
  }

  return null; // All pairs compared
}

// Calculate basic stats for a task
export function getTaskStats(taskId: string) {
  const artefacts = getArtefacts(taskId) as { id: string }[];
  const judgements = getJudgements(taskId) as { chosen_id: string; artefact_a_id: string; artefact_b_id: string }[];
  
  const wins: Record<string, number> = {};
  const appearances: Record<string, number> = {};
  
  artefacts.forEach(a => {
    wins[a.id] = 0;
    appearances[a.id] = 0;
  });
  
  judgements.forEach(j => {
    wins[j.chosen_id]++;
    appearances[j.artefact_a_id]++;
    appearances[j.artefact_b_id]++;
  });
  
  // Calculate win rate
  const rankings = artefacts.map(a => ({
    id: a.id,
    wins: wins[a.id],
    appearances: appearances[a.id],
    winRate: appearances[a.id] > 0 ? wins[a.id] / appearances[a.id] : 0
  })).sort((a, b) => b.winRate - a.winRate);
  
  return {
    totalJudgements: judgements.length,
    totalArtefacts: artefacts.length,
    rankings
  };
}
