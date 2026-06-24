import { memberApi } from "@/api/memberApi";
import { RegisterMemberPayload } from "@/types/member";
import { ERROR_MESSAGES } from "@/constants";
import { ApiError, type ApiFieldErrors } from "@/api/client";

export interface RegistrationResult {
  success: boolean;
  memberId?: string;
  error?: string;
  fieldErrors?: ApiFieldErrors;
}

export async function registerMember(
  payload: RegisterMemberPayload
): Promise<RegistrationResult> {
  try {
    const newMember = await memberApi.registerMember(payload);

    return {
      success: true,
      memberId: String(newMember.principal.id),
    };
  } catch (err: unknown) {
    console.error("Registration failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.REGISTRATION_FAILED,
      fieldErrors: err instanceof ApiError ? err.fieldErrors : undefined,
    };
  }
}