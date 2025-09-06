import React from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
}

const SelectInput: React.FC<SelectInputProps> = ({ label, id, options, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        className="w-full bg-gray-900/70 border border-gray-600 text-white rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 px-3 py-2 transition"
        {...props}
      >
        {options.map((option) => (
            <option key={option.value} value={option.value}>
                {option.label}
            </option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;
