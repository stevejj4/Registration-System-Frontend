/** Backend PBAC permission constants */
export type MemberPermission = // this creates a union type -- variables can only be one of these exact values
  | "MEMBER_CREATE"
  | "MEMBER_READ"
  | "MEMBER_WRITE";

export const PERMISSIONS = { // creating a reusable object to avoid typos and have a single source of truth for permission strings
  MEMBER_CREATE: "MEMBER_CREATE",
  MEMBER_READ: "MEMBER_READ",
  MEMBER_WRITE: "MEMBER_WRITE",
} as const satisfies Record<string, MemberPermission>;

// satisfies is a TypeScript 4.9 feature that ensures the object conforms to the specified type,
//  'as const' makes the properties readonly and their types literal strings. This way, we get both type safety and immutability for our permissions.
// record<string, MemberPermission> means the object keys are strings and the values must be one of the MemberPermission types.