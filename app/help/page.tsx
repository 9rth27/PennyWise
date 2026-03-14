'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { DashboardCard } from '@/components/dashboard-card';
import { toast } from 'sonner';

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTurnstileReady, setIsTurnstileReady] = useState(false);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '',
    turnstileToken: '',
  });
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

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

  const resetContactForm = () => {
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      website: '',
      turnstileToken: '',
    });

    const turnstile = (window as any).turnstile;
    if (turnstileWidgetId && turnstile?.reset) {
      turnstile.reset(turnstileWidgetId);
    }
  };

  useEffect(() => {
    if (!showContactForm || !turnstileSiteKey || !isTurnstileReady || !turnstileContainerRef.current) {
      return;
    }

    const turnstile = (window as any).turnstile;
    if (!turnstile) {
      return;
    }

    if (turnstileWidgetId) {
      turnstile.reset(turnstileWidgetId);
      return;
    }

    const widgetId = turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'light',
      callback: (token: string) => {
        setContactForm((prev) => ({ ...prev, turnstileToken: token }));
      },
      'expired-callback': () => {
        setContactForm((prev) => ({ ...prev, turnstileToken: '' }));
      },
      'error-callback': () => {
        setContactForm((prev) => ({ ...prev, turnstileToken: '' }));
      },
    });

    setTurnstileWidgetId(widgetId);
  }, [showContactForm, turnstileSiteKey, isTurnstileReady, turnstileWidgetId]);

  const handleContactInputChange = (
    field: 'name' | 'email' | 'subject' | 'message' | 'website' | 'turnstileToken',
    value: string,
  ) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (turnstileSiteKey && !contactForm.turnstileToken) {
      toast.error('Please complete the verification check.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || 'Unable to send message right now.');
        return;
      }

      toast.success('Message sent successfully. We will get back to you soon.');
      resetContactForm();
      setShowContactForm(false);
    } catch {
      toast.error('Unable to send message right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setIsTurnstileReady(true)}
        />
      )}

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
      <div className="border-4 border-black rounded-xl p-6 md:p-8 bg-white text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
        <div className="space-y-2">
          <h2 className="font-black text-2xl text-black">Need More Help?</h2>
          <p className="font-bold text-base md:text-lg text-gray-700">If you have questions or feedback, feel free to reach out. We're here to help!</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowContactForm((prev) => !prev)}
            className="border-2 border-black rounded-lg px-6 py-2 font-bold text-black hover:bg-gray-100 transition-colors"
          >
            📱 {showContactForm ? 'Hide Form' : 'Contact Form'}
          </button>
        </div>

        {showContactForm && (
          <form
            onSubmit={handleContactFormSubmit}
            className="space-y-4 border-4 border-black rounded-xl p-5 md:p-6 bg-gray-50 text-black"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={contactForm.name}
                onChange={(event) => handleContactInputChange('name', event.target.value)}
                placeholder="Your name"
                required
                className="border-2 border-black rounded-lg px-3 py-2 bg-white text-black placeholder:text-gray-500 font-bold"
              />
              <input
                type="email"
                value={contactForm.email}
                onChange={(event) => handleContactInputChange('email', event.target.value)}
                placeholder="Your email"
                required
                className="border-2 border-black rounded-lg px-3 py-2 bg-white text-black placeholder:text-gray-500 font-bold"
              />
            </div>

            <input
              type="text"
              value={contactForm.website}
              onChange={(event) => handleContactInputChange('website', event.target.value)}
              placeholder="Website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
            />

            <input
              type="text"
              value={contactForm.subject}
              onChange={(event) => handleContactInputChange('subject', event.target.value)}
              placeholder="Subject"
              required
              className="w-full border-2 border-black rounded-lg px-3 py-2 bg-white text-black placeholder:text-gray-500 font-bold"
            />

            <textarea
              value={contactForm.message}
              onChange={(event) => handleContactInputChange('message', event.target.value)}
              placeholder="How can we help?"
              required
              rows={5}
              className="w-full border-2 border-black rounded-lg px-3 py-2 bg-white text-black placeholder:text-gray-500 font-bold"
            />

            {turnstileSiteKey && (
              <div className="pt-1">
                <div ref={turnstileContainerRef} />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (Boolean(turnstileSiteKey) && !contactForm.turnstileToken)}
              className="border-2 border-black rounded-lg px-6 py-2 font-bold bg-black text-white hover:bg-gray-800 transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
