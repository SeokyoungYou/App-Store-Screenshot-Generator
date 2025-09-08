
import React, { useState } from 'react';
import ScreenshotGenerator from './components/ScreenshotGenerator';
import VideoGenerator from './components/VideoGenerator';

const App: React.FC = () => {
  const [mode, setMode] = useState<'image' | 'video'>('image');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Media Generator
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Create stunning App Store screenshots or promotional videos with the power of Gemini.
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-1 flex space-x-1">
            <button
              onClick={() => setMode('image')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                mode === 'image' ? 'bg-purple-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Image Generator
            </button>
            <button
              onClick={() => setMode('video')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                mode === 'video' ? 'bg-purple-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              Video Generator
            </button>
          </div>
        </div>

        <main>
          {mode === 'image' ? <ScreenshotGenerator /> : <VideoGenerator />}
        </main>
        
        <footer className="text-center mt-12 text-gray-500">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
