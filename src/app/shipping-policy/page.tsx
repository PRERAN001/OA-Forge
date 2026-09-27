export default function ShippingPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-6 text-zinc-300">
      <div className="border-b border-[#383838] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Shipping & Delivery Policy</h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Digital Products & Electronic Delivery Details
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Digital Service Delivery</h2>
          <p>
            CodeSprint provides online digital assessment software and dataset access. We do not ship physical products.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Delivery Timeframe</h2>
          <p>
            Upon successful payment confirmation via Razorpay, your assessment credits and platform access are credited to your account <strong className="text-emerald-400">instantly (within 1 to 5 seconds)</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Delivery Confirmation & Receipt</h2>
          <p>
            A digital order receipt and payment confirmation will be displayed immediately on screen and sent to your registered email address.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Support for Delivery Issues</h2>
          <p>
            If your credits do not appear within 5 minutes of payment completion, please contact our support team at <a href="mailto:preran248@gmail.com" className="text-[#ffa116] hover:underline">preran248@gmail.com</a> with your Razorpay Payment ID for immediate resolution.
          </p>
        </section>
      </div>
    </div>
  );
}
