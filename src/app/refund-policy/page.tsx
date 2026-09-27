export default function RefundPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-6 text-zinc-300">
      <div className="border-b border-[#383838] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Cancellation & Refund Policy</h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Razorpay Compliant Refund Guidelines
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Refund Eligibility</h2>
          <p>
            Because CodeSprint delivers instant digital access to assessment credits and dataset questions, credit purchases are generally non-refundable once an assessment has been initiated using the purchased credits.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Unused Credit Refund Requests</h2>
          <p>
            If you purchased credit passes by mistake and have not consumed any of the purchased credits, you may request a full refund within 7 days of purchase.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Refund Processing Timeframe</h2>
          <p>
            Once a refund request is approved, the funds will be credited back to your original payment method (Bank Account, Credit/Debit Card, or UPI) within <strong className="text-[#ffa116]">5-7 business days</strong> as per standard Razorpay banking settlement timelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. How to Initiate a Refund</h2>
          <p>
            To request a refund, please email <a href="mailto:preran248@gmail.com" className="text-[#ffa116] hover:underline">preran248@gmail.com</a> with your Razorpay Payment ID and Order ID.
          </p>
        </section>
      </div>
    </div>
  );
}
