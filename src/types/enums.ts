// src/types/enums.ts

/**
 * Gender Types
 * Must match Spring Boot enum exactly
 */
export type GenderType =
  | "MALE"
  | "FEMALE"
  | "OTHER";

/**
 * Relationship Types
 * Must match Spring Boot enum exactly
 */
export type RelationshipType =
  | "SPOUSE"
  | "SON"
  | "DAUGHTER"
  | "PARENT"
  | "OTHER";

/**
 * System User Roles
 * Must match backend enum exactly
 */
export type UserRole =
  | "ADMIN"
  | "FACILITATOR"
  | "COORDINATOR";