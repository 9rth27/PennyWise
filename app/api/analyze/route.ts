import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

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
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawExpenses = Array.isArray(body?.expenses) ? body.expenses : [];
    if (rawExpenses.length === 0) {
      return NextResponse.json([]);
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json([]);
    }

    const budgetAmount = Number(body?.budget);
    const safeBudget = Number.isFinite(budgetAmount) && budgetAmount > 0 ? budgetAmount : 0;

    const limitedExpenses = rawExpenses
      .slice(0, 100)
      .map((item: any) => ({
        category: String(item?.category || 'misc').trim() || 'misc',
        amount: Number(item?.amount) || 0,
      }))
      .filter((item: { amount: number }) => item.amount >= 0);

    if (limitedExpenses.length === 0) {
      return NextResponse.json([]);
    }

    const totalExpenses = limitedExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    const prompt = `
      You are a financial advisor. Analyze this expense data and provide 2-3 actionable recommendations.
      
      Monthly Budget: ₹${Math.round(safeBudget)}
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

    return NextResponse.json(safeResult);
  } catch (error: any) {
    console.error('Analysis error');
    return NextResponse.json([]);
  }
}
