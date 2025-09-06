import React from 'react';

interface ColorInputProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({ label, id, value, onChange }) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-3 w-full bg-gray-900/70 border border-gray-600 text-white rounded-md shadow-sm focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition px-3 py-2">
        <input
          id={id}
          type="color"
          value={value || '#1A202C'}
          onChange={(e) => onChange(e.target.value)}
          className="p-0 h-6 w-8 block bg-transparent border-none cursor-pointer rounded"
          aria-label="Color Picker"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g., #1A202C"
          className="flex-grow bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0"
          aria-label="Hex Color Code"
        />
        {value && (
          <button 
            type="button" 
            onClick={handleClear}
            className="text-gray-400 hover:text-white text-sm"
            aria-label="Clear background color"
          >
            &#x2715; 
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorInput;
