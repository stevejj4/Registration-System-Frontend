import React from "react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export default function SelectInput({
  label,
  value,
  onChange,
  options,
  error,
  disabled = false,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
        } ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="mt-1.5 text-sm text-red-600 font-medium">{error}</div>
      )}
    </div>
  );
}
