export type Credentials = {
  readonly email: string;
  readonly password: string;
};

export type Session = {
  readonly token: string;
  readonly email: string;
};

export type CredentialField = "email" | "password";

export type FieldErrors = Readonly<Partial<Record<CredentialField, string>>>;

export type AccountFailure =
  | { readonly kind: "invalid"; readonly fields: FieldErrors }
  | { readonly kind: "rejected" }
  | { readonly kind: "email_taken" }
  | { readonly kind: "unavailable" };

export type CredentialsPurpose = "log_in" | "register";

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MILLISECONDS_PER_SECOND = 1000;

const emailError = (email: string): string | undefined => {
  if (email === "") {
    return "Saisissez votre e-mail.";
  }
  return EMAIL_SHAPE.test(email) ? undefined : "Cet e-mail n'est pas valide.";
};

const passwordError = (password: string, purpose: CredentialsPurpose): string | undefined => {
  if (password === "") {
    return "Saisissez votre mot de passe.";
  }
  return purpose === "register" && password.length < MIN_PASSWORD_LENGTH
    ? `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
    : undefined;
};

export const normalized = ({ email, password }: Credentials): Credentials => ({
  email: email.trim(),
  password,
});

export const credentialErrors = (
  { email, password }: Credentials,
  purpose: CredentialsPurpose,
): FieldErrors =>
  Object.fromEntries(
    Object.entries({ email: emailError(email), password: passwordError(password, purpose) }).filter(
      ([, error]) => error !== undefined,
    ),
  );

const decodedPayload = (token: string): unknown => {
  const payload = token.split(".")[1] ?? "";
  try {
    return JSON.parse(atob(payload.replaceAll("-", "+").replaceAll("_", "/")));
  } catch {
    return undefined;
  }
};

const expiresAt = (token: string): number | undefined => {
  const payload = decodedPayload(token);
  return typeof payload === "object" &&
    payload !== null &&
    "exp" in payload &&
    typeof payload.exp === "number"
    ? payload.exp * MILLISECONDS_PER_SECOND
    : undefined;
};

export const isActive = (session: Session, now: number): boolean => {
  const expiry = expiresAt(session.token);
  return expiry !== undefined && expiry > now;
};
