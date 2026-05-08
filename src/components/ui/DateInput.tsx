import React from "react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export default function DateInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
        } ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
      />
      {error && (
        <div className="mt-1.5 text-sm text-red-600 font-medium">{error}</div>
      )}
    </div>
  );
}
