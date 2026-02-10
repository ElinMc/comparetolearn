'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  subject: string;
  criteria: string;
  description: string;
  showReflections?: boolean;
  showReasoning?: boolean;
  showRankingAtEnd?: boolean;
  showGuidance?: boolean;
}

interface Artefact {
  id: string;
  title: string;
  content: string;
}

interface JudgementRecord {
  chosenId: string;
  artefactAId: string;
  artefactBId: string;
  reasoning: string;
  reflections: string[];
  timeTaken: number;
}

interface Ranking {
  id: string;
  title: string;
  wins: number;
  appearances: number;
  winRate: number;
}

// Default reflection options (can be customized by teachers in future)
const REFLECTION_OPTIONS = [
  { id: 'clarity', label: 'Clearer', icon: '💬' },
  { id: 'detail', label: 'More detail', icon: '🔍' },
  { id: 'structure', label: 'Better structure', icon: '📋' },
  { id: 'accuracy', label: 'More accurate', icon: '✓' },
  { id: 'voice', label: 'Stronger voice', icon: '✍️' },
  { id: 'understanding', label: 'Deeper understanding', icon: '💡' },
];

function JudgeContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get('task');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [judgeId, setJudgeId] = useState<string>('');
  const [judgeName, setJudgeName] = useState<string>('');
  const [isJudging, setIsJudging] = useState(false);
  const [pair, setPair] = useState<{ a: Artefact; b: Artefact } | null>(null);
  const [selected, setSelected] = useState<'a' | 'b' | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [selectedReflections, setSelectedReflections] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [judgementsCount, setJudgementsCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [judgementHistory, setJudgementHistory] = useState<JudgementRecord[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [calibrationScore, setCalibrationScore] = useState<number | null>(null);
  const [consensusData, setConsensusData] = useState<Record<string, number>>({});
  const [finalRankings, setFinalRankings] = useState<Ranking[]>([]);
  const [artefactTitles, setArtefactTitles] = useState<Record<string, string>>({});

  // Task settings with defaults
  const showReflections = selectedTask?.showReflections !== false;
  const showReasoning = selectedTask?.showReasoning !== false;
  const showRankingAtEnd = selectedTask?.showRankingAtEnd !== false;
  const showGuidance = selectedTask?.showGuidance !== false;

  useEffect(() => {
    let storedId = localStorage.getItem('judgeId');
    let storedName = localStorage.getItem('judgeName');
    if (!storedId) {
      storedId = 'judge-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('judgeId', storedId);
    }
    setJudgeId(storedId);
    if (storedName) setJudgeName(storedName);
    
    fetchTasks();
  }, []);

  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) setSelectedTask(task);
    }
  }, [taskId, tasks]);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data.tasks || []);
  };

  const fetchConsensus = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/stats`);
      const data = await res.json();
      const consensus: Record<string, number> = {};
      data.rankings?.forEach((r: { id: string; winRate: number }) => {
        consensus[r.id] = r.winRate;
      });
      setConsensusData(consensus);
      setFinalRankings(data.rankings || []);
    } catch (e) {
      console.error('Failed to fetch consensus', e);
    }
  };

  const fetchArtefactTitles = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/artefacts`);
      const data = await res.json();
      const titles: Record<string, string> = {};
      data.artefacts?.forEach((a: { id: string; title: string }) => {
        titles[a.id] = a.title;
      });
      setArtefactTitles(titles);
    } catch (e) {
      console.error('Failed to fetch artefacts', e);
    }
  };

  const calculateCalibration = (history: JudgementRecord[], consensus: Record<string, number>) => {
    if (history.length < 3 || Object.keys(consensus).length === 0) return null;
    
    let alignedCount = 0;
    history.forEach(j => {
      const chosenRate = consensus[j.chosenId] || 0;
      const otherRate = consensus[j.chosenId === j.artefactAId ? j.artefactBId : j.artefactAId] || 0;
      if (chosenRate >= otherRate) alignedCount++;
    });
    
    return Math.round((alignedCount / history.length) * 100);
  };

  const startJudging = async () => {
    if (!judgeName.trim()) return;
    localStorage.setItem('judgeName', judgeName);
    
    await fetch('/api/judges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: judgeId, name: judgeName })
    });
    
    if (selectedTask) {
      await fetchConsensus(selectedTask.id);
      await fetchArtefactTitles(selectedTask.id);
    }
    
    setIsJudging(true);
    fetchNextPair();
  };

  const fetchNextPair = async () => {
    if (!selectedTask) return;
    
    const res = await fetch(`/api/tasks/${selectedTask.id}/pair?judgeId=${judgeId}`);
    const data = await res.json();
    
    if (data.pair) {
      setPair(data.pair);
      setStartTime(Date.now());
      setSelected(null);
      setReasoning('');
      setSelectedReflections([]);
    } else {
      // Fetch final rankings before showing complete screen
      await fetchConsensus(selectedTask.id);
      setComplete(true);
    }
  };

  const toggleReflection = (id: string) => {
    setSelectedReflections(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const submitJudgement = async () => {
    if (!selected || !pair || !selectedTask) return;
    
    const timeTaken = Date.now() - startTime;
    const chosenId = selected === 'a' ? pair.a.id : pair.b.id;
    
    const record: JudgementRecord = {
      chosenId,
      artefactAId: pair.a.id,
      artefactBId: pair.b.id,
      reasoning,
      reflections: selectedReflections,
      timeTaken
    };
    const newHistory = [...judgementHistory, record];
    setJudgementHistory(newHistory);
    
    const newCalibration = calculateCalibration(newHistory, consensusData);
    setCalibrationScore(newCalibration);
    
    await fetch('/api/judgements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskId: selectedTask.id,
        artefactAId: pair.a.id,
        artefactBId: pair.b.id,
        chosenId,
        reasoning: `${reasoning} [Reflections: ${selectedReflections.join(', ')}]`,
        judgeId,
        timeTakenMs: timeTaken
      })
    });
    
    if (newHistory.length % 5 === 0) {
      await fetchConsensus(selectedTask.id);
    }
    
    setJudgementsCount(prev => prev + 1);
    fetchNextPair();
  };

  const getReflectionPatterns = () => {
    const counts: Record<string, number> = {};
    judgementHistory.forEach(j => {
      j.reflections.forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  // Task Selection
  if (!selectedTask) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-purple-600">
              CompareToLearn
            </Link>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              Learner View
            </span>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Task</h1>
          <p className="text-gray-600 mb-8">Select a comparison task to develop your assessment literacy</p>
          
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No tasks available yet. Ask your teacher to create one!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-xl shadow-sm p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-purple-500"
                >
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                    {task.subject}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 mt-2">{task.title}</h3>
                  <p className="text-gray-500 mt-1 text-sm">{task.criteria}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Name Entry
  if (!isJudging) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {selectedTask.subject}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">{selectedTask.title}</h1>
            <p className="text-gray-600 mt-2 text-sm">{selectedTask.criteria}</p>
          </div>
          
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What&apos;s your name?
            </label>
            <input
              type="text"
              value={judgeName}
              onChange={e => setJudgeName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              placeholder="Enter your name"
              onKeyDown={e => e.key === 'Enter' && startJudging()}
            />
          </div>
          
          <button
            onClick={startJudging}
            disabled={!judgeName.trim()}
            className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Comparing
          </button>
          
          <button
            onClick={() => setSelectedTask(null)}
            className="w-full mt-3 px-6 py-2 text-gray-500 hover:text-gray-700"
          >
            ← Choose a different task
          </button>
        </div>
      </main>
    );
  }

  // Complete - with rankings!
  if (complete) {
    const patterns = getReflectionPatterns();
    
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Amazing work, {judgeName}!</h1>
            <p className="text-gray-600 mb-4">
              You completed {judgementsCount} comparisons.
            </p>
          </div>

          {/* Final Rankings */}
          {showRankingAtEnd && finalRankings.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Final Rankings</h2>
              <p className="text-sm text-gray-500 mb-4">Based on all judgements so far:</p>
              <div className="space-y-2">
                {finalRankings.map((r, index) => (
                  <div 
                    key={r.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                      index === 1 ? 'bg-gray-50 border border-gray-200' :
                      index === 2 ? 'bg-orange-50 border border-orange-200' :
                      'bg-gray-50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium text-gray-900">
                      {artefactTitles[r.id] || `Work ${index + 1}`}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(r.winRate * 100)}% wins
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Compare your intuition with the rankings — did you spot the strongest work?
              </p>
            </div>
          )}

          {/* Growth Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📈 Your Assessment Literacy Growth</h2>
            
            {calibrationScore !== null && (
              <div className="mb-6 p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Calibration Score</span>
                  <span className="text-2xl font-bold text-purple-600">{calibrationScore}%</span>
                </div>
                <p className="text-sm text-gray-500">
                  How well your judgements align with the overall consensus
                </p>
                <div className="mt-2 h-3 bg-purple-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all"
                    style={{ width: `${calibrationScore}%` }}
                  />
                </div>
              </div>
            )}

            {patterns.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">🔍 What you noticed most:</h3>
                <div className="space-y-2">
                  {patterns.map(([id, count]) => {
                    const option = REFLECTION_OPTIONS.find(o => o.id === id);
                    return (
                      <div key={id} className="flex items-center gap-2 text-sm">
                        <span>{option?.icon}</span>
                        <span className="text-gray-600">{option?.label}</span>
                        <span className="text-gray-400">({count} times)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>💡 What you&apos;ve developed:</strong> Each comparison trained your eye to recognise quality. 
                You&apos;re now better at seeing what makes work strong — and you can apply this to your own work too.
              </p>
            </div>
          </div>

          <Link
            href="/judge"
            className="block w-full text-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Try Another Task
          </Link>
        </div>
      </main>
    );
  }

  // Progress Modal
  const ProgressModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Your Progress</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Comparisons made</span>
            <span className="text-xl font-bold text-purple-600">{judgementsCount}</span>
          </div>
          
          {calibrationScore !== null && (
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Calibration</span>
                <span className="text-xl font-bold text-purple-600">{calibrationScore}%</span>
              </div>
              <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${calibrationScore}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowProgress(false)}
          className="w-full mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Keep Going
        </button>
      </div>
    </div>
  );

  // Judging Interface
  return (
    <main className="min-h-screen bg-gray-100 pb-4">
      {showProgress && <ProgressModal />}
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">{selectedTask.subject}</span>
            <h1 className="font-semibold text-gray-900">{selectedTask.title}</h1>
          </div>
          <button
            onClick={() => setShowProgress(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <span className="text-lg">📊</span>
            <span className="text-sm font-medium">{judgementsCount}</span>
          </button>
        </div>
        <div className="bg-purple-50 px-4 py-2 border-t">
          <div className="max-w-7xl mx-auto">
            <span className="text-sm text-purple-700">
              <strong>Look for:</strong> {selectedTask.criteria}
            </span>
          </div>
        </div>
      </header>

      {/* Comparison Area */}
      {pair && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Instruction */}
          <div className="text-center mb-4">
            <p className="text-lg font-medium text-gray-700">Which piece of work is better?</p>
            <p className="text-sm text-gray-500">👆 Tap to select one</p>
          </div>
          
          {/* Two columns */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* Option A */}
            <div
              onClick={() => setSelected('a')}
              className={`bg-white rounded-xl p-4 cursor-pointer transition-all ${
                selected === 'a' 
                  ? 'ring-4 ring-purple-500 shadow-lg' 
                  : 'shadow-sm hover:shadow-md border-2 border-transparent hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                  Option A
                </span>
                {selected === 'a' && (
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                    ✓ Selected
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                <p className="whitespace-pre-wrap text-gray-700 text-sm">{pair.a.content}</p>
              </div>
            </div>

            {/* Option B */}
            <div
              onClick={() => setSelected('b')}
              className={`bg-white rounded-xl p-4 cursor-pointer transition-all ${
                selected === 'b' 
                  ? 'ring-4 ring-purple-500 shadow-lg' 
                  : 'shadow-sm hover:shadow-md border-2 border-transparent hover:border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  Option B
                </span>
                {selected === 'b' && (
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                    ✓ Selected
                  </span>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                <p className="whitespace-pre-wrap text-gray-700 text-sm">{pair.b.content}</p>
              </div>
            </div>
          </div>

          {/* Guidance for uncertain students */}
          {showGuidance && !selected && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                <strong>💡 Not sure which is better?</strong> That&apos;s okay! Trust your instinct — there&apos;s no wrong answer. 
                Think about: Which one would you be prouder to hand in? Which one explains things more clearly? 
                Even small differences count.
              </p>
            </div>
          )}

          {/* Submit section - only show reflections/reasoning if enabled */}
          <div className={`bg-white rounded-xl shadow-sm p-4 transition-opacity ${!selected ? 'opacity-50' : ''}`}>
            
            {/* Quick Reflections - optional */}
            {showReflections && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What made it better? <span className="text-gray-400">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REFLECTION_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => selected && toggleReflection(option.id)}
                      disabled={!selected}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                        selectedReflections.includes(option.id)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${!selected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span>{option.icon}</span>
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Written Reasoning - optional */}
            {showReasoning && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add more detail <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={reasoning}
                  onChange={e => setReasoning(e.target.value)}
                  disabled={!selected}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  rows={2}
                  placeholder={selected ? "What specifically made you choose this one?" : "Select an option first..."}
                />
              </div>
            )}

            <button
              onClick={submitJudgement}
              disabled={!selected}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selected ? 'Next Comparison →' : 'Select an option above'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function JudgePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    }>
      <JudgeContent />
    </Suspense>
  );
}
