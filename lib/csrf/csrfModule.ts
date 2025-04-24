import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';

interface CsrfTokenResponse {
  csrfToken: string;
  message: string;
}

interface CsrfValidationResponse {
  valid: boolean;
  error?: string;
}

/**
 * CSRF Module that implements the OWASP Double-Submit Cookie pattern with HMAC
 * This implementation follows the security best practices recommended by OWASP
 */
export class CsrfModule {
  private readonly secret: string;
  
  constructor() {
    // Get a secure secret key from environment variables
    // In production, this should be a strong, securely stored key
    const csrfSecret = process.env.CSRF_SECRET;

    if (!csrfSecret) {
      throw new Error('CSRF_SECRET is not set');
    }

    this.secret = csrfSecret;
  }
  
  /**
   * Generates a CSRF token using HMAC following the OWASP recommendations for
   * Signed Double-Submit Cookie pattern
   * @returns The generated CSRF token
   */
  async generateToken(): Promise<string> {
    // Get current session ID or generate a session-dependent value
    let sessionId: string;
    const session = await getServerSession();

    if (session?.user?.email) {
      // Use session information as part of the token generation
      // Hash the session info to avoid exposing sensitive data
      const sessionHash = crypto.createHash('sha256')
        .update(`${session.user.email}-${session?.accessToken || ''}`)
        .digest('hex');
      sessionId = sessionHash;
    } else {
      // Fallback when no session is available (anonymous users)
      sessionId = crypto.randomBytes(16).toString('hex');
    }

    // Generate a cryptographically random value for anti-collision
    const randomValue = crypto.randomBytes(32).toString('hex');

    // Create the message payload as per OWASP guidelines
    const message = `${sessionId.length}!${sessionId}!${randomValue.length}!${randomValue}`;

    // Generate the HMAC hash
    const hmac = crypto.createHmac('sha256', this.secret)
      .update(message)
      .digest('hex');

    // Final CSRF token is the HMAC hash concatenated with the random value
    return `${hmac}.${randomValue}`;
  }

  /**
   * Sets the CSRF token cookie
   * @param token The CSRF token to set in the cookie
   */
  async setCookie(token: string): Promise<void> {
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    };

    const cookieStore = await cookies();
    cookieStore.set('csrf_token', token, cookieOptions);
  }

  /**
   * Gets the CSRF token from the cookie
   * @returns The CSRF token from the cookie or undefined if not present
   */
  async getCookieToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get('csrf_token')?.value;
  }

  /**
   * Validates a CSRF token
   * @param token The CSRF token to validate
   * @returns Boolean indicating if the token is valid
   */
  async validateToken(token: string): Promise<boolean> {
    if (!token || !token.includes('.')) {
      return false;
    }

    try {
      // Split the token to get the HMAC and random value
      const [hmacFromRequest, randomValue] = token.split('.');

      // Get current session ID
      let sessionId: string;
      const session = await getServerSession();

      if (session?.user?.email) {
        // Recreate the same session hash we used when generating the token
        const sessionHash = crypto.createHash('sha256')
          .update(`${session.user.email}-${session?.accessToken || ''}`)
          .digest('hex');
        sessionId = sessionHash;
      } else {
        // If we can't recreate the session ID, the token can't be valid
        return false;
      }

      // Recreate the message
      const message = `${sessionId.length}!${sessionId}!${randomValue.length}!${randomValue}`;

      // Generate the expected HMAC
      const expectedHmac = crypto.createHmac('sha256', this.secret)
        .update(message)
        .digest('hex');

      // Compare the HMACs using constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(hmacFromRequest, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );
    } catch (error) {
      console.error('Error validating CSRF token:', error);
      return false;
    }
  }

  /**
   * Generates a CSRF token and sets it in a cookie
   * @returns The generated token and a success message
   */
  async generateTokenResponse(): Promise<CsrfTokenResponse> {
    const csrfToken = await this.generateToken();
    this.setCookie(csrfToken);

    return {
      csrfToken,
      message: 'CSRF token generated successfully'
    };
  }

  /**
   * Validates a CSRF token from a request
   * @param csrfToken The token to validate
   * @returns A validation response object
   */
  async validateTokenResponse(csrfToken?: string): Promise<CsrfValidationResponse> {
    if (!csrfToken) {
      return {
        valid: false,
        error: 'CSRF token is missing'
      };
    }

    const isValid = await this.validateToken(csrfToken);

    if (isValid) {
      return { valid: true };
    } else {
      return {
        valid: false,
        error: 'Invalid CSRF token'
      };
    }
  }
}

// Export a singleton instance
export const csrfModule = new CsrfModule();