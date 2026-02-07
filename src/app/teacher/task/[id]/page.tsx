'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  subject: string;
  criteria: string;
  description: string;
}

interface Artefact {
  id: string;
  title: string;
  content: string;
  type: string;
}

interface Ranking {
  id: string;
  wins: number;
  appearances: number;
  winRate: number;
}

interface Stats {
  totalJudgements: number;
  totalArtefacts: number;
  rankings: Ranking[];
}

export default function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showAddArtefact, setShowAddArtefact] = useState(false);
  const [newArtefact, setNewArtefact] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const [taskRes, artefactsRes, statsRes] = await Promise.all([
      fetch(`/api/tasks/${id}`),
      fetch(`/api/tasks/${id}/artefacts`),
      fetch(`/api/tasks/${id}/stats`)
    ]);
    
    const taskData = await taskRes.json();
    const artefactsData = await artefactsRes.json();
    const statsData = await statsRes.json();
    
    setTask(taskData.task);
    setArtefacts(artefactsData.artefacts || []);
    setStats(statsData);
  };

  const addArtefact = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/tasks/${id}/artefacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArtefact)
    });
    setNewArtefact({ title: '', content: '' });
    setShowAddArtefact(false);
    fetchData();
  };

  const getArtefactTitle = (artefactId: string) => {
    const artefact = artefacts.find(a => a.id === artefactId);
    return artefact?.title || 'Unknown';
  };

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/judge?task=${id}` 
    : '';

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher" className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="text-xl font-bold text-indigo-600">CompareToLearn</span>
          </div>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            Teacher View
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Task Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-sm font-medium">
                {task.subject}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{task.title}</h1>
              <p className="text-gray-600 mt-2">{task.criteria}</p>
              {task.description && (
                <p className="text-gray-500 mt-2 text-sm">{task.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{stats?.totalJudgements || 0}</div>
              <div className="text-sm text-gray-500">judgements</div>
            </div>
          </div>

          {/* Share Link */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share this link with learners:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Artefacts */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Artefacts ({artefacts.length})</h2>
              <button
                onClick={() => setShowAddArtefact(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            {artefacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No artefacts yet. Add at least 2 to enable judging.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {artefacts.map((artefact, index) => (
                  <div key={artefact.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">{artefact.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{artefact.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rankings */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Rankings</h2>
            
            {!stats || stats.rankings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Rankings will appear after judgements are made.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.rankings.map((ranking, index) => (
                  <div key={ranking.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{getArtefactTitle(ranking.id)}</div>
                      <div className="text-sm text-gray-500">
                        {ranking.wins} wins / {ranking.appearances} comparisons
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-indigo-600">
                        {Math.round(ranking.winRate * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">win rate</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Artefact Modal */}
      {showAddArtefact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Add Artefact</h2>
            <form onSubmit={addArtefact}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title / Label</label>
                  <input
                    type="text"
                    value={newArtefact.title}
                    onChange={e => setNewArtefact({ ...newArtefact, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Sample A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newArtefact.content}
                    onChange={e => setNewArtefact({ ...newArtefact, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={8}
                    placeholder="Paste or type the work sample here..."
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddArtefact(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Artefact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
