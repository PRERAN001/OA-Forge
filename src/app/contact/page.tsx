'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-8 text-zinc-300">
      <div className="border-b border-zinc-800 pb-4 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Contact Us</h1>
        <p className="text-xs text-zinc-400">
          Have questions regarding assessment credits, Razorpay payments, or question contributions? Reach out to us below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Business Support Details
            </h2>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-amber-400 mt-0.5" />
                <div>
                  <span className="text-zinc-500 block text-[10px]">Email Support</span>
                  <span className="text-white font-semibold">support@aura-oa.dev</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-amber-400 mt-0.5" />
                <div>
                  <span className="text-zinc-500 block text-[10px]">Phone Number</span>
                  <span className="text-white font-semibold">+91 98765 43210</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-amber-400 mt-0.5" />
                <div>
                  <span className="text-zinc-500 block text-[10px]">Business Location</span>
                  <span className="text-white">Aura Tech Labs, Tech Park, Bengaluru, KA 560100, India</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs space-y-1 font-mono">
            <span className="text-amber-400 font-bold block">Support Response Window</span>
            <p className="text-zinc-400">
              We typically respond to billing, payment, and technical inquiries within 24 business hours.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">Your Email *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">Message Topic</label>
                <select className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none">
                  <option>Payment & Razorpay Inquiry</option>
                  <option>Question Contribution Query</option>
                  <option>Technical Issue / Bug Report</option>
                  <option>General Support</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-400 mb-1">Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="How can we help you?"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border border-amber-400/40 text-xs transition flex items-center justify-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Inquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
