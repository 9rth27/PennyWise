# PennyWise Security Guide

## Overview
This document outlines the security measures implemented in PennyWise to protect user financial data.

## Security Features Implemented

### 1. **API Key Protection**
- ✅ API keys stored in `.env.local` (never in code)
- ✅ Keys only accessible on server-side
- ✅ Client cannot access or expose API keys
- ✅ Environment validation at startup

**How to secure:**
```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Add your Groq API key
echo "GROQ_API_KEY=your_key_here" >> .env.local

# Never commit .env.local to Git
echo ".env.local" >> .gitignore
```

### 2. **Input Validation & Sanitization**
- ✅ All expenses validated before storage
- ✅ Budget amounts checked for valid range (0 - 10,000,000)
- ✅ Category whitelist (tea, lunch, auto, groceries, misc, etc.)
- ✅ String sanitization to prevent XSS attacks
- ✅ Date format validation (YYYY-MM-DD)

### 3. **Secure ID Generation**
- ✅ Replaced predictable `Date.now()` with cryptographic random IDs
- ✅ Makes it impossible to guess or enumerate expense IDs
- ✅ Uses `crypto.getRandomValues()` for true randomness

### 4. **Rate Limiting**
- ✅ API endpoint limited to 10 requests per minute per IP
- ✅ Returns HTTP 429 (Too Many Requests) when limit exceeded
- ✅ Helps prevent abuse and DoS attacks

### 5. **Security Headers**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Permissions-Policy: geolocation=(), microphone=(), camera=()
Referrer-Policy: strict-origin-when-cross-origin
```

### 6. **Content Security Policy (CSP)**
- ✅ Restricts script execution to trusted sources
- ✅ Prevents inline script execution
- ✅ Only allows connections to Groq API
- ✅ Disables frame embedding

### 7. **CORS Protection**
- ✅ Origin validation
- ✅ Restricted HTTP methods
- ✅ Credentials handled securely
- ✅ Preflight request support

### 8. **Data Storage Security**
- ✅ localStorage validation on load
- ✅ Filtered invalid data automatically
- ✅ Try-catch blocks prevent crashes from corrupted data
- ✅ Size limits on stored data

### 9. **Error Handling**
- ✅ Generic error messages to users (no sensitive info)
- ✅ Detailed errors logged server-side only
- ✅ API exposes no stack traces or internal errors
- ✅ Failed requests return safe 500 status

### 10. **Environment-Specific Protections**
- ✅ Source maps disabled in production
- ✅ Automatic validation of required env vars
- ✅ Warnings for missing configurations
- ✅ Different error handling for dev vs production

## Security Checklist

### Before Deployment
- [ ] `.env.local` created and filled with real credentials
- [ ] `.env.local` added to `.gitignore`
- [ ] GROQ_API_KEY is valid and has appropriate permissions
- [ ] `NEXT_PUBLIC_APP_URL` set to your production domain
- [ ] `NODE_ENV=production` set in production
- [ ] All dependencies up to date (`npm audit`)

### Runtime Security
- [ ] HTTPS enabled (required for cookies and security headers)
- [ ] Sensitive console logs removed (`console.error` redacted)
- [ ] No credentials in commit history (`git log` checked)
- [ ] Regular security updates applied

### Storage Security
- ✅ localStorage data validated before use
- ✅ Invalid/corrupted data automatically purged
- ✅ Budget limits enforced (prevents overflow exploits)
- ✅ Amount validation (prevents Infinity, NaN, negatives)

## Common Vulnerabilities Fixed

| Vulnerability | Status | Fix |
|---|---|---|
| XSS (Cross-Site Scripting) | ✅ Fixed | Input sanitization, CSP |
| CSRF (Cross-Site Request Forgery) | ✅ Fixed | SameSite cookies, CORS |
| Exposed API Keys | ✅ Fixed | .env.local, server-side only |
| Predictable IDs | ✅ Fixed | Cryptographic randomness |
| Rate Limiting | ✅ Fixed | Per-IP rate limiting |
| Clickjacking | ✅ Fixed | X-Frame-Options: DENY |
| MIME Sniffing | ✅ Fixed | X-Content-Type-Options |
| Unvalidated Input | ✅ Fixed | Whitelist validation |

## For Developers

### Adding New API Routes
1. Always validate input
2. Use security functions from `@/lib/security.ts`
3. Return generic error messages
4. Log detailed errors server-side only
5. Add rate limiting if needed

### Example Secure API Route
```typescript
import { rateLimit, validateExpense } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.ip || 'unknown';
  if (!rateLimit(ip, 10, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Input validation
  const data = await req.json();
  if (!validateExpense(data)) {
    return NextResponse.json(
      { error: 'Invalid data' },
      { status: 400 }
    );
  }

  // Process safely...
}
```

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public GitHub issue
2. Email: security@pennywise.local (if applicable)
3. Provide details without publishing the vulnerability
4. Allow 30 days for fixes before disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [Next.js Security Best Practices](https://nextjs.org/docs/going-to-production/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Updates

Security measures are reviewed and updated regularly. Keep your dependencies updated with:
```bash
npm audit fix
npm update
```
