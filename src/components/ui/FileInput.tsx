import React, { useState } from "react";
import { Upload, X } from "lucide-react";

interface Props {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  accept?: string;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export default function FileInput({
  label,
  value,
  onChange,
  accept = "image/*,.pdf",
  error,
  disabled = false,
  className = "",
}: Props) {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // In a real implementation, this would upload the file and return the path
      // For now, we'll use a placeholder path
      const mockPath = `uploads/${Date.now()}_${file.name}`;
      onChange(mockPath);
    }
  };

  const handleClear = () => {
    setFileName("");
    onChange("");
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="p-2 text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {fileName && (
        <p className="text-sm text-gray-600 mt-1 flex items-center">
          <Upload className="w-4 h-4 mr-1" />
          {fileName}
        </p>
      )}
      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}
