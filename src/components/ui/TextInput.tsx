import React from "react";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  className?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  className = "",
  id,
  required,
  ...props
}) => {
  const errorId = id ? `${id}-error` : undefined;
  const hasError = Boolean(error);

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={id}
        required={required}
        aria-required={required ? true : undefined}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={hasError && errorId ? errorId : undefined}
        {...props}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
        } ${props.disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : ""}`}
      />
      {error && (
        <div id={errorId} role="alert" className="mt-1.5 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}
    </div>
  );
};

export default TextInput;
