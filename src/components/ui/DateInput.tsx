import React from "react";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  id?: string;
  required?: boolean;
}

export default function DateInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
  className = "",
  id,
  required = false,
}: Props) {
  const errorId = id ? `${id}-error` : undefined;
  const hasError = Boolean(error);

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="date"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-required={required ? true : undefined}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={hasError && errorId ? errorId : undefined}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
        } ${disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
      />
      {error && (
        <div id={errorId} role="alert" className="mt-1.5 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
