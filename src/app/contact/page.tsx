'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-8 text-zinc-300">
      <div className="border-b border-[#383838] pb-4 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Contact Us</h1>
        <p className="text-xs text-zinc-400">
          Have questions regarding assessment credits, Razorpay payments, or question contributions? Reach out to us below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#383838] bg-[#282828] p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Business Support Details
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-[#ffa116] mt-0.5" />
                <div>
                  <span className="text-zinc-500 block text-[10px]">Email Support</span>
                  <a href="mailto:preran248@gmail.com" className="text-white font-semibold hover:text-[#ffa116] transition">
                    preran248@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#383838] bg-[#1e1e1e] p-4 text-xs space-y-1 font-mono">
            <span className="text-[#ffa116] font-bold block">Support Response Window</span>
            <p className="text-zinc-400">
              We typically respond to billing, payment, and technical inquiries within 24 business hours.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-xl border border-[#383838] bg-[#282828] p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Send Us a Message
          </h2>

          {submitted ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-2 text-xs font-mono text-emerald-300">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white text-sm">Message Sent Successfully</h3>
              <p>Thank you for contacting support. We will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-medium text-zinc-400 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-[#383838] bg-[#1e1e1e] px-3 py-2 text-xs text-white focus:border-[#ffa116] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">Your Email *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-[#383838] bg-[#1e1e1e] px-3 py-2 text-xs text-white focus:border-[#ffa116] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Payment / Assessment Query"
                  className="w-full rounded-lg border border-[#383838] bg-[#1e1e1e] px-3 py-2 text-xs text-white focus:border-[#ffa116] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your message here..."
                  className="w-full rounded-lg border border-[#383838] bg-[#1e1e1e] px-3 py-2 text-xs text-white focus:border-[#ffa116] focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffa116] px-4 py-2 text-xs font-bold text-[#1a1a1a] hover:bg-[#ffa116]/90 transition shadow-sm"
              >
                <Send className="h-3.5 w-3.5 text-[#1a1a1a]" />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
