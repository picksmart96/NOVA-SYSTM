import { useState } from "react";
import { useLocation } from "wouter";

export default function PersonalCheckoutPage() {
  const [, navigate] = useLocation();

  const params  = new URLSearchParams(window.location.search);
  const billing = (params.get("billing") || "monthly") as "monthly" | "yearly";

  const plan =
    billing === "yearly"
      ? { label: "Professional Single — Yearly",  price: "$250", period: "/year"  }
      : { label: "Professional Single — Monthly", price: "$25",  period: "/month" };

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const startCheckout = async () => {
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    // Save email so the register page can pre-fill it
    sessionStorage.setItem("psn_checkout_email", email);
    sessionStorage.setItem("psn_checkout_billing", billing);

    try {
      const res  = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, billing }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout. Please try again.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">

        <button
          onClick={() => navigate("/pricing")}
          className="mb-8 text-sm text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
        >
          ← Back to pricing
        </button>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400">Checkout</p>
          <h1 className="mt-3 text-4xl font-black">{plan.label}</h1>
          <p className="mt-3 text-slate-300">Individual selector access — training, NOVA tools, leaderboard, and more.</p>

          {/* Price box */}
          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5 flex items-end gap-2">
            <p className="text-5xl font-black text-white">{plan.price}</p>
            <p className="text-slate-400 pb-1">{plan.period}</p>
          </div>

          {/* Billing toggle */}
          <div className="mt-4 flex gap-3 text-sm">
            <button
              onClick={() => navigate("/checkout/personal?billing=monthly")}
              className={`px-4 py-2 rounded-xl font-bold transition ${billing === "monthly" ? "bg-yellow-400 text-slate-950" : "border border-slate-700 text-slate-400 hover:text-white"}`}
            >
              Monthly — $25
            </button>
            <button
              onClick={() => navigate("/checkout/personal?billing=yearly")}
              className={`px-4 py-2 rounded-xl font-bold transition ${billing === "yearly" ? "bg-yellow-400 text-slate-950" : "border border-slate-700 text-slate-400 hover:text-white"}`}
            >
              Yearly — $250 <span className="text-green-400 text-xs ml-1">Save $50</span>
            </button>
          </div>

          {/* Features */}
          <ul className="mt-7 space-y-2 text-slate-300">
            {[
              "All training modules",
              "NOVA Help — AI voice warehouse coach",
              "NOVA Trainer — real-time pick direction",
              "Common Mistakes library",
              "Leaderboard",
              "Selector Breaking News",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-yellow-400 font-bold">✓</span> {f}
              </li>
            ))}
          </ul>

          {/* Email input */}
          <div className="mt-8">
            <label className="block text-sm text-slate-400 mb-2">
              Your email address <span className="text-slate-500">(for receipt &amp; account setup)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startCheckout()}
              placeholder="you@example.com"
              autoFocus
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-yellow-400 transition placeholder:text-slate-600"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={startCheckout}
            disabled={loading || !email}
            className="mt-6 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Opening secure checkout…
              </>
            ) : (
              <>🔒 Pay {plan.price} — Start my subscription</>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Secure checkout powered by Stripe · Cancel any time · You'll create your account after payment
          </p>
        </div>

      </div>
    </div>
  );
}
