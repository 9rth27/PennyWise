import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CONTACT_RECIPIENT_EMAIL = 'parthpatil1958@gmail.com';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

function responseJson(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status });
}

function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return responseJson({ error: 'Invalid request.' }, 400);
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return responseJson({ error: 'Please fill in all fields correctly.' }, 400);
    }

    const validated = {
      name: cleanText(parsed.data.name),
      email: cleanText(parsed.data.email).toLowerCase(),
      subject: cleanText(parsed.data.subject),
      message: cleanText(parsed.data.message),
    };

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const supportEmail = CONTACT_RECIPIENT_EMAIL;

    if (!resendApiKey || !fromEmail || !supportEmail) {
      return responseJson({ success: true }, 200);
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
