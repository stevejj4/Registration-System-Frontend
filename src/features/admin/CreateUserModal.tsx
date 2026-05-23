import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import { Button } from "@/components/ui/Button";
import { CreateUserRequestDTO, UserRole } from "@/types/auth";
import { isValidEmail, isDuplicateEmail } from "@/utils/validation";

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "FACILITATOR", label: "Facilitator" },
  { value: "COORDINATOR", label: "Coordinator" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequestDTO) => Promise<void>;
  existingEmails: string[];
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  existingEmails,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [assignedRole, setAssignedRole] = useState<UserRole>("FACILITATOR");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setAssignedRole("FACILITATOR");
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

    if (!firstName.trim()) {
      next.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      next.lastName = "Last name is required.";
    }
    if (!isValidEmail(email)) {
      next.email = "Enter a valid email address.";
    } else if (isDuplicateEmail(email, existingEmails)) {
      next.email = "This email is already registered.";
    }
    if (!assignedRole) {
      next.assignedRole = "Select a system role.";
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        assignedRole,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            disabled={loading}
            required
          />
          <TextInput
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            disabled={loading}
            required
          />
        </div>
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={loading}
          required
        />
        <SelectInput
          label="System role"
          value={assignedRole}
          onChange={(v) => setAssignedRole(v as UserRole)}
          options={ASSIGNABLE_ROLES.map((r) => ({
            value: r.value,
            label: r.label,
          }))}
          error={errors.assignedRole}
          disabled={loading}
        />
        <p className="text-xs text-gray-500">
          A secure temporary password will be generated and emailed to the user automatically.
          Only Coordinators and Facilitators can be created here.
        </p>
      </form>
    </Modal>
  );
}
