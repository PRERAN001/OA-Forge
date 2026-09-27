import { Mail, Clock, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12 space-y-8 text-zinc-300">
      <div className="border-b border-[#383838] pb-4 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Contact Us</h1>
        <p className="text-xs text-zinc-400">
          Have questions regarding assessment credits, Razorpay payments, or question contributions? Reach out directly via email.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-[#383838] bg-[#282828] p-6 space-y-4 shadow-lg">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Official Support Channel
          </h2>

          <div className="flex items-center gap-4 p-4 rounded-lg border border-[#383838] bg-[#1e1e1e]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ffa116]/10 border border-[#ffa116]/20">
              <Mail className="h-5 w-5 text-[#ffa116]" />
            </div>
            <div>
              <span className="text-zinc-400 block text-xs font-mono">Email Support</span>
              <a
                href="mailto:preran248@gmail.com"
                className="text-base font-bold text-white hover:text-[#ffa116] transition underline decoration-[#ffa116]/50"
              >
                preran248@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#383838] bg-[#282828] p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#ffa116] font-bold text-xs font-mono">
              <Clock className="h-4 w-4" />
              Response Timeframe
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              We process and respond to billing, payment verification, and technical assistance emails within 24 business hours.
            </p>
          </div>

          <div className="rounded-xl border border-[#383838] bg-[#282828] p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
              <ShieldCheck className="h-4 w-4" />
              Razorpay Payment Assistance
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Please include your Razorpay Payment ID or Order ID in your email for fast credit verification and refund processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
