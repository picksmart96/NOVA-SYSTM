import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

export default function PersonalCheckoutPage() {
  const [, navigate] = useLocation();
  const { currentUser, updateSubscription } = useAuthStore();

  const params = new URLSearchParams(window.location.search);
  const billing = params.get("billing") || "monthly";

  const plan =
    billing === "yearly"
      ? { label: "Professional Single Yearly", price: "$250/year" }
      : { label: "Professional Single Monthly", price: "$25/month" };

  const completeCheckout = () => {
    if (!currentUser) { navigate("/login?redirect=/pricing"); return; }
    updateSubscription("personal");
    navigate("/training");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400">Checkout</p>
        <h1 className="mt-3 text-4xl font-black">{plan.label}</h1>
        <p className="mt-4 text-slate-300">Individual selector access for training and NOVA tools.</p>

        <div className="mt-8 space-y-3 text-slate-300">
          <p>• Training</p>
          <p>• NOVA Help</p>
          <p>• NOVA Trainer</p>
          <p>• Common Mistakes</p>
          <p>• Leaderboard</p>
          <p>• Selector Breaking News</p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-400">Plan Price</p>
          <p className="mt-2 text-3xl font-black">{plan.price}</p>
        </div>

        {!currentUser && (
          <p className="mt-5 text-sm text-amber-400">
            You need to be signed in to subscribe.{" "}
            <button onClick={() => navigate("/login?redirect=/checkout/personal?billing=" + billing)} className="underline font-bold">
              Sign in
            </button>
          </p>
        )}

        <button
          onClick={completeCheckout}
          disabled={!currentUser}
          className="mt-8 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Complete Professional Subscription
        </button>

        <button
          onClick={() => navigate("/pricing")}
          className="mt-3 w-full text-sm text-slate-500 hover:text-slate-300 transition"
        >
          ← Back to pricing
        </button>

      </div>
    </div>
  );
}
