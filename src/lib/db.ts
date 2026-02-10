import { SEED_TASK, SEED_ARTEFACTS } from './seed-data';

// In-memory storage that works on Vercel (serverless)

interface Task {
  id: string;
  title: string;
  subject: string;
  criteria: string;
  description: string;
  created_at: string;
  created_by: string;
  // Teacher configuration options
  showReflections?: boolean;
  showReasoning?: boolean;
  showRankingAtEnd?: boolean;
  showGuidance?: boolean;
}

interface Artefact {
  id: string;
  task_id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

interface Judgement {
  id: string;
  task_id: string;
  artefact_a_id: string;
  artefact_b_id: string;
  chosen_id: string;
  reasoning: string;
  judge_id: string;
  time_taken_ms: number;
  created_at: string;
}

interface Judge {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

// In-memory data stores
const tasks: Map<string, Task> = new Map();
const artefacts: Map<string, Artefact> = new Map();
const judgements: Map<string, Judgement> = new Map();
const judges: Map<string, Judge> = new Map();

// Initialize with seed data
function initSeedData() {
  if (tasks.size === 0) {
    // Add the seed task with all settings
    tasks.set(SEED_TASK.id, {
      id: SEED_TASK.id,
      title: SEED_TASK.title,
      subject: SEED_TASK.subject,
      criteria: SEED_TASK.criteria,
      description: SEED_TASK.description,
      created_at: new Date().toISOString(),
      created_by: 'teacher',
      showReflections: SEED_TASK.showReflections,
      showReasoning: SEED_TASK.showReasoning,
      showRankingAtEnd: SEED_TASK.showRankingAtEnd,
      showGuidance: SEED_TASK.showGuidance,
    });
    
    // Add seed artefacts
    SEED_ARTEFACTS.forEach(a => {
      artefacts.set(a.id, {
        ...a,
        task_id: SEED_TASK.id,
        type: 'text',
        created_at: new Date().toISOString()
      });
    });
  }
}

// Initialize on module load
initSeedData();

// Helper functions
export function createTask(
  id: string, 
  title: string, 
  subject: string, 
  criteria: string, 
  description?: string,
  options?: {
    showReflections?: boolean;
    showReasoning?: boolean;
    showRankingAtEnd?: boolean;
    showGuidance?: boolean;
  }
) {
  tasks.set(id, {
    id,
    title,
    subject,
    criteria,
    description: description || '',
    created_at: new Date().toISOString(),
    created_by: 'teacher',
    showReflections: options?.showReflections ?? true,
    showReasoning: options?.showReasoning ?? true,
    showRankingAtEnd: options?.showRankingAtEnd ?? true,
    showGuidance: options?.showGuidance ?? true,
  });
}

export function getTasks() {
  initSeedData();
  return Array.from(tasks.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getTask(id: string) {
  initSeedData();
  return tasks.get(id);
}

export function createArtefact(id: string, taskId: string, title: string, content: string, type: string = 'text') {
  artefacts.set(id, {
    id,
    task_id: taskId,
    title,
    content,
    type,
    created_at: new Date().toISOString()
  });
}

export function getArtefacts(taskId: string) {
  initSeedData();
  return Array.from(artefacts.values())
    .filter(a => a.task_id === taskId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
  judgements.set(id, {
    id,
    task_id: taskId,
    artefact_a_id: artefactAId,
    artefact_b_id: artefactBId,
    chosen_id: chosenId,
    reasoning,
    judge_id: judgeId,
    time_taken_ms: timeTakenMs,
    created_at: new Date().toISOString()
  });
}

export function getJudgements(taskId: string) {
  return Array.from(judgements.values())
    .filter(j => j.task_id === taskId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getJudgeJudgements(judgeId: string, taskId: string) {
  return Array.from(judgements.values())
    .filter(j => j.judge_id === judgeId && j.task_id === taskId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createJudge(id: string, name: string, role: string = 'learner') {
  if (!judges.has(id)) {
    judges.set(id, {
      id,
      name,
      role,
      created_at: new Date().toISOString()
    });
  }
}

export function getJudge(id: string) {
  return judges.get(id);
}

// Get a random pair of artefacts the judge hasn't compared yet
export function getNextPair(taskId: string, judgeId: string): { a: Artefact; b: Artefact } | null {
  const taskArtefacts = getArtefacts(taskId);
  if (taskArtefacts.length < 2) return null;

  // Get all pairs this judge has already compared
  const judgeJudgements = getJudgeJudgements(judgeId, taskId);
  const comparedSet = new Set<string>();
  judgeJudgements.forEach(j => {
    comparedSet.add(`${j.artefact_a_id}-${j.artefact_b_id}`);
    comparedSet.add(`${j.artefact_b_id}-${j.artefact_a_id}`);
  });

  // Find an uncompared pair
  for (let i = 0; i < taskArtefacts.length; i++) {
    for (let j = i + 1; j < taskArtefacts.length; j++) {
      const key = `${taskArtefacts[i].id}-${taskArtefacts[j].id}`;
      if (!comparedSet.has(key)) {
        // Randomize order
        if (Math.random() > 0.5) {
          return { a: taskArtefacts[i], b: taskArtefacts[j] };
        } else {
          return { a: taskArtefacts[j], b: taskArtefacts[i] };
        }
      }
    }
  }

  return null; // All pairs compared
}

// Calculate basic stats for a task
export function getTaskStats(taskId: string) {
  const taskArtefacts = getArtefacts(taskId);
  const taskJudgements = getJudgements(taskId);
  
  const wins: Record<string, number> = {};
  const appearances: Record<string, number> = {};
  
  taskArtefacts.forEach(a => {
    wins[a.id] = 0;
    appearances[a.id] = 0;
  });
  
  taskJudgements.forEach(j => {
    wins[j.chosen_id] = (wins[j.chosen_id] || 0) + 1;
    appearances[j.artefact_a_id] = (appearances[j.artefact_a_id] || 0) + 1;
    appearances[j.artefact_b_id] = (appearances[j.artefact_b_id] || 0) + 1;
  });
  
  // Calculate win rate and include title
  const rankings = taskArtefacts.map(a => ({
    id: a.id,
    title: a.title,
    wins: wins[a.id] || 0,
    appearances: appearances[a.id] || 0,
    winRate: appearances[a.id] > 0 ? (wins[a.id] || 0) / appearances[a.id] : 0
  })).sort((a, b) => b.winRate - a.winRate);
  
  return {
    totalJudgements: taskJudgements.length,
    totalArtefacts: taskArtefacts.length,
    rankings
  };
}

export default { };
