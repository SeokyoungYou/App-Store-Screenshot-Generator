import React from 'react';
import Spinner from './Spinner';

interface GeneratedImageProps {
  base64Image: string;
  requestedResolution: string;
  onPreviewClick: () => void;
  onDownloadClick: () => void;
  isUpscaling: boolean;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ 
  base64Image, 
  requestedResolution, 
  onPreviewClick, 
  onDownloadClick, 
  isUpscaling 
}) => {
  const imageUrl = `data:image/png;base64,${base64Image}`;
  const [targetWidth, targetHeight] = requestedResolution.split('x').map(Number);

  return (
    <div className="space-y-2 w-full">
      <div 
        onClick={onPreviewClick}
        onKeyPress={(e) => e.key === 'Enter' && onPreviewClick()}
        className="w-full aspect-square bg-gray-700/50 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer group border border-gray-700 hover:border-purple-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
        role="button"
        tabIndex={0}
        aria-label={`Preview screenshot for size ${requestedResolution}`}
      >
        <img src={imageUrl} alt={`Generated screenshot for ${requestedResolution}`} className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      <button
        onClick={onDownloadClick}
        disabled={isUpscaling}
        className={`w-full flex items-center justify-center px-2 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white transition-colors bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isUpscaling ? <><Spinner /> <span className="ml-2">Upscaling...</span></> : `Download ${targetWidth}x${targetHeight}`}
      </button>
    </div>
  );
};

export default GeneratedImage;