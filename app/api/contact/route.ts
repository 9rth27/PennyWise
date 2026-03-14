import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/security';

type TurnstileResponse = {
  success: boolean;
};

const REQUEST_SIZE_LIMIT_BYTES = 10_000;
const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 60_000;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
  website: z.string().trim().max(120).optional().default(''),
  turnstileToken: z.string().trim().max(2048).optional().default(''),
});

function responseJson(body: Record<string, unknown>, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'X-Content-Type-Options': 'nosniff',
      ...(extraHeaders || {}),
    },
  });
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

async function isAllowedByRateLimit(identifier: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return rateLimit(identifier, maxRequests, windowMs);
  }

  try {
    const redisHeaders = {
      Authorization: `Bearer ${redisToken}`,
    };

    const key = `pennywise:contact:${identifier}`;
    const encodedKey = encodeURIComponent(key);
    const incrementResponse = await fetch(`${redisUrl}/incr/${encodedKey}`, {
      method: 'POST',
      headers: redisHeaders,
      cache: 'no-store',
    });

    if (!incrementResponse.ok) {
      return rateLimit(identifier, maxRequests, windowMs);
    }

    const incrementData = (await incrementResponse.json()) as { result?: number };
    const currentCount = Number(incrementData.result || 0);

    if (currentCount === 1) {
      const ttlSeconds = Math.ceil(windowMs / 1000);
      await fetch(`${redisUrl}/expire/${encodedKey}/${ttlSeconds}`, {
        method: 'POST',
        headers: redisHeaders,
        cache: 'no-store',
      });
    }

    return currentCount <= maxRequests;
  } catch {
    return rateLimit(identifier, maxRequests, windowMs);
  }
}

function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .trim();
}

function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!origin) {
    return process.env.NODE_ENV !== 'production';
  }

  try {
    const originUrl = new URL(origin);

    if (host && originUrl.host === host) {
      return true;
    }

    if (appUrl) {
      const appOrigin = new URL(appUrl).origin;
      if (originUrl.origin === appOrigin) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return process.env.NODE_ENV !== 'production';
  }

  const body = new URLSearchParams();
  body.set('secret', secretKey);
  body.set('response', token);
  body.set('remoteip', ip);

  const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!verifyResponse.ok) {
    return false;
  }

  const result = (await verifyResponse.json()) as TurnstileResponse;
  return Boolean(result.success);
}

function validatePayload(payload: unknown) {
  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: 'Please fill in all fields correctly.' as const };
  }

  const cleanPayload = {
    name: cleanText(parsed.data.name),
    email: cleanText(parsed.data.email).toLowerCase(),
    subject: cleanText(parsed.data.subject),
    message: cleanText(parsed.data.message),
    website: cleanText(parsed.data.website),
    turnstileToken: cleanText(parsed.data.turnstileToken),
  };

  if (!cleanPayload.name || !cleanPayload.email || !cleanPayload.subject || !cleanPayload.message) {
    return { error: 'Please fill in all fields correctly.' as const };
  }

  if (cleanPayload.website) {
    return { isBot: true as const };
  }

  return cleanPayload;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAllowedOrigin(req)) {
      return responseJson({ error: 'Invalid request origin.' }, 403);
    }

    const ip = getClientIp(req);

    const contentLengthHeader = req.headers.get('content-length');
    if (contentLengthHeader && Number(contentLengthHeader) > REQUEST_SIZE_LIMIT_BYTES) {
      return responseJson({ error: 'Payload too large.' }, 413);
    }

    if (!(await isAllowedByRateLimit(`ip:${ip}`, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS))) {
      return responseJson(
        { error: 'Too many requests. Please try again later.' },
        429,
        { 'Retry-After': '60' },
      );
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return responseJson({ error: 'Invalid content type.' }, 400);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return responseJson({ error: 'Invalid JSON.' }, 400);
    }

    const validated = validatePayload(body);

    if ('isBot' in validated) {
      return responseJson({ success: true }, 200);
    }

    if ('error' in validated) {
      return responseJson({ error: validated.error }, 400);
    }

    if (!(await isAllowedByRateLimit(`email:${validated.email}`, 3, CONTACT_RATE_WINDOW_MS))) {
      return responseJson(
        { error: 'Please wait a moment before sending again.' },
        429,
        { 'Retry-After': '60' },
      );
    }

    if (process.env.NODE_ENV === 'production' && !process.env.TURNSTILE_SECRET_KEY) {
      return responseJson({ error: 'Contact protection is not configured yet.' }, 503);
    }

    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!validated.turnstileToken) {
        return responseJson({ error: 'Please complete verification.' }, 400);
      }

      const isHuman = await verifyTurnstileToken(validated.turnstileToken, ip);
      if (!isHuman) {
        return responseJson({ error: 'Verification failed. Please try again.' }, 400);
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const supportEmail = process.env.SUPPORT_EMAIL || 'parthpatil1958@gmail.com';

    if (!resendApiKey || !fromEmail) {
      return responseJson({ error: 'Contact service is not configured yet.' }, 503);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [supportEmail],
        subject: `[PennyWise Support] ${validated.subject}`,
        text: `Name: ${validated.name}\nEmail: ${validated.email}\n\nMessage:\n${validated.message}`,
        reply_to: validated.email,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return responseJson({ error: 'Unable to send your message right now. Please try again.' }, 502);
    }

    return responseJson({ success: true }, 200);
  } catch {
    return responseJson({ error: 'Unable to send your message right now. Please try again.' }, 500);
  }
}