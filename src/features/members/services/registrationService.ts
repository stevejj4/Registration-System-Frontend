import { memberApi } from "@/api/memberApi";
import { RegisterMemberPayload } from "@/types/member";
import { ERROR_MESSAGES } from "@/constants";

export interface RegistrationResult {
  success: boolean;
  memberId?: string;
  error?: string;
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
  } catch (err: any) {
    console.error("Registration failed:", err);
    return {
      success: false,
      error: err.message || ERROR_MESSAGES.REGISTRATION_FAILED,
    };
  }
}