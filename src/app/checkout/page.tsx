'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addOACredits } from '@/lib/userCredits';
import { CreditCard, ShieldCheck, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = searchParams.get('planId') || 'single_oa';
  const amount = parseFloat(searchParams.get('amount') || '49');
  const credits = parseInt(searchParams.get('credits') || '1', 10);
  const planName = searchParams.get('name') || 'Single Assessment Pass';

  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [phone, setPhone] = useState('9876543210');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Razorpay Script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Step 1: Create Order via backend API
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          amount,
          currency: 'INR',
          credits,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.id) {
        alert('Failed to initialize Razorpay payment order.');
        setIsProcessing(false);
        return;
      }

      // Check if window.Razorpay is available
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId || 'rzp_test_key',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Aura OA Platform',
          description: `Payment for ${planName}`,
          image: 'https://cdn-icons-png.flaticon.com/512/9322/9322127.png',
          order_id: orderData.id,
          handler: async function (response: any) {
            // Step 2: Verify payment via backend API
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id || orderData.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature || 'mock_sig',
                planId,
                credits,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              // Add credits to user state
              addOACredits(
                credits,
                'purchase',
                `Purchased ${planName} (₹${amount})`,
                planId === 'unlimited_pass'
              );

              // Route to success page
              router.push(
                `/payment-success?orderId=${verifyData.orderId}&paymentId=${verifyData.paymentId}&amount=${amount}&credits=${credits}&planName=${encodeURIComponent(
                  planName
                )}`
              );
            } else {
              alert('Payment verification failed.');
              setIsProcessing(false);
            }
          },
          prefill: {
            name,
            email,
            contact: phone,
          },
          theme: {
            color: '#f59e0b',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert('Payment Failed: ' + (response.error.description || 'Unknown error'));
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Fallback for simulated checkout if script blocked
        setTimeout(async () => {
          addOACredits(
            credits,
            'purchase',
            `Purchased ${planName} (₹${amount})`,
            planId === 'unlimited_pass'
          );
          router.push(
            `/payment-success?orderId=${orderData.id}&paymentId=pay_sim_${Date.now()}&amount=${amount}&credits=${credits}&planName=${encodeURIComponent(
              planName
            )}`
          );
        }, 800);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('An error occurred during payment processing.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-10 space-y-8">
      <button
        onClick={() => router.push('/pricing')}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Pricing Plans
      </button>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-6 shadow-2xl">
        <div className="space-y-1 border-b border-zinc-800 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-400" />
              Razorpay Secure Checkout
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Razorpay Verified
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Complete your order to unlock OA assessment credits immediately.
          </p>
        </div>

        {/* Order Summary Box */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-zinc-300">
            <span>Selected Item:</span>
            <span className="font-bold text-white">{planName}</span>
          </div>
          <div className="flex justify-between text-zinc-300">
            <span>OA Credits Included:</span>
            <span className="font-bold text-amber-400">
              {planId === 'unlimited_pass' ? 'Unlimited' : `+${credits} Credit(s)`}
            </span>
          </div>
          <div className="flex justify-between border-t border-zinc-800 pt-2 text-sm text-white font-bold">
            <span>Total Payable:</span>
            <span className="text-amber-400">₹{amount} INR</span>
          </div>
        </div>

        {/* Customer Information Form */}
        <form onSubmit={handleRazorpayPayment} className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Customer Information
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Phone Number (For Razorpay OTP) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-2 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold border border-amber-400/40 text-xs transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Connecting to Razorpay...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pay ₹{amount} via Razorpay Gateway
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono text-center">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Secured by Razorpay • Instant Digital Fulfillment
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-zinc-950 text-white font-mono text-xs">
          Loading Checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
