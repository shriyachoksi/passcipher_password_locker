// Cipher utilities supporting Vigenère and a modified Vernam (XOR + base64).
export type CipherAlgorithm = "vigenere" | "vernam";

export class PasswordCipher {
  private static readonly ALPHABET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  // private static readonly ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Optional key behavior: when key is empty, return plaintext unchanged.
  static encryptVigenere(plaintext: string, key: string): string {
    if (!key) return plaintext;
    let encrypted = "";
    const keyLength = key.length;
    for (let i = 0; i < plaintext.length; i++) {
      const char = plaintext[i];
      const keyChar = key[i % keyLength];
      const charIndex = this.ALPHABET.indexOf(char);
      const keyIndex = this.ALPHABET.indexOf(keyChar);
      if (charIndex === -1 || keyIndex === -1) {
        encrypted += char;
      } else {
        const newIndex = (charIndex + keyIndex) % this.ALPHABET.length;
        encrypted += this.ALPHABET[newIndex];
      }
    }
    return encrypted;
  }

  static decryptVigenere(ciphertext: string, key: string): string {
    if (!key) return ciphertext;
    let decrypted = "";
    const keyLength = key.length;
    for (let i = 0; i < ciphertext.length; i++) {
      const char = ciphertext[i];
      const keyChar = key[i % keyLength];
      const charIndex = this.ALPHABET.indexOf(char);
      const keyIndex = this.ALPHABET.indexOf(keyChar);
      if (charIndex === -1 || keyIndex === -1) {
        decrypted += char;
      } else {
        const newIndex =
          (charIndex - keyIndex + this.ALPHABET.length) % this.ALPHABET.length;
        decrypted += this.ALPHABET[newIndex];
      }
    }
    return decrypted;
  }

  // Modified Vernam: XOR char codes with key and base64-encode
  static encryptVernam(plaintext: string, key: string): string {
    if (!key) return plaintext;
    const keyLength = key.length;
    const bytes: number[] = [];
    for (let i = 0; i < plaintext.length; i++) {
      const p = plaintext.charCodeAt(i);
      const k = key.charCodeAt(i % keyLength);
      bytes.push(p ^ k);
    }
    return PasswordCipher.base64Encode(new Uint8Array(bytes));
  }

  static decryptVernam(ciphertext: string, key: string): string {
    if (!key) return ciphertext;
    const data = PasswordCipher.base64Decode(ciphertext);
    const keyLength = key.length;
    let out = "";
    for (let i = 0; i < data.length; i++) {
      const b = data[i];
      const k = key.charCodeAt(i % keyLength);
      out += String.fromCharCode(b ^ k);
    }
    return out;
  }

  // Prefix with algorithm for storage
  static encrypt(
    plaintext: string,
    key: string,
    algorithm: CipherAlgorithm
  ): string {
    if (algorithm === "vigenere") {
      return `vig:${this.encryptVigenere(plaintext, key)}`;
    }
    return `ver:${this.encryptVernam(plaintext, key)}`;
  }

  static decrypt(stored: string, key: string): string {
    if (stored.startsWith("vig:"))
      return this.decryptVigenere(stored.slice(4), key);
    if (stored.startsWith("ver:"))
      return this.decryptVernam(stored.slice(4), key);
    return this.decryptVigenere(stored, key);
  }

  static detectAlgorithm(stored: string): CipherAlgorithm | "unknown" {
    if (stored.startsWith("vig:")) return "vigenere";
    if (stored.startsWith("ver:")) return "vernam";
    return "unknown";
  }

  private static base64Encode(bytes: Uint8Array): string {
    if (typeof window !== "undefined" && (window as any).btoa) {
      let binary = "";
      for (let i = 0; i < bytes.length; i++)
        binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }
    return Buffer.from(bytes).toString("base64");
  }

  private static base64Decode(text: string): Uint8Array {
    if (typeof window !== "undefined" && (window as any).atob) {
      const binary = atob(text);
      const out = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
      return out;
    }
    return new Uint8Array(Buffer.from(text, "base64"));
  }
}
