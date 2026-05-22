import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import PasswordInput from "@/components/ui/PasswordInput";
import SelectInput from "@/components/ui/SelectInput";
import { Button } from "@/components/ui/Button";
import { RegisterUserDTO, UserRole } from "@/types/auth";
import {
  isValidEmail,
  isDuplicateEmail,
  validatePasswordMinLength,
} from "@/utils/validation";

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "FACILITATOR", label: "Facilitator" },
  { value: "COORDINATOR", label: "Coordinator" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RegisterUserDTO) => Promise<void>;
  existingEmails: string[];
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  existingEmails,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FACILITATOR");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("FACILITATOR");
    setErrors({});
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!fullName.trim()) {
      next.fullName = "Full name is required.";
    }
    if (!isValidEmail(email)) {
      next.email = "Enter a valid email address.";
    } else if (isDuplicateEmail(email, existingEmails)) {
      next.email = "This email is already registered.";
    }
    if (!validatePasswordMinLength(password)) {
      next.password = "Password must be at least 8 characters.";
    }
    if (!role) {
      next.role = "Select a system role.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      resetForm();
      onClose();
    } catch {
      // Parent surfaces API errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create system user"
      onClose={handleClose}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-user-form"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create user"}
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          disabled={loading}
          required
        />
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={loading}
          required
        />
        <PasswordInput
          label="Temporary password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={loading}
          required
        />
        <SelectInput
          label="System role"
          value={role}
          onChange={(v) => setRole(v as UserRole)}
          options={ASSIGNABLE_ROLES.map((r) => ({
            value: r.value,
            label: r.label,
          }))}
          error={errors.role}
          disabled={loading}
        />
        <p className="text-xs text-gray-500">
          Admins can register facilitator and coordinator accounts only.
        </p>
      </form>
    </Modal>
  );
}
