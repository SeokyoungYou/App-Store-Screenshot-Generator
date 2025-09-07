import React from 'react';

interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  cornerComponent?: React.ReactNode;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ label, id, cornerComponent, ...props }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        {cornerComponent}
      </div>
      <textarea
        id={id}
        rows={4}
        className="w-full bg-gray-900/70 border border-gray-600 text-white rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 px-3 py-2 transition"
        {...props}
      />
    </div>
  );
};

export default TextAreaInput;