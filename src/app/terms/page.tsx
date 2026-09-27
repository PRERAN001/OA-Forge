export default function TermsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-6 text-zinc-300">
      <div className="border-b border-[#383838] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Terms & Conditions</h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Effective Date: September 2026
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CodeSprint, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. Assessment Credits & Free Quota</h2>
          <p>
            Each new user receives 1 complimentary OA assessment credit upon initial sign up. Additional credits can be purchased via Razorpay or earned by contributing 3 validated questions (with problem descriptions, test cases, and edge cases).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Payment Terms</h2>
          <p>
            Payments are billed in INR (Indian Rupees) via Razorpay secure gateway. Charges are processed immediately upon checkout confirmation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. User Conduct & Content Guidelines</h2>
          <p>
            When contributing questions, users must ensure their problem statements, test inputs, and edge cases do not violate intellectual property rights or contain abusive content.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">5. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of India.
          </p>
        </section>
      </div>
    </div>
  );
}
