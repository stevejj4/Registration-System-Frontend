const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isDuplicateEmail(
  email: string,
  existingEmails: string[],
  excludeEmail?: string
): boolean {
  const normalized = normalizeEmail(email);
  const exclude = excludeEmail ? normalizeEmail(excludeEmail) : null;
  return existingEmails.some((e) => {
    const candidate = normalizeEmail(e);
    if (exclude && candidate === exclude) return false;
    return candidate === normalized;
  });
}

export function validatePasswordMinLength(
  password: string,
  minLength = 8
): boolean {
  return password.length >= minLength;
}
