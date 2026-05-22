import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import TextInput from "@/components/ui/TextInput";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string | null;
  className?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  className = "",
  disabled,
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <TextInput
        label={label}
        error={error}
        type={visible ? "text" : "password"}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-[2.65rem] text-gray-500 hover:text-gray-700 disabled:opacity-40"
      >
        {visible ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
