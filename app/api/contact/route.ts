import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, sanitizeString } from '@/lib/security';

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePayload(payload: ContactPayload) {
  const name = sanitizeString(payload.name || '');
  const email = sanitizeString(payload.email || '').toLowerCase();
  const subject = sanitizeString(payload.subject || '');
  const message = sanitizeString(payload.message || '');

  if (!name || name.length < 2) {
    return { error: 'Please provide a valid name.' };
  }

  if (!email || !isValidEmail(email)) {
    return { error: 'Please provide a valid email address.' };
  }

  if (!subject || subject.length < 3) {
    return { error: 'Please provide a valid subject.' };
  }

  if (!message || message.length < 10) {
    return { error: 'Please provide a detailed message.' };
  }

  return {
    name,
    email,
    subject,
    message,
  };
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 },
      );
    }

    let body: ContactPayload;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 },
      );
    }

    const validated = validatePayload(body);
    if ('error' in validated) {
      return NextResponse.json(
        { error: validated.error },
        { status: 400 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const supportEmail = process.env.SUPPORT_EMAIL || 'parthpatil1958@gmail.com';

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        { error: 'Contact service is not configured yet.' },
        { status: 503 },
      );
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
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unable to send your message right now. Please try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Unable to send your message right now. Please try again.' },
      { status: 500 },
    );
  }
}