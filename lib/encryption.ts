export type CipherAlgorithm = "vigenere" | "vernam" | "hill";

export class PasswordCipher {
  static detectAlgorithm(stored: string): CipherAlgorithm | "unknown" {
    if (stored.startsWith("vig:")) return "vigenere";
    if (stored.startsWith("ver:")) return "vernam";
    if (stored.startsWith("hil:")) return "hill";
    return "unknown";
  }
  private static readonly ALPHABET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  // ========== VIGENERE ========== //
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

  // ========== VERNAM (XOR + Base64) ========== //
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

  // ========== HILL (2×2 Byte Matrix Mod 256) ========== //
  static encryptHill(plaintext: string, key: string): string {
    if (!key) return plaintext;

    // derive key matrix
    const kb: number[] = [];
    for (let i = 0; i < 4; i++) kb.push((key.charCodeAt(i) || 1) & 0xff);
    let a = kb[0] | 1;
    let b = kb[1] & 0xff;
    let c = kb[2] & 0xff;
    let d = kb[3] | 1;

    // ensure invertible determinant (odd)
    let det = (a * d - b * c) & 0xff;
    if (det % 2 === 0) {
      d = (d ^ 1) & 0xff;
      det = (a * d - b * c) & 0xff;
    }

    // convert plaintext to bytes
    const bytes: number[] = Array.from(
      plaintext,
      (ch) => ch.charCodeAt(0) & 0xff
    );
    if (bytes.length % 2 === 1) bytes.push(0); // pad

    const out: number[] = [];
    for (let i = 0; i < bytes.length; i += 2) {
      const [p1, p2] = [bytes[i], bytes[i + 1]];
      out.push((a * p1 + b * p2) & 0xff);
      out.push((c * p1 + d * p2) & 0xff);
    }

    return `hil:${PasswordCipher.base64Encode(new Uint8Array(out))}`;
  }

  static decryptHill(ciphertext: string, key: string): string {
    if (!key) return ciphertext;
    const data = PasswordCipher.base64Decode(ciphertext);

    const kb: number[] = [];
    for (let i = 0; i < 4; i++) kb.push((key.charCodeAt(i) || 1) & 0xff);
    let a = kb[0] | 1;
    let b = kb[1] & 0xff;
    let c = kb[2] & 0xff;
    let d = kb[3] | 1;

    // repeat determinant parity logic
    let det = (a * d - b * c) & 0xff;
    if (det % 2 === 0) {
      d = (d ^ 1) & 0xff;
      det = (a * d - b * c) & 0xff;
    }

    const detInv = PasswordCipher.modInv(det, 256);
    if (detInv === null) return "";

    // inverse matrix = detInv * [d, -b; -c, a]
    const ia = (detInv * d) & 0xff;
    const ib = (256 - ((detInv * b) % 256)) % 256;
    const ic = (256 - ((detInv * c) % 256)) % 256;
    const id = (detInv * a) & 0xff;

    const outChars: number[] = [];
    for (let i = 0; i < data.length; i += 2) {
      const [c1, c2] = [data[i] || 0, data[i + 1] || 0];
      const p1 = (ia * c1 + ib * c2) & 0xff;
      const p2 = (ic * c1 + id * c2) & 0xff;
      outChars.push(p1, p2);
    }

    if (outChars.length && outChars[outChars.length - 1] === 0) outChars.pop();
    return String.fromCharCode(...outChars);
  }

  // modular inverse using Extended Euclid
  private static modInv(a: number, m: number): number | null {
    a %= m;
    for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
    return null;
  }

  // ========== SHARED UTILITIES ========== //
  static encrypt(
    plaintext: string,
    key: string,
    algorithm: CipherAlgorithm
  ): string {
    if (algorithm === "vigenere")
      return `vig:${this.encryptVigenere(plaintext, key)}`;
    if (algorithm === "vernam")
      return `ver:${this.encryptVernam(plaintext, key)}`;
    return this.encryptHill(plaintext, key);
  }

  static decrypt(stored: string, key: string): string {
    if (stored.startsWith("vig:"))
      return this.decryptVigenere(stored.slice(4), key);
    if (stored.startsWith("ver:"))
      return this.decryptVernam(stored.slice(4), key);
    if (stored.startsWith("hil:"))
      return this.decryptHill(stored.slice(4), key);
    return this.decryptVigenere(stored, key);
  }

  private static base64Encode(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64");
  }

  private static base64Decode(text: string): Uint8Array {
    return new Uint8Array(Buffer.from(text, "base64"));
  }
}
