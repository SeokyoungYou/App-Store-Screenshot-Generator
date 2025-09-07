import React, { useState, useEffect } from 'react';

interface ColorInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
}

// A curated list of 30 modern, professional colors suitable for App Store screenshots.
const suggestedColors = [
  // Vibrant & Primary
  '#007AFF', // Apple Blue
  '#34C759', // Apple Green
  '#FF9500', // Apple Orange
  '#FF3B30', // Apple Red
  '#AF52DE', // Apple Purple
  '#5E5CE6', // Apple Indigo
  '#FF2D55', // Bright Pink/Red
  '#E63946', // Imperial Red

  // Bright & Fresh
  '#64D2FF', // Bright Sky Blue
  '#48D1CC', // Medium Turquoise
  '#00C7BE', // Teal
  '#FFCC00', // Apple Yellow
  '#F9C74F', // Maize
  '#90BE6D', // Pistachio Green
  '#F4A261', // Sandy Brown
  '#E76F51', // Burnt Sienna

  // Pastels & Soft Tones
  '#FF6B6B', // Coral
  '#4ECDC4', // Pastel Mint
  '#A2D2FF', // Pastel Blue
  '#BDE0FE', // Light Sky Blue
  '#F7D1BA', // Apricot
  '#A8DADC', // Powder Blue

  // Dark & Elegant
  '#1D3557', // Prussian Blue
  '#277DA1', // Ocean Blue
  '#6D6875', // Muted Purple
  '#1A202C', // Dark Slate Gray (almost black)
  '#2C2C2E', // Darker Gray
  '#8E8E93', // Mid Gray
  '#F2F2F7', // Off-white
  '#264653', // Dark Teal
];


const LOCAL_STORAGE_KEY = 'screenshotGenerator_recentColors';

const ColorInput: React.FC<ColorInputProps> = ({ label, id, value, onChange }) => {
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Load recent colors from local storage on component mount
  useEffect(() => {
    try {
      const storedColors = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedColors) {
        const parsedColors = JSON.parse(storedColors);
        if (Array.isArray(parsedColors)) {
          setRecentColors(parsedColors);
        }
      }
    } catch (error) {
      console.error("Failed to load recent colors from local storage", error);
    }
  }, []);

  // Save recent colors to local storage whenever they change
  useEffect(() => {
    try {
      // Avoid writing the initial empty state if nothing was in storage
      if (recentColors.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY) !== null) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recentColors));
      }
    } catch (error) {
      console.error("Failed to save recent colors to local storage", error);
    }
  }, [recentColors]);

  const addColorToRecents = (newColor: string) => {
    // Regex to validate a 3 or 6 digit hex color code
    if (!newColor || !/^#([0-9A-F]{3}){1,2}$/i.test(newColor)) {
      return;
    }

    const lowerNewColor = newColor.toLowerCase();
    setRecentColors(prevColors => {
      // Remove the color if it already exists to move it to the front
      const filteredColors = prevColors.filter(c => c.toLowerCase() !== lowerNewColor);
      // Add the new color to the beginning and keep the list at 5 items
      return [newColor, ...filteredColors].slice(0, 5);
    });
  };

  const handleClear = () => {
    onChange('');
  };
  
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    onChange(newColor);
    addColorToRecents(newColor);
  };
  
  const handleTextBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    addColorToRecents(e.target.value);
  };

  const handleSuggestColor = () => {
    let randomColor;
    do {
      const randomIndex = Math.floor(Math.random() * suggestedColors.length);
      randomColor = suggestedColors[randomIndex];
    } while (value === randomColor && suggestedColors.length > 1);
    
    onChange(randomColor);
    addColorToRecents(randomColor);
  };
  
  const handleRecentColorClick = (color: string) => {
      onChange(color);
      addColorToRecents(color);
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {/* Input Group */}
        <div className="flex-grow flex items-center gap-2 w-full bg-gray-900/70 border border-gray-600 text-white rounded-md shadow-sm focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition px-3">
          <input
            id={id}
            type="color"
            value={value || '#1A202C'}
            onChange={handleColorPickerChange}
            className="p-0 h-6 w-8 block bg-transparent border-none cursor-pointer rounded"
            aria-label="Color Picker"
          />
          <input
            type="text"
            value={value.toUpperCase()}
            onChange={e => onChange(e.target.value)}
            onBlur={handleTextBlur}
            placeholder="e.g., #1A202C"
            className="flex-grow bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 py-2"
            aria-label="Hex Color Code"
          />
          {value && (
            <button 
              type="button" 
              onClick={handleClear}
              className="text-gray-400 hover:text-white"
              aria-label="Clear background color"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {/* Suggest Button */}
        <button
          type="button"
          onClick={handleSuggestColor}
          className="flex items-center justify-center whitespace-nowrap px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          Suggest a Color
        </button>
      </div>
       {/* Recent Colors Palette */}
       {recentColors.length > 0 && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-gray-400 mb-2">Recent Colors</label>
          <div className="flex items-center gap-2">
            {recentColors.map(color => (
              <button
                key={color}
                type="button"
                className="h-8 w-8 rounded-full border-2 border-gray-700/50 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
                onClick={() => handleRecentColorClick(color)}
                aria-label={`Set background to ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorInput;
