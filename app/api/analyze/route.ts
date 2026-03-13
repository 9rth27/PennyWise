import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { rateLimit, validateExpense, validateBudget } from '@/lib/security';

let groq: Groq | null = null;

function getGroqClient() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    groq = new Groq({ apiKey });
  }
  return groq;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting (10 requests per minute per IP)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Check API key is configured
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const { expenses, budget } = body;

    // Validate budget
    if (!validateBudget(budget)) {
      return NextResponse.json(
        { error: 'Invalid budget amount' },
        { status: 400 }
      );
    }

    // Validate expenses array
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json(
        { error: 'Invalid expenses data' },
        { status: 400 }
      );
    }

    // Validate each expense
    if (!expenses.every(validateExpense)) {
      return NextResponse.json(
        { error: 'One or more expenses are invalid' },
        { status: 400 }
      );
    }

    // Limit expenses to 100 to prevent abuse
    const limitedExpenses = expenses.slice(0, 100);
    const totalExpenses = limitedExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    const prompt = `
      You are a financial advisor. Analyze this expense data and provide 2-3 actionable recommendations.
      
      Monthly Budget: ₹${Math.round(budget)}
      Total Expenses: ₹${Math.round(totalExpenses)}
      
      Categories breakdown (limited data):
      ${limitedExpenses.slice(0, 5).map((e: any) => `- ${e.category}: ₹${e.amount}`).join('\n')}
      
      Respond with ONLY valid JSON:
      { "insights": [{ "type": "alert|warning|success|info", "icon": "emoji", "title": "short title", "message": "brief message" }] }
    `;

    const client = getGroqClient();
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      top_p: 0.9,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    
    // Safely parse and validate response
    let parsed: any;
    try {
      parsed = JSON.parse(content || '{}');
    } catch {
      return NextResponse.json(
        [],
        { status: 200 }
      );
    }

    const result = Array.isArray(parsed) ? parsed : (parsed.insights || []);
    
    // Ensure all insights have required fields
    const safeResult = result.filter((insight: any) => 
      insight.type && ['alert', 'warning', 'success', 'info'].includes(insight.type) &&
      insight.icon && insight.title && insight.message
    ).slice(0, 5); // Limit to 5 insights

    return NextResponse.json(safeResult, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    // Don't expose internal errors
    console.error('Analysis error (not exposed to client)');
    return NextResponse.json(
      [],
      { status: 200 }
    );
  }
}
