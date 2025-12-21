// Security utilities for Innovative Ideas Application

/**
 * Security headers and CSP management
 */
export class SecurityHeaders {
  /**
   * Set security meta tags for the document
   */
  static setSecurityMetaTags(): void {
    // Content Security Policy is already set in index.html
    // Add additional security measures here if needed

    // Note: X-Frame-Options should be set via HTTP headers by the server (SharePoint)
    // Meta tag approach is not recommended and may cause browser warnings

    // Prevent MIME type sniffing
    const noSniff = document.createElement("meta");
    noSniff.setAttribute("http-equiv", "X-Content-Type-Options");
    noSniff.setAttribute("content", "nosniff");
    document.head.appendChild(noSniff);
  }
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Sanitize HTML content (basic)
   */
  static sanitizeHTML(html: string): string {
    if (typeof html !== "string") return "";

    // Remove script tags and other dangerous elements
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+="[^"]*"/gi, "");
  }
}

/**
 * CSRF protection utilities
 */
export class CSRFProtection {
  private static token: string | null = null;

  /**
   * Get or generate CSRF token
   */
  static getToken(): string {
    if (!this.token) {
      this.token = this.generateToken();
      // Store in sessionStorage for persistence
      sessionStorage.setItem("csrf-token", this.token);
    }
    return this.token;
  }

  /**
   * Generate a random token
   */
  private static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    const storedToken = sessionStorage.getItem("csrf-token");
    return storedToken === token;
  }
}
