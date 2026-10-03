import "server-only";
import { hash, verify } from "@node-rs/argon2";

// OWASP-recommended argon2id parameters (19 MiB, t=2, p=1).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// A real hash computed once, used to equalize timing when the email does not exist.
let dummyHash: Promise<string> | undefined;
export function dummyVerify(password: string) {
  dummyHash ??= hash("timing-equalizer-not-a-real-password", OPTIONS);
  return dummyHash.then((h) => verifyPassword(h, password));
}

export const PASSWORD_RULES = {
  minLength: 10,
  describe: "At least 10 characters, including a letter and a number.",
};

export function isStrongPassword(password: string) {
  return (
    password.length >= PASSWORD_RULES.minLength &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}
