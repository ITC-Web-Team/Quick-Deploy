import React, { useState } from 'react';
import DeployForm from './components/DeployForm';
import SitesList from './components/SitesList';
import { Rocket, Sparkles } from 'lucide-react';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeploySuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b-2 border-amber-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-3 shadow-lg rotate-3 hover:rotate-6 transition-transform">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                  WebDeploy ✨
                </h1>
                <p className="text-sm text-amber-700">by GnaanU x ITC</p>
              </div>
            </div>
            
            <div className="hidden sm:block text-right">
              <p className="text-sm text-amber-600">Built by</p>
              <p className="text-base font-semibold text-amber-800">ITC Web Team 🚀</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold text-amber-900 mb-4">
            Upload. Deploy. Share! 
            <span className="inline-block animate-bounce ml-2">🎉</span>
          </h2>
          <p className="text-amber-700 text-lg max-w-xl mx-auto">
            Turn your HTML, CSS & JavaScript files into a real website in seconds!
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Deploy Form */}
          <div className="lg:col-span-2">
            <DeployForm onSuccess={handleDeploySuccess} />
          </div>

          {/* Sites List */}
          <div className="lg:col-span-3">
            <SitesList
              refreshTrigger={refreshKey}
              onRefreshComplete={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Fun Footer */}
      <footer className="mt-12 py-6 text-center bg-gradient-to-r from-amber-100 to-orange-100 border-t-2 border-amber-200">
        <p className="text-amber-700 text-sm">
          © 2025 GnaanU x ITC • Made with 💛 by ITC Web Team
        </p>
        <p className="text-xs text-amber-600 mt-1">Keep coding, keep creating! 🌟</p>
      </footer>
    </div>
  );
}

export default App;
