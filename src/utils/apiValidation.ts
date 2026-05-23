/**
 * Validates numeric IDs before HTTP calls.
 * Rejects null, undefined, NaN, empty string, and literal "undefined"/"null".
 */
export function validateId(id: unknown, label = "ID"): number {
  if (id === null || id === undefined) {
    const message = `Invalid ${label}: value is ${String(id)}`;
    console.error(message);
    throw new Error(message);
  }

  if (typeof id === "string") {
    const trimmed = id.trim();
    if (
      trimmed === "" ||
      trimmed === "undefined" ||
      trimmed === "null"
    ) {
      const message = `Invalid ${label}: "${trimmed}" is not a valid identifier`;
      console.error(message);
      throw new Error(message);
    }
  }

  const numeric = typeof id === "number" ? id : Number(id);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    const message = `Invalid ${label}: "${String(id)}" is not a valid positive number`;
    console.error(message);
    throw new Error(message);
  }

  return numeric;
}

export function tryValidateId(id: unknown): number | null {
  try {
    return validateId(id);
  } catch {
    return null;
  }
}
