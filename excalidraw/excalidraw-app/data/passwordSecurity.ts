/**
 * Cryptographic Password Protection for SKETION Boards (CN-002)
 * Ensures passwords are saved as salted SHA-256 hashes rather than plaintext.
 */

export async function hashPassword(password: string): Promise<string> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `sha256$${salt}$${hashHex}`;
}

export async function verifyPassword(
  inputPassword: string,
  storedHashOrPlain?: string | null,
): Promise<boolean> {
  if (!storedHashOrPlain) return true;

  if (storedHashOrPlain.startsWith("sha256$")) {
    const parts = storedHashOrPlain.split("$");
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const expectedHash = parts[2];

    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${inputPassword}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex === expectedHash;
  }

  // Legacy fallback for previously stored plaintext passwords
  return inputPassword === storedHashOrPlain;
}
