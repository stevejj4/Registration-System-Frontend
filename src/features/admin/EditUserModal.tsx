import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { UpdateUserRequestDTO } from "@/types/auth";
import { isValidEmail, isDuplicateEmail } from "@/utils/validation";
import type { SystemUser } from "@/api/adminApi";

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

interface Props {
  isOpen: boolean;
  user: SystemUser | null;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateUserRequestDTO) => Promise<void>;
  existingEmails: string[];
}

export default function EditUserModal({
  isOpen,
  user,
  onClose,
  onSubmit,
  existingEmails,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const { firstName: fn, lastName: ln } = splitFullName(user.fullName);
      setFirstName(fn);
      setLastName(ln);
      setEmail(user.email);
      setErrors({});
    }
  }, [user, isOpen]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name is required.";
    if (!lastName.trim()) next.lastName = "Last name is required.";
    if (!isValidEmail(email)) {
      next.email = "Enter a valid email address.";
    } else if (
      user &&
      email.trim().toLowerCase() !== user.email.toLowerCase() &&
      isDuplicateEmail(email, existingEmails)
    ) {
      next.email = "This email is already in use.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setLoading(true);
    try {
      await onSubmit(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      onClose();
    } catch {
      // parent shows error
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      title="Edit user"
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
            form="edit-user-form"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
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
        <p className="text-xs text-gray-500">
          Role: <strong>{user.role}</strong> — change role from the users table dropdown.
        </p>
      </form>
    </Modal>
  );
}
