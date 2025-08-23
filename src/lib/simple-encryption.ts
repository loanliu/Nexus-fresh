// Simple Fallback Encryption Utility
// This provides basic encryption when Web Crypto API is not available
// Note: This is less secure than Web Crypto API but provides basic obfuscation

export class SimpleEncryption {
  private static readonly KEY = 'nexus-api-key-2024';
  
  /**
   * Simple XOR-based encryption (basic obfuscation)
   * @param text - Text to encrypt
   * @returns Encrypted string
   */
  static encrypt(text: string): string {
    if (!text) return '';
    
    try {
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = this.KEY.charCodeAt(i % this.KEY.length);
        const encryptedChar = charCode ^ keyChar;
        result += String.fromCharCode(encryptedChar);
      }
      
      // Convert to base64 for storage
      return btoa(result);
    } catch (error) {
      console.error('Simple encryption failed:', error);
      return text; // Fallback to plain text
    }
  }
  
  /**
   * Simple XOR-based decryption
   * @param encryptedText - Encrypted text to decrypt
   * @returns Decrypted string
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      // Convert from base64
      const decoded = atob(encryptedText);
      
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyChar = this.KEY.charCodeAt(i % this.KEY.length);
        const decryptedChar = charCode ^ keyChar;
        result += String.fromCharCode(decryptedChar);
      }
      
      return result;
    } catch (error) {
      console.error('Simple decryption failed:', error);
      return encryptedText; // Return as-is if decryption fails
    }
  }
  
  /**
   * Check if text appears to be encrypted
   * @param text - Text to check
   * @returns True if text appears to be encrypted
   */
  static isEncrypted(text: string): boolean {
    try {
      // Try to decode from base64
      atob(text);
      return true;
    } catch {
      return false;
    }
  }
}
