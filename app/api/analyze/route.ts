import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { expenses, budget } = await req.json();

    if (!expenses || !Array.isArray(expenses)) {
      return NextResponse.json({ error: 'Invalid expenses data' }, { status: 400 });
    }

    const prompt = `
      You are an expert financial advisor. Analyze the following expense data and provide 3-4 actionable, real-time recommendations for the user.
      
      Monthly Budget: ₹${budget}
      Total Expenses: ₹${expenses.reduce((sum: number, e: any) => sum + e.amount, 0)}
      
      Expenses List:
      ${expenses.map((e: any) => `- ${e.date}: ${e.category} - ₹${e.amount} (${e.time})`).join('\n')}
      
      Format your response as a JSON object with an "insights" key containing an array of objects. 
      Each insight object must have:
      - "type": "alert" | "warning" | "success" | "info"
      - "icon": A relevant emoji string
      - "title": A concise title
      - "message": A helpful, specific recommendation
      
      Example:
      {
        "insights": [
          {
            "type": "warning",
            "icon": "☕",
            "title": "High Tea Spending",
            "message": "You've spent ₹500 on tea this week. Consider brewing at home to save ₹1500 monthly."
          }
        ]
      }
      
      Provide only the JSON object.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    const insights = JSON.parse(content || '{"insights": []}');

    // Some models might return { insights: [...] } or just the array.
    // We want the array.
    const result = Array.isArray(insights) ? insights : (insights.insights || []);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
