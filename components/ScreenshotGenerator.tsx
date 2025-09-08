
import React, { useState, useCallback, useEffect } from 'react';
import ImageInput from './ImageInput';
import TextInput from './TextInput';
import TextAreaInput from './TextAreaInput';
import Button from './Button';
import GeneratedImage from './GeneratedImage';
import Spinner from './Spinner';
import ColorInput from './ColorInput';
import { generateScreenshot, generateTextOverlays } from '../services/geminiService';
import { getImageDimensions, resizeImageBase64 } from '../utils/imageUtils';

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

type Purpose = 'app-store' | 'social-media' | 'og-image' | 'custom';

const purposeOptions: { id: Purpose; label: string; description: string }[] = [
    { id: 'app-store', label: 'App Store', description: 'iPhone & iPad screenshots' },
    { id: 'social-media', label: 'Social Media', description: 'Posts for Instagram, X, etc.' },
    { id: 'og-image', label: 'OG Image', description: 'Link previews for websites' },
    { id: 'custom', label: 'Custom', description: 'Manually configure images' }
];

type SocialPlatform = 'instagram-post' | 'instagram-story' | 'x-threads';

const socialPlatformOptions: { id: SocialPlatform; label: string; description: string; sizes: string[] }[] = [
    { id: 'instagram-post', label: 'Instagram Post', description: 'Square & Portrait', sizes: ['2880x2880', '2160x2700'] },
    { id: 'instagram-story', label: 'Instagram Story', description: 'Vertical (9:16)', sizes: ['1620x2880'] },
    { id: 'x-threads', label: 'X / Threads', description: 'Square & Wide', sizes: ['2880x2880', '2880x1620'] }
];


type PresetOption = {
  value: string;
  label: string;
  details?: string;
  isLandscape?: boolean;
};

const presetOptions: PresetOption[] = [
  { value: '1290x2796', label: 'iPhone', details: '6.9"', isLandscape: false },
  { value: '2796x1290', label: 'iPhone', details: '6.9"', isLandscape: true },
  { value: '2048x2732', label: 'iPad', details: '12.9"', isLandscape: false },
  { value: '2732x2048', label: 'iPad', details: '12.9"', isLandscape: true },
  { value: '1620x2880', label: '9:16' },
  { value: '2880x1620', label: '16:9' },
  { value: '2160x2700', label: '4:5' },
  { value: '2880x2160', label: '4:3' },
  { value: '2880x2880', label: '1:1' },
];

const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
    { value: 'German', label: 'Deutsch' },
    { value: 'Japanese', label: '日本語' },
    { value: 'Korean', label: '한국어' },
    { value: 'Chinese (Simplified)', label: '简体中文' },
];

const RatioIcon: React.FC<{ ratio: string }> = ({ ratio }) => {
  const styles: { [key: string]: string } = {
    '9:16': 'w-4 h-7',
    '16:9': 'w-7 h-4',
    '4:5': 'w-5 h-6',
    '4:3': 'w-6 h-5',
    '1:1': 'w-6 h-6',
  };
  return <div className={`${styles[ratio] || 'w-6 h-6'} rounded-sm bg-current`} />;
};

const DeviceIcon: React.FC<{ isLandscape: boolean }> = ({ isLandscape }) => {
  const containerClasses = isLandscape ? 'w-10 h-7' : 'w-7 h-10';
  return (
    <div className={`border-2 border-current rounded-md ${containerClasses}`}></div>
  );
};

interface GeneratedImageData {
    base64?: string;
    actualWidth?: number;
    actualHeight?: number;
    requestedResolution: string;
    status: 'loading' | 'success' | 'error';
    error?: string;
}

const ScreenshotGenerator: React.FC = () => {
  const [purpose, setPurpose] = useState<Purpose>('app-store');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [appFeatures, setAppFeatures] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [subheadline, setSubheadline] = useState<string>('');
  const [socialPost, setSocialPost] = useState<{ caption: string; hashtags: string } | null>(null);
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>('instagram-post');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['1290x2796', '2048x2732']);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [backgroundColor, setBackgroundColor] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);

  const [modalImage, setModalImage] = useState<GeneratedImageData | null>(null);
  const [upscalingState, setUpscalingState] = useState<{ [key: string]: boolean }>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy Post');

  const isOG = purpose === 'og-image';

  useEffect(() => {
    // Reset fields and errors when purpose changes
    setHeadline('');
    setSubheadline('');
    setSocialPost(null);
    setTextError(null);
    setError(null);
    setGeneratedImages(null);
    
    if(purpose === 'og-image' && appFeatures === '') {
        setAppFeatures('');
    }

    switch (purpose) {
      case 'app-store':
        setSelectedSizes(['1290x2796', '2048x2732']);
        break;
      case 'social-media':
        const defaultPlatform = socialPlatformOptions[0];
        setSocialPlatform(defaultPlatform.id);
        setSelectedSizes(defaultPlatform.sizes);
        break;
      case 'og-image':
        setSelectedSizes(['1200x630']);
        break;
      case 'custom':
        setSelectedSizes(['1290x2796']);
        break;
      default:
        setSelectedSizes([]);
        break;
    }
  }, [purpose]);

  const handleGenerateText = useCallback(async () => {
    if (!appFeatures.trim()) {
      setTextError("Please describe a feature first.");
      return;
    }
    setIsGeneratingText(true);
    setTextError(null);
    setSocialPost(null);
    try {
      const { headline: newHeadline, subheadline: newSubheadline, caption, hashtags } = await generateTextOverlays(appFeatures, purpose, socialPlatform, language);
      setHeadline(newHeadline);
      setSubheadline(newSubheadline);
      if (purpose === 'social-media' && caption && hashtags) {
        setSocialPost({ caption, hashtags });
      }
    } catch (err) {
      console.error(err);
      setTextError(err instanceof Error ? err.message : 'Failed to generate text.');
    } finally {
      setIsGeneratingText(false);
    }
  }, [appFeatures, purpose, socialPlatform, language]);
  
  const handleFeaturesKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!isGeneratingText && appFeatures.trim()) {
        handleGenerateText();
      }
    }
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!screenshotFile) {
      setError('Please upload a screenshot.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages(null);

    if (selectedSizes.length === 0) {
      setError('Please select at least one output size.');
      setIsLoading(false);
      return;
    }

    setGeneratedImages(
      selectedSizes.map(res => ({
        requestedResolution: res,
        status: 'loading',
      }))
    );

    try {
      const { base64, mimeType } = await fileToBase64(screenshotFile);

      const generationPromises = selectedSizes.map(async (resolution): Promise<GeneratedImageData> => {
        try {
          const [targetWidth, targetHeight] = resolution.split('x').map(Number);
          if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
              throw new Error(`Invalid resolution: ${resolution}`);
          }

          let generationWidth = Math.round(targetWidth / 2);
          let generationHeight = Math.round(targetHeight / 2);
          
          if (purpose === 'og-image') {
              generationWidth = targetWidth;
              generationHeight = targetHeight;
          }

          const generationResolution = `${generationWidth}x${generationHeight}`;

          const resultBase64 = await generateScreenshot(
            base64,
            mimeType,
            headline,
            subheadline,
            appFeatures,
            generationResolution,
            resolution,
            backgroundColor,
            purpose
          );

          const { width: actualWidth, height: actualHeight } = await getImageDimensions(resultBase64);

          return {
            base64: resultBase64,
            actualWidth,
            actualHeight,
            requestedResolution: resolution,
            status: 'success'
          };
        } catch (err) {
          return {
            requestedResolution: resolution,
            status: 'error',
            error: err instanceof Error ? err.message : 'An unknown error occurred.'
          };
        }
      });

      const results = await Promise.all(generationPromises);
      setGeneratedImages(results);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred during initial setup.');
      setGeneratedImages(null);
    } finally {
      setIsLoading(false);
    }
  }, [screenshotFile, appFeatures, headline, subheadline, selectedSizes, backgroundColor, purpose]);

  const handlePresetToggle = (value: string) => {
    setSelectedSizes(prev => {
      const isSelected = prev.includes(value);
      return isSelected ? prev.filter(size => size !== value) : [...prev, value];
    });
  };

  const handleSocialPlatformSelect = (platform: SocialPlatform) => {
    setSocialPlatform(platform);
    const option = socialPlatformOptions.find(opt => opt.id === platform);
    if (option) {
        setSelectedSizes(option.sizes);
    }
  };

  const handleAddCustomSize = () => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (w > 0 && h > 0) {
      const newSize = `${w}x${h}`;
      if (!selectedSizes.includes(newSize)) {
        setSelectedSizes(prev => [...prev, newSize]);
      }
      setCustomWidth('');
      setCustomHeight('');
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setSelectedSizes(prev => prev.filter(size => size !== sizeToRemove));
  };
  
  const handleDownload = useCallback(async (imageData: GeneratedImageData) => {
    if (!imageData.base64) return;
    setUpscalingState(prev => ({ ...prev, [imageData.requestedResolution]: true }));
    try {
        const [targetWidth, targetHeight] = imageData.requestedResolution.split('x').map(Number);
        const upscaledDataUrl = await resizeImageBase64(imageData.base64, targetWidth, targetHeight);
        const link = document.createElement('a');
        link.href = upscaledDataUrl;
        link.download = `app-store-screenshot-${targetWidth}x${targetHeight}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to upscale and download image:", error);
    } finally {
        setUpscalingState(prev => ({ ...prev, [imageData.requestedResolution]: false }));
    }
  }, []);

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    const successfulImages = generatedImages?.filter(img => img.status === 'success') || [];
    for (const image of successfulImages) {
        if (image.base64) {
            await handleDownload(image);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    setIsDownloadingAll(false);
  };
  
  const handleCopySocialPost = useCallback(() => {
    if (socialPost) {
        const textToCopy = `${socialPost.caption}\n\n${socialPost.hashtags}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy Post'), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setCopyButtonText('Failed to copy');
            setTimeout(() => setCopyButtonText('Copy Post'), 2000);
        });
    }
  }, [socialPost]);

  const generateButtonText = isOG
    ? '6. Generate OG Image'
    : `6. Generate ${selectedSizes.length} Image${selectedSizes.length > 1 ? 's' : ''}`;
  const successfulImageCount = generatedImages?.filter(img => img.status === 'success').length || 0;

  return (
    <div className="max-w-7xl mx-auto bg-gray-800/50 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">1. Select Your Goal</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {purposeOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPurpose(opt.id)}
                      className={`flex flex-col text-center p-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800
                        ${purpose === opt.id
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105'
                          : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                        }`
                      }
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-xs text-gray-400 mt-1">{opt.description}</span>
                    </button>
                ))}
              </div>
               {purpose === 'social-media' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platform</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {socialPlatformOptions.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSocialPlatformSelect(opt.id)}
                          className={`flex flex-col text-center p-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800
                            ${socialPlatform === opt.id
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105'
                              : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                            }`
                          }
                        >
                          <span className="font-semibold">{opt.label}</span>
                          <span className="text-xs text-gray-400 mt-1">{opt.description}</span>
                        </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">2. Upload Your App Screenshot</label>
              <ImageInput onFileChange={setScreenshotFile} />
            </div>

            <div>
              <TextAreaInput
                id="features"
                label={"3. Describe Feature & Generate Text"}
                value={appFeatures}
                onChange={(e) => setAppFeatures(e.target.value)}
                onKeyDown={handleFeaturesKeyDown}
                placeholder={"Optional: Describe the feature shown for better AI context."}
                cornerComponent={(<select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-gray-900/70 border border-gray-600 text-white rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 px-2 py-1 text-xs transition"
                      aria-label="Select generation language"
                  >
                      {languageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>)
                }
              />
                <>
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
                </>
            </div>
            
            <>
              <div>
                <ColorInput
                  id="backgroundColor"
                  label="4. Set Solid Background Color (Optional)"
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  5. Select Output Sizes
                </label>
                {isOG ? (
                  <div className="bg-gray-900/40 p-4 rounded-lg mt-2 border border-gray-700 text-center">
                      <p className="text-sm text-gray-300">
                          OG Image size is automatically set to <span className="font-semibold text-white">1200x630</span> for optimal link previews.
                      </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                      {presetOptions.map(opt => {
                        const isActive = selectedSizes.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handlePresetToggle(opt.value)}
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
                    <div className="bg-gray-900/40 p-3 rounded-lg mt-4 border border-gray-700">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Add a custom size</label>
                      <div className="grid grid-cols-2 gap-2 items-end">
                        <TextInput id="customWidth" label="Width" type="number" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} placeholder="e.g., 1080" />
                        <TextInput id="customHeight" label="Height" type="number" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} placeholder="e.g., 1920" />
                      </div>
                      <button type="button" onClick={handleAddCustomSize} disabled={!customWidth || !customHeight} className="w-full mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500">
                        Add Custom Size
                      </button>
                    </div>

                    {selectedSizes.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-400 mb-2">To be generated:</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedSizes.map(size => (
                            <span key={size} className="flex items-center bg-gray-700 text-gray-200 text-xs font-medium pl-3 pr-2 py-1 rounded-full">
                              {size}
                              <button type="button" onClick={() => handleRemoveSize(size)} className="ml-2 -mr-1 p-0.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-600 transition-colors" aria-label={`Remove size ${size}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>

            <div className="pt-4">
              <Button type="submit" disabled={isLoading || !screenshotFile || selectedSizes.length === 0}>
                {isLoading ? <Spinner /> : generateButtonText}
              </Button>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="space-y-8 lg:flex lg:flex-col">
            {socialPost && purpose === 'social-media' && (
              <div className="bg-gray-800/50 rounded-2xl shadow-xl p-6 border border-gray-700">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-semibold text-gray-200">Generated Social Media Post</h4>
                    <button
                        type="button"
                        onClick={handleCopySocialPost}
                        className="flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        {copyButtonText}
                    </button>
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Caption</label>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap bg-gray-800/50 p-3 rounded-md">{socialPost.caption}</p>
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Hashtags</label>
                      <p className="text-sm text-gray-300 italic bg-gray-800/50 p-3 rounded-md break-all">{socialPost.hashtags}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col min-h-[400px] lg:flex-grow border border-gray-700">
              {isLoading ? (
                  <div className="h-full flex-grow flex flex-col items-center justify-center text-center text-gray-400">
                      <Spinner large={true} />
                      <p className="mt-4 text-lg font-semibold text-gray-200">Generating {selectedSizes.length} Screenshot{selectedSizes.length > 1 ? 's' : ''}...</p>
                      <p className="mt-2 text-sm">This may take a moment.</p>
                  </div>
              ) : (
                <div className="flex-grow min-h-0">
                    {generatedImages && generatedImages.length > 0 ? (
                    <div className="w-full h-full flex flex-col">
                        <h3 className="text-lg font-semibold mb-4 text-center text-gray-200 flex-shrink-0">
                        Generated Screenshots
                        </h3>
                        
                        {successfulImageCount > 1 && (
                            <div className="mb-4 flex-shrink-0">
                                <button
                                    onClick={handleDownloadAll}
                                    disabled={isDownloadingAll}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDownloadingAll ? <><Spinner /> <span className="ml-2">Downloading...</span></> : 'Download All (.png)'}
                                </button>
                            </div>
                        )}
                        
                        <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto min-h-0 custom-scrollbar p-1">
                        {generatedImages.map((imgData, index) => (
                            <div key={index}>
                            {imgData.status === 'error' && (
                                <div className="aspect-square flex flex-col items-center justify-center h-full text-center bg-gray-800/70 rounded-lg border border-red-800/50 p-2">
                                <div className="text-red-400 mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-red-400 font-semibold text-xs">Failed</p>
                                <p className="text-[10px] font-mono text-gray-500">{imgData.requestedResolution}</p>
                                </div>
                            )}
                            {imgData.status === 'success' && imgData.base64 && (
                                <GeneratedImage
                                base64Image={imgData.base64}
                                requestedResolution={imgData.requestedResolution}
                                onPreviewClick={() => setModalImage(imgData)}
                                onDownloadClick={() => handleDownload(imgData)}
                                isUpscaling={upscalingState[imgData.requestedResolution] || false}
                                />
                            )}
                            </div>
                        ))}
                        </div>
                        {successfulImageCount > 0 && (
                        <div className="mt-4 p-3 bg-blue-900/50 border border-blue-700 text-blue-300 text-xs rounded-md flex-shrink-0" role="alert">
                            <p><span className="font-bold">Note:</span> A smaller preview is generated for speed. The final image will be downloaded at your selected high resolution via upscaling.</p>
                        </div>
                        )}
                    </div>
                    ) : (
                    <div className="h-full flex items-center justify-center text-center text-gray-500">
                        {error ? (
                        <p className="text-red-400">{error}</p>
                        ) : (
                        <p>Your generated content will appear here.</p>
                        )}
                    </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
       {modalImage && modalImage.base64 && (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300" 
            onClick={() => setModalImage(null)}
            aria-modal="true"
            role="dialog"
        >
            <div className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl p-2" onClick={e => e.stopPropagation()}>
                <img src={`data:image/png;base64,${modalImage.base64}`} alt={`Preview for ${modalImage.requestedResolution}`} className="max-w-full max-h-[calc(90vh-4rem)] object-contain" />
                <p className="text-center text-sm text-gray-400 font-mono pt-2">{modalImage.requestedResolution}</p>
                <button 
                    onClick={() => setModalImage(null)} 
                    className="absolute -top-2 -right-2 text-white bg-gray-800 rounded-full p-1.5 shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white" 
                    aria-label="Close preview"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
      )}
       <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; /* bg-gray-800 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; /* bg-gray-600 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* bg-gray-500 */
        }
      `}</style>
    </div>
  );
};

export default ScreenshotGenerator;
