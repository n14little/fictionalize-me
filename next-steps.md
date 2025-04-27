# Authentication System Improvements

## High Priority

### 2. Rate Limiting
- Implement rate limiting for authentication attempts
- Add rate limiting to API endpoints
- Consider using a package like `express-rate-limit` or similar

### 3. Session Security
- Reduce session max age from 30 days to a more secure duration (e.g., 24 hours)
- Implement refresh token mechanism
- Add session revocation capabilities
- Add session monitoring for suspicious activity

## Medium Priority

### 4. Error Handling
- Implement more detailed error logging for security events
- Create specific error messages for different authentication failures
- Add audit logging for authentication attempts

### 5. API Security
- Add request validation middleware
- Implement proper CORS policies
- Add request size limits to prevent DoS attacks
- Validate input data more strictly

### 6. Security Headers
- Add Content-Security-Policy header
- Implement X-Frame-Options
- Add X-Content-Type-Options
- Set Referrer-Policy
- Add Strict-Transport-Security (HSTS)

## Low Priority

### 7. Documentation
- Document password requirements for users
- Create security best practices guide
- Document authentication flow and security measures

### 8. Monitoring
- Implement authentication attempt monitoring
- Set up alerts for suspicious activity
- Add logging for security-related events

## Implementation Notes

### Rate Limiting
```typescript
// Example rate limiter
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Security Headers
```typescript
// Example middleware
export function securityHeaders(req: Request) {
  return {
    'Content-Security-Policy': "default-src 'self'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
}
```

# App thoughts

## Timer
Perhaps the timer from a non-entry page should just take the user to a modal where the timer begins.

Perhaps all editing should happen in this modal?