import React, { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { forgotPassword } from "@/api/authApi";
import { assignmentApi } from "@/api/assignmentApi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import type { AssignmentDTO } from "@/types/auth";

export default function UserProfile() {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingAssignment(true);
    assignmentApi
      .getMyAssignment()
      .then((data) => {
        if (active) setAssignment(data);
      })
      .catch(() => {
        if (active) setAssignment(null);
      })
      .finally(() => {
        if (active) setLoadingAssignment(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);
    try {
      const message = await forgotPassword({ email: user.email });
      setPasswordMessage(message);
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to start password reset."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const countyName = assignment?.countyName ?? user?.countyName ?? "-";
  const subCountyName = assignment?.subCountyName ?? user?.subCountyName ?? "-";
  const wardNames =
    assignment?.wardNames?.length
      ? assignment.wardNames
      : user?.wardNames?.length
        ? user.wardNames
        : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-bold uppercase text-gray-900">Profile</h2>
        <p className="mt-3 text-sm text-gray-500">User / Profile</p>
      </div>

      <section className="rounded-sm bg-white p-8 shadow-sm">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-7">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <BadgeCheck className="h-10 w-10 text-gray-900" />
            </div>

            <div className="space-y-4 text-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.fullName ?? "User"}
              </h3>
              <p className="uppercase text-gray-500">
                Email:{" "}
                <span className="normal-case font-semibold text-gray-700">
                  {user?.email ?? "-"}
                </span>
              </p>
              <p className="uppercase text-gray-500">
                Role:{" "}
                <span className="normal-case font-semibold text-gray-700">
                  {user?.role ?? "-"}
                </span>
              </p>
              <p className="uppercase text-gray-500">
                Mobile:{" "}
                <span className="normal-case font-semibold text-gray-700">
                  -
                </span>
              </p>
            </div>

            <Button
              type="button"
              className="rounded bg-sky-500 hover:bg-sky-600"
              onClick={() => void handleChangePassword()}
              disabled={passwordLoading || !user?.email}
            >
              {passwordLoading ? "Sending code..." : "Change Password"}
            </Button>

            {passwordMessage && (
              <p className="max-w-md rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {passwordMessage}
              </p>
            )}
            {passwordError && (
              <p role="alert" className="max-w-md rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {passwordError}
              </p>
            )}
          </div>

          <div className="space-y-5 text-sm">
            <h3 className="text-lg font-semibold text-gray-900">Address</h3>
            <p className="text-gray-500">
              County:{" "}
              <span className="font-semibold text-gray-700">{countyName}</span>
            </p>
            <p className="text-gray-500">
              Sub-county:{" "}
              <span className="font-semibold text-gray-700">
                {subCountyName}
              </span>
            </p>
            <div className="space-y-2 text-gray-500">
              <p className="uppercase tracking-wide">Wards:</p>
              {loadingAssignment ? (
                <p>Loading assigned wards...</p>
              ) : wardNames.length > 0 ? (
                wardNames.map((ward) => (
                  <p key={ward}>
                    Ward:{" "}
                    <span className="font-semibold text-gray-700">{ward}</span>
                  </p>
                ))
              ) : (
                <p>
                  Ward: <span className="font-semibold text-gray-700">-</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
