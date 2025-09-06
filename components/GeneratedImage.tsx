import React, { useState } from 'react';
import { resizeImageBase64 } from '../utils/imageUtils';
import Spinner from './Spinner';

interface GeneratedImageProps {
  base64Image: string;
  requestedResolution: string; // The user's target resolution, e.g., "1290x2796"
  actualWidth: number;   // The actual width of the generated (smaller) image
  actualHeight: number;  // The actual height of the generated (smaller) image
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ base64Image, requestedResolution, actualWidth, actualHeight }) => {
  const [isUpscaling, setIsUpscaling] = useState(false);
  const imageUrl = `data:image/png;base64,${base64Image}`;
  
  const [targetWidth, targetHeight] = requestedResolution.split('x').map(Number);
  const aspectRatio = targetWidth && targetHeight ? `${targetWidth} / ${targetHeight}` : `${actualWidth} / ${actualHeight}`;

  const handleDownload = async () => {
    setIsUpscaling(true);
    try {
        const upscaledDataUrl = await resizeImageBase64(base64Image, targetWidth, targetHeight);
        const link = document.createElement('a');
        link.href = upscaledDataUrl;
        link.download = `app-store-screenshot-${targetWidth}x${targetHeight}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to upscale and download image:", error);
        // Optionally, show an error message to the user here
    } finally {
        setIsUpscaling(false);
    }
  };


  return (
    <div className="space-y-4 w-full">
      <div
        className="w-full bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center relative"
        style={{ aspectRatio: aspectRatio }}
      >
        <img src={imageUrl} alt="Generated App Store Screenshot" className="w-full h-full object-contain" />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-mono">
          Preview: {actualWidth}x{actualHeight}px
        </div>
      </div>
      
      <div className="p-3 bg-blue-900/50 border border-blue-700 text-blue-300 text-xs rounded-md" role="alert">
          <p><span className="font-bold">Note:</span> A smaller preview is generated for speed. The final image will be downloaded at your selected high resolution ({targetWidth}x{targetHeight}px) via upscaling.</p>
      </div>

      <button
        onClick={handleDownload}
        disabled={isUpscaling}
        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isUpscaling ? <><Spinner /> <span className="ml-2">Upscaling...</span></> : `Download (${targetWidth}x${targetHeight} PNG)`}
      </button>
    </div>
  );
};

export default GeneratedImage;