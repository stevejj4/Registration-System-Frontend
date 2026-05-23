/** Backend PBAC permission constants */
export type MemberPermission =
  | "MEMBER_CREATE"
  | "MEMBER_READ"
  | "MEMBER_WRITE";

export const PERMISSIONS = {
  MEMBER_CREATE: "MEMBER_CREATE",
  MEMBER_READ: "MEMBER_READ",
  MEMBER_WRITE: "MEMBER_WRITE",
} as const satisfies Record<string, MemberPermission>;
