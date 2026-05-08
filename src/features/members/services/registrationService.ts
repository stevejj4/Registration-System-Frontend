import { memberApi } from "@/api/memberApi";
import { checkBackendConnectivity } from "@/api/client";
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
    // Check backend connectivity first
    const isBackendConnected = await checkBackendConnectivity();
    
    if (!isBackendConnected) {
      return {
        success: false,
        error: 'Server is currently unavailable. Please try again later.'
      };
    }

    const newMember = await memberApi.registerMember(payload);
    
    return {
      success: true,
      memberId: newMember.id
    };
  } catch (err: any) {
    console.error('Registration failed:', err);
    return {
      success: false,
      error: err.message || ERROR_MESSAGES.REGISTRATION_FAILED
    };
  }
}
