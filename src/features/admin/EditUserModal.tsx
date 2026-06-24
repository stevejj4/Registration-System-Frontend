import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import { Button } from "@/components/ui/Button";
import { UpdateUserRequestDTO } from "@/types/auth";
import { isValidEmail, isDuplicateEmail } from "@/utils/validation";
import type { SystemUser } from "@/api/adminApi";
import { locationApi } from "@/api/locationApi";
import type { CountyDTO, SubCountyDTO, WardDTO } from "@/types/location";

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
  const [countyId, setCountyId] = useState("");
  const [subCountyId, setSubCountyId] = useState("");
  const [wardIds, setWardIds] = useState<number[]>([]);
  const [counties, setCounties] = useState<CountyDTO[]>([]);
  const [subCounties, setSubCounties] = useState<SubCountyDTO[]>([]);
  const [wards, setWards] = useState<WardDTO[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const { firstName: fn, lastName: ln } = splitFullName(user.fullName);
      setFirstName(fn);
      setLastName(ln);
      setEmail(user.email);
      setCountyId(user.countyId ? String(user.countyId) : "");
      setSubCountyId(user.subCountyId ? String(user.subCountyId) : "");
      setWardIds(user.wardIds ?? []);
      setErrors({});
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLocationsLoading(true);
    locationApi
      .getCounties()
      .then((items) => {
        if (active) setCounties(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrors((prev) => ({
            ...prev,
            countyId:
              error instanceof Error
                ? error.message
                : "Failed to load counties.",
          }));
        }
      })
      .finally(() => {
        if (active) setLocationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!countyId) {
      setSubCounties([]);
      return;
    }
    let active = true;
    setLocationsLoading(true);
    locationApi
      .getSubCounties(Number(countyId))
      .then((items) => {
        if (active) setSubCounties(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrors((prev) => ({
            ...prev,
            subCountyId:
              error instanceof Error
                ? error.message
                : "Failed to load sub-counties.",
          }));
        }
      })
      .finally(() => {
        if (active) setLocationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [countyId]);

  useEffect(() => {
    if (!subCountyId) {
      setWards([]);
      return;
    }
    let active = true;
    setLocationsLoading(true);
    locationApi
      .getWards(Number(subCountyId))
      .then((items) => {
        if (active) setWards(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrors((prev) => ({
            ...prev,
            wardIds:
              error instanceof Error ? error.message : "Failed to load wards.",
          }));
        }
      })
      .finally(() => {
        if (active) setLocationsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [subCountyId]);

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
    if ((user?.role === "COORDINATOR" || user?.role === "FACILITATOR") && !countyId) {
      next.countyId = "County is required.";
    }
    if ((user?.role === "COORDINATOR" || user?.role === "FACILITATOR") && !subCountyId) {
      next.subCountyId = "Sub-county is required.";
    }
    if (user?.role === "FACILITATOR" && wardIds.length === 0) {
      next.wardIds = "Select at least one ward.";
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
        assignedRole: user.role,
        countyId: countyId ? Number(countyId) : undefined,
        subCountyId: subCountyId ? Number(subCountyId) : undefined,
        wardIds: user.role === "FACILITATOR" ? wardIds : [],
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
        {(user.role === "COORDINATOR" || user.role === "FACILITATOR") && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectInput
                label="County"
                value={countyId}
                onChange={(value) => {
                  setCountyId(value);
                  setSubCountyId("");
                  setWardIds([]);
                  setWards([]);
                }}
                options={counties.map((county) => ({
                  value: String(county.id),
                  label: county.name,
                }))}
                error={errors.countyId}
                disabled={loading || locationsLoading}
                required
              />
              <SelectInput
                label="Sub-county"
                value={subCountyId}
                onChange={(value) => {
                  setSubCountyId(value);
                  setWardIds([]);
                }}
                options={subCounties.map((subCounty) => ({
                  value: String(subCounty.id),
                  label: subCounty.name,
                }))}
                error={errors.subCountyId}
                disabled={loading || locationsLoading || !countyId}
                required
              />
            </div>
            {user.role === "FACILITATOR" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigned wards
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  Hold Ctrl or Cmd to add/remove approved wards for this facilitator.
                </p>
                <select
                  multiple
                  value={wardIds.map(String)}
                  onChange={(event) => {
                    setWardIds(
                      Array.from(event.target.selectedOptions).map((option) =>
                        Number(option.value)
                      )
                    );
                  }}
                  disabled={loading || locationsLoading || !subCountyId}
                  className={`w-full min-h-32 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.wardIds ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                  } ${
                    loading || locationsLoading || !subCountyId
                      ? "bg-gray-100 cursor-not-allowed opacity-60"
                      : ""
                  }`}
                >
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}
                    </option>
                  ))}
                </select>
                {errors.wardIds && (
                  <div role="alert" className="mt-1.5 text-sm text-red-600 font-medium">
                    {errors.wardIds}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </form>
    </Modal>
  );
}
