import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import PasswordInput from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { validatePasswordMinLength } from "@/utils/validation";

interface Props {
  isOpen: boolean;
  userName: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
}

export default function ResetPasswordModal({
  isOpen,
  userName,
  onClose,
  onSubmit,
}: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setPassword("");
      setConfirm("");
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePasswordMinLength(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(password);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Reset password"
      onClose={handleClose}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="reset-password-form"
            disabled={loading}
          >
            {loading ? "Saving..." : "Reset password"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 mb-4">
        Set a new password for <strong>{userName}</strong>.
      </p>
      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <PasswordInput
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={error ?? undefined}
          disabled={loading}
          required
        />
      </form>
    </Modal>
  );
}
