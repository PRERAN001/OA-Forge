export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 space-y-6 text-zinc-300">
      <div className="border-b border-[#383838] pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Last updated: September 2026 • Compliant with Razorpay Merchant Onboarding Standard
        </p>
      </div>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
          <p>
            We collect information you provide directly to us when using CodeSprint, including when you create an account, customize online assessments, purchase credit passes via Razorpay, or submit question contributions.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>Personal identifiers (Name, Email Address).</li>
            <li>Payment transaction details processed securely via Razorpay API (we do not store full credit card numbers or UPI PINs on our servers).</li>
            <li>Technical data (Browser type, device info, submission timestamps).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">2. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li>To process transactions and issue assessment credit passes.</li>
            <li>To track user question contributions (3 questions = 1 free credit reward).</li>
            <li>To provide customer support and send order confirmation emails.</li>
            <li>To detect and prevent fraudulent transactions or security abuses.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">3. Data Protection & Security</h2>
          <p>
            We implement 256-bit SSL encryption and strict access controls. All payments are processed directly through Razorpay PCI-DSS compliant secure gateways.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white">4. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy, please contact our support team at <a href="mailto:preran248@gmail.com" className="text-[#ffa116] hover:underline">preran248@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
