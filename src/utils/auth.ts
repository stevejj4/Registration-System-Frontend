// src/utils/auth.ts

import type { UserRole } from "@/types/enums";

/**
 * Normalize backend role strings by stripping common prefixes like ROLE_
 * and returning one of the frontend UserRole values or null when unknown.
 *
 * Examples:
 *   "ROLE_COORDINATOR" → "coordinator"
 *   "COORDINATOR"      → "coordinator"
 *   "coordinator"      → "coordinator"
 *   "ROLE_ADMIN"       → "admin"
 *   ""                 → null
 *   undefined          → null
 */
export const normalizeRole = (raw?: string): UserRole | null => {
  if (!raw) return null;
  const stripped = String(raw)
    .replace(/^ROLE_/i, '')
    .trim()
    .toLowerCase();
  if (stripped === 'admin') return 'admin';
  if (stripped === 'facilitator') return 'facilitator';
  if (stripped === 'coordinator') return 'coordinator';
  return null;
};

/**
 * Check if a role matches any of the allowed roles.
 * Handles unnormalized input gracefully.
 */
export const roleMatches = (
  role?: string,
  allowed?: string[]
): boolean => {
  if (!role) return false;
  if (!allowed || allowed.length === 0) return true;
  const normalized = normalizeRole(role) ?? String(role).toLowerCase();
  return allowed.map(a => String(a).toLowerCase()).includes(normalized);
};