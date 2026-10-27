/** Field checks for the auth forms. Each returns an error message, or null when the value is fine. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Better Auth's default password bounds. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const OTP_LENGTH = 6;

export function validateName(name: string): string | null {
  return name.trim().length === 0 ? "Enter your name." : null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (value.length === 0) return "Enter your email.";
  return EMAIL_PATTERN.test(value) ? null : "Enter a valid email address.";
}

/** For sign-in: the server decides what a correct password is, so only emptiness is checked. */
export function validatePasswordPresent(password: string): string | null {
  return password.length === 0 ? "Enter your password." : null;
}

/** For choosing a new password. */
export function validateNewPassword(password: string): string | null {
  if (password.length === 0) return "Enter a password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (confirm.length === 0) return "Confirm your password.";
  return password === confirm ? null : "Passwords do not match.";
}

export function validateOtp(code: string): string | null {
  return /^\d{6}$/.test(code) ? null : `Enter the ${OTP_LENGTH} digit code.`;
}
