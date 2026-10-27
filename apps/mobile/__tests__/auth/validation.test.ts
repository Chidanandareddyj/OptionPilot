import {
  validateEmail,
  validateName,
  validateNewPassword,
  validateOtp,
  validatePasswordMatch,
  validatePasswordPresent,
} from "@/lib/auth/validation";

describe("validation", () => {
  it("checks the email", () => {
    expect(validateEmail("")).toBe("Enter your email.");
    expect(validateEmail("  ")).toBe("Enter your email.");
    expect(validateEmail("asha@")).toBe("Enter a valid email address.");
    expect(validateEmail("asha example@x.co")).toBe("Enter a valid email address.");
    expect(validateEmail(" asha@example.com ")).toBeNull();
  });

  it("checks the name", () => {
    expect(validateName("   ")).toBe("Enter your name.");
    expect(validateName("Asha")).toBeNull();
  });

  it("checks a new password against the 8 to 128 character bounds", () => {
    expect(validateNewPassword("")).toBe("Enter a password.");
    expect(validateNewPassword("short")).toBe("Use at least 8 characters.");
    expect(validateNewPassword("x".repeat(129))).toBe("Use at most 128 characters.");
    expect(validateNewPassword("eight888")).toBeNull();
  });

  it("only asks for a password on sign-in", () => {
    expect(validatePasswordPresent("")).toBe("Enter your password.");
    expect(validatePasswordPresent("x")).toBeNull();
  });

  it("checks the confirmation", () => {
    expect(validatePasswordMatch("abc12345", "")).toBe("Confirm your password.");
    expect(validatePasswordMatch("abc12345", "abc12346")).toBe("Passwords do not match.");
    expect(validatePasswordMatch("abc12345", "abc12345")).toBeNull();
  });

  it("wants exactly six digits", () => {
    expect(validateOtp("12345")).toBe("Enter the 6 digit code.");
    expect(validateOtp("12345a")).toBe("Enter the 6 digit code.");
    expect(validateOtp("123456")).toBeNull();
  });
});
