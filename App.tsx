
import React from 'react';
import ScreenshotGenerator from './components/ScreenshotGenerator';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            App Store Screenshot Generator
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Create stunning, compliant App Store screenshots with the power of Gemini.
          </p>
        </header>
        <main>
          <ScreenshotGenerator />
        </main>
        <footer className="text-center mt-12 text-gray-500">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
