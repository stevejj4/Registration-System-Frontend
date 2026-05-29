/**
 * Regular expression used to validate email addresses.
 *
 * This pattern checks for:
 * - Valid username characters before "@"
 * - Proper domain formatting
 * - Valid top-level domains
 *
 * Examples of valid emails:
 * - john@example.com
 * - user.name@company.co.ke
 * - admin123@gmail.com
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates whether the provided email address
 * matches the expected email format.
 *
 * The email is trimmed before validation to avoid
 * issues caused by accidental spaces.
 *
 * @param email email address to validate
 *
 * @returns true if the email format is valid
 */
export function isValidEmail(email: string): boolean {

  // Remove leading and trailing spaces
  const trimmed = email.trim();

  // Reject empty values after trimming
  if (!trimmed) {
    return false;
  }

  // Validate email against regex pattern
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Normalizes an email address for safe comparisons.
 *
 * This helps avoid duplicate detection issues caused by:
 * - uppercase/lowercase differences
 * - accidental whitespace
 *
 * Example:
 * " Admin@Gmail.com "
 * becomes:
 * "admin@gmail.com"
 *
 * @param email email address to normalize
 *
 * @returns normalized email string
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks whether an email already exists
 * in a list of existing email addresses.
 *
 * Email comparison is normalized to ensure:
 * - case-insensitive matching
 * - whitespace-safe comparison
 *
 * The optional excludeEmail parameter is useful
 * during update/edit operations where the current
 * user's existing email should not count as a duplicate.
 *
 * Example:
 * - Editing your profile without changing your email
 *
 * @param email email being checked
 * @param existingEmails list of existing emails
 * @param excludeEmail optional email to ignore during comparison
 *
 * @returns true if a duplicate email exists
 */
export function isDuplicateEmail(
  email: string,
  existingEmails: string[],
  excludeEmail?: string
): boolean {

  // Normalize the incoming email
  const normalized = normalizeEmail(email);

  // Normalize excluded email if provided
  const exclude =
    excludeEmail ? normalizeEmail(excludeEmail) : null;

  return existingEmails.some((e) => {

    // Normalize existing email before comparison
    const candidate = normalizeEmail(e);

    // Ignore excluded email during update scenarios
    if (exclude && candidate === exclude) {
      return false;
    }

    // Check for duplicate match
    return candidate === normalized;
  });
}

/**
 * Validates whether a password meets
 * the minimum required length.
 *
 * The default minimum length is 8 characters.
 *
 * @param password password being validated
 * @param minLength minimum allowed password length
 *
 * @returns true if password meets minimum length requirement
 */
export function validatePasswordMinLength(
  password: string,
  minLength = 8
): boolean {

  return password.length >= minLength;
}