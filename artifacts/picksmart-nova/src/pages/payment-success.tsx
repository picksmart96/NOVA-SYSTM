import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [count, setCount]   = useState(5);

  // Auto-redirect to registration after 5 seconds
  useEffect(() => {
    if (count <= 0) {
      navigate("/register?plan=personal");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">

        {/* Success icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center">
          <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <p className="text-green-400 text-sm font-bold uppercase tracking-[0.22em]">Payment confirmed</p>
          <h1 className="mt-2 text-4xl font-black">You're subscribed!</h1>
          <p className="mt-4 text-slate-300 text-lg leading-relaxed">
            Your payment was successful. Now let's create your PickSmart NOVA account so you can log in on any device.
          </p>
        </div>

        {/* Steps */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left space-y-4">
          <p className="font-bold text-yellow-400 text-sm uppercase tracking-wide">Your next steps</p>
          {[
            { n: "1", label: "Create your account",    sub: "Pick a username and password",             done: false },
            { n: "2", label: "Download the app",       sub: "Access NOVA on your phone or computer",   done: false },
            { n: "3", label: "Sign in & start training", sub: "Unlock all modules and NOVA tools",     done: false },
          ].map(({ n, label, sub }) => (
            <div key={n} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-black text-sm flex items-center justify-center shrink-0">
                {n}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-slate-500 text-xs">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/register?plan=personal")}
          className="w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-yellow-300 transition"
        >
          Create My Account →
        </button>

        <p className="text-slate-600 text-xs">
          Redirecting automatically in {count}s · A receipt was emailed to you
        </p>

      </div>
    </div>
  );
}
