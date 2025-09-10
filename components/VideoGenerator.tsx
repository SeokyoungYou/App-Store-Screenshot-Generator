
import React, { useState, useCallback, useEffect } from 'react';
import ImageInput from './ImageInput';
import Button from './Button';
import Spinner from './Spinner';
import { generatePromotionalVideo } from '../services/geminiService';

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

const VideoGenerator: React.FC = () => {
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null); // API download URI
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null); // Blob URL for the <video> tag
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null); // Store the actual video data
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);

  // When a new video is generated, this effect fetches the data
  // and prepares it for both preview and download.
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadVideo = async () => {
        if (generatedVideoUrl) {
            setIsPreviewLoading(true);
            setError(null);
            setVideoBlob(null);
            setVideoPreviewUrl(null);

            try {
                const response = await fetch(`${generatedVideoUrl}&key=${process.env.API_KEY}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch video data: ${response.statusText}`);
                }
                
                const blob = await response.blob();
                setVideoBlob(blob);
                
                objectUrl = window.URL.createObjectURL(blob);
                setVideoPreviewUrl(objectUrl);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Could not load the video preview.';
                console.error('Video preview failed:', err);
                setError(errorMessage);
            } finally {
                setIsPreviewLoading(false);
            }
        }
    };

    loadVideo();

    // Cleanup: revoke the object URL to prevent memory leaks
    return () => {
        if (objectUrl) {
            window.URL.revokeObjectURL(objectUrl);
        }
    };
  }, [generatedVideoUrl]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!screenshotFile) {
      setError('Please upload your promotional image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setVideoPreviewUrl(null);
    setVideoBlob(null);

    try {
        const { base64, mimeType } = await fileToBase64(screenshotFile);
        const videoUrl = await generatePromotionalVideo(
            base64,
            mimeType,
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
  }, [screenshotFile]);

  const handleDownloadVideo = async () => {
    if (!videoBlob) {
      setError("Video data not available. Please try generating the video again.");
      return;
    }
    setIsDownloadingVideo(true);
    setError(null);
    try {
      const url = window.URL.createObjectURL(videoBlob);
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
              <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Your Promotional Image</label>
              <p className="text-xs text-gray-400 mb-3">Upload an image that includes your app screenshot inside a device, along with any text overlays and background you want in the final video.</p>
              <ImageInput onFileChange={setScreenshotFile} />
            </div>

            <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700">
                <h3 className="font-semibold text-gray-200 mb-2">How it works</h3>
                <p className="text-sm text-gray-300">
                    This tool will animate your uploaded image. It will generate a short promotional video where the device in your image subtly rotates in 3D, like a professional ad. The background and text you've designed will remain static, creating a premium, dynamic effect.
                </p>
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={isLoading || !screenshotFile}>
                {isLoading ? <Spinner /> : '2. Generate Animated Video'}
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
                        
                        {isPreviewLoading && (
                          <div className="flex flex-col items-center justify-center text-center text-gray-400">
                            <Spinner large={true} />
                            <p className="mt-4 text-sm font-semibold text-gray-200">Loading Video Preview...</p>
                          </div>
                        )}
                        
                        {videoPreviewUrl && !isPreviewLoading && (
                          <>
                            <div className="w-full max-w-md rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                              <video
                                src={videoPreviewUrl}
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
                                  disabled={isDownloadingVideo || !videoBlob}
                                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  {isDownloadingVideo ? <><Spinner /> <span className="ml-2">Downloading...</span></> : 'Download Video (.mp4)'}
                              </button>
                            </div>
                          </>
                        )}
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
