'use client';

import React, { useState } from 'react';
import { DashboardCard } from '@/components/dashboard-card';

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I set a monthly budget?',
      answer: 'Go to Settings > Budget Settings and enter your desired monthly spending limit. The dashboard will track your spending against this budget and show you a progress bar.',
    },
    {
      question: 'Can I create custom expense categories?',
      answer: 'Yes! Go to Settings > Manage Expense Categories to add, remove, or customize categories with different colors to match your spending patterns.',
    },
    {
      question: 'How do I export my expense data?',
      answer: 'Visit Settings > Data & Privacy and click "Export Data (CSV)" to download all your expenses as a CSV file that you can use in Excel or other tools.',
    },
    {
      question: 'What does the AI Insights feature do?',
      answer: 'AI Insights analyzes your spending patterns and provides personalized recommendations. It alerts you if you are nearing your budget, identifies your top spending categories, and projects your monthly spending.',
    },
    {
      question: 'Can I delete a transaction?',
      answer: 'Go to Expenses page, find the transaction you want to delete, and click the delete button. The expense will be removed from your records.',
    },
    {
      question: 'How accurate is the spending projection?',
      answer: 'The projection is based on your average daily spending for the current month. It becomes more accurate as more data is collected.',
    },
    {
      question: 'Can I import data from another app?',
      answer: 'Yes! Go to Settings > Data & Privacy and click "Import Data" to upload a CSV file from another expense tracking app.',
    },
    {
      question: 'What currencies are supported?',
      answer: 'We support multiple currencies including INR, USD, EUR, GBP, and AUD. Change your currency in Settings > Display Settings.',
    },
  ];

  const tips = [
    '📱 Use the Quick Add buttons for frequently spent amounts like your daily coffee or lunch cost.',
    '🎯 Set realistic monthly budgets based on your income and necessary expenses.',
    '📊 Check the Analytics dashboard weekly to stay aware of your spending patterns.',
    '🏷️ Use detailed descriptions when adding expenses for better organization.',
    '⚠️ Pay attention to AI Insights alerts to catch overspending early.',
    '📈 Track spending trends over time to identify opportunities to save money.',
    '🔄 Review and adjust your budget monthly based on your actual spending.',
    '💡 Create multiple budgets or sub-categories if you have complex spending patterns.',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black rounded-xl p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="font-black text-4xl mb-2">Help & Documentation</h1>
        <p className="text-gray-600 font-bold text-lg">Learn how to use PennyWise to manage your finances effectively</p>
      </div>

      {/* Tips & Tricks */}
      <DashboardCard title="Tips & Tricks">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tips.map((tip, idx) => (
            <div key={idx} className="border-2 border-black rounded-lg p-3 bg-blue-50">
              <p className="text-sm font-bold text-black">{tip}</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* FAQ */}
      <DashboardCard title="Frequently Asked Questions">
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-2 border-black rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors font-bold text-left"
              >
                <span>{faq.question}</span>
                <span className="text-xl">{expandedFaq === idx ? '−' : '+'}</span>
              </button>
              {expandedFaq === idx && (
                <div className="p-4 bg-white border-t-2 border-black text-gray-700">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Getting Started */}
      <DashboardCard title="Getting Started">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="font-black text-2xl text-black">1</div>
            <div>
              <p className="font-bold text-black">Set Your Budget</p>
              <p className="text-sm text-gray-700">Go to Settings and set your monthly budget limit. This helps track your spending targets.</p>
            </div>
          </div>
          <div className="border-b-2 border-gray-200" />
          <div className="flex gap-4">
            <div className="font-black text-2xl text-black">2</div>
            <div>
              <p className="font-bold text-black">Add Your First Expense</p>
              <p className="text-sm text-gray-700">Use the Quick Add buttons or go to Add Expense page to record your first transaction.</p>
            </div>
          </div>
          <div className="border-b-2 border-gray-200" />
          <div className="flex gap-4">
            <div className="font-black text-2xl text-black">3</div>
            <div>
              <p className="font-bold text-black">Customize Categories</p>
              <p className="text-sm text-gray-700">Visit Settings to create custom categories that match your spending habits.</p>
            </div>
          </div>
          <div className="border-b-2 border-gray-200" />
          <div className="flex gap-4">
            <div className="font-black text-2xl text-black">4</div>
            <div>
              <p className="font-bold text-black">Review Analytics</p>
              <p className="text-sm text-gray-700">Check the Analytics dashboard to understand your spending patterns and trends.</p>
            </div>
          </div>
          <div className="border-b-2 border-gray-200" />
          <div className="flex gap-4">
            <div className="font-black text-2xl text-black">5</div>
            <div>
              <p className="font-bold text-black">Monitor AI Insights</p>
              <p className="text-sm text-gray-700">Pay attention to AI-powered insights on your dashboard for smart spending recommendations.</p>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Contact Support */}
      <div className="border-4 border-black rounded-xl p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-black text-2xl mb-3">Need More Help?</h2>
        <p className="mb-4 font-bold">If you have questions or feedback, feel free to reach out. We're here to help!</p>
        <div className="flex gap-3 flex-wrap">
          <button className="border-2 border-white rounded-lg px-6 py-2 font-bold hover:bg-gray-800 transition-colors">
            📧 Email Support
          </button>
          <button className="border-2 border-white rounded-lg px-6 py-2 font-bold hover:bg-gray-800 transition-colors">
            📱 Contact Form
          </button>
        </div>
      </div>
    </div>
  );
}
