// Shared form validators — previously duplicated 4-6x inline across
// Login/Register/ForgotPassword/InviteUser in the old app. One copy, reused
// by every form.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
const USER_ID_RE = /^[a-zA-Z0-9._]{3,30}$/;
const PHONE_RE = /^\d{10}$/;
// Must mirror SignupCreateRequestDTO's @Pattern exactly (backend/.../dto/signup) —
// the signup endpoint rejects anything this doesn't match, unlike reset-password.
const SIGNUP_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.@$!%*#?&])[A-Za-z\d.@$!%*#?&]{8,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_RE.test(value);
}

export function isValidUserId(value: string): boolean {
  return USER_ID_RE.test(value);
}

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value);
}

export function isValidSignupPassword(value: string): boolean {
  return SIGNUP_PASSWORD_RE.test(value);
}

export const validationMessages = {
  email: "Enter a valid email address",
  password:
    "Password must be at least 6 characters and include an uppercase letter, a lowercase letter, a number, and a special character",
  signupPassword:
    "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and one of . @ $ ! % * # ? &",
  userId: "User ID must be 3-30 characters (letters, numbers, dots, underscores)",
  phone: "Enter a valid 10-digit phone number",
};
