import React from 'react';
import Spinner from './Spinner';

interface GeneratedImageProps {
  base64Image: string;
  resolution: string;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ base64Image, resolution }) => {
  const imageUrl = `data:image/png;base64,${base64Image}`;
  
  const [targetWidth, targetHeight] = resolution.split('x').map(Number);
  const aspectRatio = targetWidth && targetHeight ? `${targetWidth} / ${targetHeight}` : '1 / 1';

  return (
    <div className="space-y-4 w-full">
      <div
        className="w-full bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center relative"
        style={{ aspectRatio: aspectRatio }}
      >
        <img src={imageUrl} alt="Generated App Store Screenshot" className="w-full h-full object-contain" />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-md font-mono">
          {targetWidth} x {targetHeight} px
        </div>
      </div>
      <a
        href={imageUrl}
        download="app-store-screenshot.png"
        className={`w-full block text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500`}
      >
        Download PNG
      </a>
    </div>
  );
};

export default GeneratedImage;
