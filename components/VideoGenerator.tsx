
import React, { useState, useCallback } from 'react';
import ImageInput from './ImageInput';
import TextAreaInput from './TextAreaInput';
import Button from './Button';
import Spinner from './Spinner';
import { generatePromotionalVideo, enhanceVideoPrompt } from '../services/geminiService';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error("Failed to extract base64 from file."));
        return;
      }
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Japanese', label: '日本語' },
    { value: 'Korean', label: '한국어' },
    { value: 'Chinese (Simplified)', label: '简体中文' },
];

const VideoGenerator: React.FC = () => {
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [sceneDescription, setSceneDescription] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);

  // New state for prompt enhancement
  const [language, setLanguage] = useState<string>('English');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  
  const handleEnhancePrompt = useCallback(async () => {
    if (!sceneDescription.trim()) {
      setEnhanceError("Please describe the video scene first.");
      return;
    }
    setIsEnhancingPrompt(true);
    setEnhanceError(null);
    setError(null); // Also clear main error
    try {
      const enhancedPrompt = await enhanceVideoPrompt(sceneDescription, language);
      setSceneDescription(enhancedPrompt);
    } catch (err) {
      console.error(err);
      setEnhanceError(err instanceof Error ? err.message : 'Failed to enhance prompt.');
    } finally {
      setIsEnhancingPrompt(false);
    }
  }, [sceneDescription, language]);


  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!screenshotFile) {
      setError('Please upload a screenshot.');
      return;
    }
    if (!sceneDescription.trim()) {
        setError('Please describe the video you want to create.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setEnhanceError(null);
    setGeneratedVideoUrl(null);

    try {
        const { base64, mimeType } = await fileToBase64(screenshotFile);
        const videoUrl = await generatePromotionalVideo(
            base64,
            mimeType,
            sceneDescription,
            (message) => setLoadingMessage(message)
        );
        setGeneratedVideoUrl(videoUrl);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred during video generation.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [screenshotFile, sceneDescription]);

  const handleDownloadVideo = async () => {
    if (!generatedVideoUrl) return;
    setIsDownloadingVideo(true);
    setError(null);
    try {
      const response = await fetch(`${generatedVideoUrl}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'promo-video.mp4';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not download the video.';
      console.error('Video download failed:', err);
      setError(errorMessage);
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-gray-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Your App Screenshot</label>
              <ImageInput onFileChange={setScreenshotFile} />
            </div>

            <div>
              <TextAreaInput
                id="sceneDescription"
                label="2. Describe the Video Scene & Enhance Prompt"
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                placeholder="e.g., Animate the chart smoothly showing growing data, with a zoom-in effect on the final number."
                rows={5}
                cornerComponent={(<select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-gray-900/70 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 px-2 py-1 text-xs transition"
                      aria-label="Select your input language"
                  >
                      {languageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>)
                }
              />
               <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt || !sceneDescription.trim()}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                >
                  {isEnhancingPrompt ? <><Spinner /> <span className="ml-2">Enhancing...</span></> : 'Enhance Prompt'}
                </button>
              </div>
              {enhanceError && <p className="mt-2 text-sm text-red-400">{enhanceError}</p>}
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={isLoading || !screenshotFile || !sceneDescription.trim()}>
                {isLoading ? <Spinner /> : '3. Generate Video'}
              </Button>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col min-h-[400px] lg:min-h-[550px] lg:flex-grow border border-gray-700">
              {isLoading ? (
                  <div className="h-full flex-grow flex flex-col items-center justify-center text-center text-gray-400">
                      <Spinner large={true} />
                      <p className="mt-4 text-lg font-semibold text-gray-200">Generating Your Video...</p>
                      <p className="mt-2 text-sm text-gray-300">{loadingMessage}</p>
                      <p className="mt-4 text-xs text-gray-500">This process can take several minutes. Please don't close this window.</p>
                  </div>
              ) : (
                <div className="flex-grow min-h-0 flex flex-col items-center justify-center">
                    {generatedVideoUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <h3 className="text-lg font-semibold mb-4 text-center text-gray-200">Generated Video</h3>
                        <div className="w-full max-w-md rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                          <video
                            src={`${generatedVideoUrl}&key=${process.env.API_KEY}`}
                            controls
                            className="w-full"
                            aria-label="Generated promotional video"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        <div className="mt-4 w-full max-w-md">
                          <button
                              onClick={handleDownloadVideo}
                              disabled={isDownloadingVideo}
                              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {isDownloadingVideo ? <><Spinner /> <span className="ml-2">Downloading...</span></> : 'Download Video (.mp4)'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-gray-500">
                          {error ? (
                          <p className="text-red-400">{error}</p>
                          ) : (
                          <p>Your generated video will appear here.</p>
                          )}
                      </div>
                    )}
                </div>
              )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default VideoGenerator;
