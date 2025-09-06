import React, { useState, useCallback } from 'react';
import ImageInput from './ImageInput';
import TextInput from './TextInput';
import TextAreaInput from './TextAreaInput';
import Button from './Button';
import GeneratedImage from './GeneratedImage';
import Spinner from './Spinner';
import ColorInput from './ColorInput';
import { generateScreenshot, generateTextOverlays } from '../services/geminiService';
import { getImageDimensions } from '../utils/imageUtils';

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

type PresetOption = {
  value: string;
  label: string;
  details?: string;
  isLandscape?: boolean;
};

// New preset options with more metadata for richer UI
const presetOptions: PresetOption[] = [
  { value: '1290x2796', label: 'iPhone', details: '6.9"', isLandscape: false },
  { value: '2796x1290', label: 'iPhone', details: '6.9"', isLandscape: true },
  { value: '2048x2732', label: 'iPad', details: '12.9"', isLandscape: false },
  { value: '2732x2048', label: 'iPad', details: '12.9"', isLandscape: true },
  { value: '1620x2880', label: '9:16' },
  { value: '2880x1620', label: '16:9' },
  { value: '2160x2880', label: '3:4' },
  { value: '2880x2160', label: '4:3' },
  { value: '2880x2880', label: '1:1' },
];

// Helper component for rendering aspect ratio icons
const RatioIcon: React.FC<{ ratio: string }> = ({ ratio }) => {
  const styles: { [key: string]: string } = {
    '9:16': 'w-4 h-7',
    '16:9': 'w-7 h-4',
    '3:4': 'w-5 h-6',
    '4:3': 'w-6 h-5',
    '1:1': 'w-6 h-6',
  };
  return <div className={`${styles[ratio] || 'w-6 h-6'} rounded-sm bg-current`} />;
};

// Helper component for rendering device icons with screen size
const DeviceIcon: React.FC<{ isLandscape: boolean }> = ({ isLandscape }) => {
  const containerClasses = isLandscape ? 'w-10 h-7' : 'w-7 h-10';
  return (
    <div className={`border-2 border-current rounded-md ${containerClasses}`}></div>
  );
};

interface GeneratedImageData {
    base64: string;
    actualWidth: number;
    actualHeight: number;
}

const ScreenshotGenerator: React.FC = () => {
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [appFeatures, setAppFeatures] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [subheadline, setSubheadline] = useState<string>('');
  const [width, setWidth] = useState('1290');
  const [height, setHeight] = useState('2796');
  const [backgroundColor, setBackgroundColor] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);

  const handleGenerateText = useCallback(async () => {
    if (!appFeatures.trim()) {
      setTextError("Please describe a feature first.");
      return;
    }
    setIsGeneratingText(true);
    setTextError(null);
    try {
      const { headline: newHeadline, subheadline: newSubheadline } = await generateTextOverlays(appFeatures);
      setHeadline(newHeadline);
      setSubheadline(newSubheadline);
    } catch (err) {
      console.error(err);
      setTextError(err instanceof Error ? err.message : 'Failed to generate text.');
    } finally {
      setIsGeneratingText(false);
    }
  }, [appFeatures]);


  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!screenshotFile) {
      setError('Please upload a screenshot to improve.');
      return;
    }
    if (!appFeatures.trim()) {
      setError('Please describe your app\'s key features.');
      return;
    }
    
    const targetWidth = Number(width);
    const targetHeight = Number(height);
    if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
        setError('Please enter valid, positive numeric values for resolution.');
        return;
    }
    
    // The user-selected final resolution
    const targetResolution = `${targetWidth}x${targetHeight}`;
    
    // The resolution for the AI model (1/3 size) for faster, more reliable generation
    const generationWidth = Math.round(targetWidth / 3);
    const generationHeight = Math.round(targetHeight / 3);
    const generationResolution = `${generationWidth}x${generationHeight}`;


    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const { base64, mimeType } = await fileToBase64(screenshotFile);
      
      const resultBase64 = await generateScreenshot(
        base64,
        mimeType,
        headline,
        subheadline,
        appFeatures,
        generationResolution, // Generate at 1/3 resolution
        targetResolution, // Pass full resolution for device detection
        backgroundColor
      );
      
      const { width: actualWidth, height: actualHeight } = await getImageDimensions(resultBase64);

      setGeneratedImage({
        base64: resultBase64,
        actualWidth,
        actualHeight,
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the image.');
    } finally {
      setIsLoading(false);
    }
  }, [screenshotFile, appFeatures, headline, subheadline, width, height, backgroundColor]);

  const finalResolution = `${width}x${height}`;

  const handlePresetChange = (value: string) => {
    const [w, h] = value.split('x');
    setWidth(w || '');
    setHeight(h || '');
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">1. Upload Your App Screenshot</label>
              <ImageInput onFileChange={setScreenshotFile} />
            </div>

             <div>
                {/* Fix: Passed label as a prop to TextAreaInput to satisfy its type requirements, resolving the missing property error. */}
                <TextAreaInput
                    id="features"
                    label="2. Describe Feature &amp; Generate Text"
                    value={appFeatures}
                    onChange={(e) => setAppFeatures(e.target.value)}
                    placeholder="Describe the feature shown. AI will generate text from this."
                    required
                />
                <div className="mt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={handleGenerateText}
                        disabled={isGeneratingText || !appFeatures.trim()}
                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                    >
                        {isGeneratingText ? <><Spinner /> <span className="ml-2">Generating...</span></> : 'Generate Text'}
                    </button>
                </div>
                {textError && <p className="mt-2 text-sm text-red-400">{textError}</p>}
                
                <div className="mt-4 space-y-4">
                  <TextInput
                    id="headline"
                    label="Headline"
                    placeholder="A key feature."
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    required
                  />
                  <TextInput
                    id="subheadline"
                    label="Sub-headline (Optional)"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    placeholder="A compelling one-liner about this feature."
                  />
                </div>
            </div>
            
            <div>
              <ColorInput
                id="backgroundColor"
                label="3. Set Solid Background Color (Optional)"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">4. Select Output Size</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                {presetOptions.map(opt => {
                  const isActive = `${width}x${height}` === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePresetChange(opt.value)}
                      className={`flex flex-col items-center justify-center text-center p-2 rounded-md border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 space-y-2 h-full
                        ${isActive 
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'
                        }`
                      }
                    >
                      <div className="h-10 flex items-center justify-center">
                        {opt.details ? (
                           <DeviceIcon isLandscape={opt.isLandscape as boolean} />
                        ) : (
                           <RatioIcon ratio={opt.label} />
                        )}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-semibold block text-xs">
                           {opt.details ? `${opt.label} ${opt.details}` : opt.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <TextInput
                      id="width"
                      label="Width (px)"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="e.g., 1290"
                      required
                  />
                  <TextInput
                      id="height"
                      label="Height (px)"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g., 2796"
                      required
                  />
              </div>
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={isLoading || !screenshotFile || !appFeatures}>
                {isLoading ? <Spinner /> : '5. Generate Screenshot'}
              </Button>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-center min-h-[300px] md:min-h-full border border-gray-700">
            {isLoading && (
              <div className="flex flex-col items-center text-center">
                  <Spinner large={true} />
                  <p className="mt-4 text-gray-400">Generating your screenshot...</p>
                  <p className="text-xs text-gray-500 mt-2">This may take a moment.</p>
              </div>
            )}
            {error && !isLoading && <p className="text-red-400 text-center">{error}</p>}
            {generatedImage && (
              <GeneratedImage 
                base64Image={generatedImage.base64} 
                requestedResolution={finalResolution}
                actualWidth={generatedImage.actualWidth}
                actualHeight={generatedImage.actualHeight}
              />
            )}
            {!isLoading && !generatedImage && !error && (
                <div className="text-center text-gray-500">
                    <p>Your generated screenshot will appear here.</p>
                </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ScreenshotGenerator;