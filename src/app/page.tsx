import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            CompareToLearn
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Develop your assessment literacy by comparing work and discovering what quality looks like.
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Teacher Card */}
          <Link href="/teacher" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-indigo-500 transition-all duration-300 hover:shadow-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors">
                <svg className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m a Teacher</h2>
              <p className="text-gray-600">
                Create comparison tasks, upload artefacts, and view how learners develop assessment literacy.
              </p>
            </div>
          </Link>

          {/* Learner Card */}
          <Link href="/judge" className="group">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-purple-500 transition-all duration-300 hover:shadow-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
                <svg className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m a Learner</h2>
              <p className="text-gray-600">
                Compare pieces of work, explain your reasoning, and develop your understanding of quality.
              </p>
            </div>
          </Link>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Compare</h3>
              <p className="text-sm text-gray-600">See two pieces of work side by side</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Decide</h3>
              <p className="text-sm text-gray-600">Choose which one is better quality</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-pink-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Reflect</h3>
              <p className="text-sm text-gray-600">Explain your reasoning to build insight</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Adaptive Comparative Judgement for Assessment Literacy</p>
          <p className="mt-1">Built by Bantani Education</p>
        </div>
      </div>
    </main>
  );
}
