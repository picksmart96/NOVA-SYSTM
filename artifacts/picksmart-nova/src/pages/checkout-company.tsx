import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/authStore";

export default function CompanyCheckoutPage() {
  const [, navigate] = useLocation();
  const { currentUser, updateSubscription } = useAuthStore();

  const params = new URLSearchParams(window.location.search);
  const billing = params.get("billing") || "weekly";

  const plan =
    billing === "monthly"
      ? { label: "Company Unlimited Monthly", price: "$6,400/month" }
      : billing === "yearly"
      ? { label: "Company Unlimited Yearly", price: "$69,000/year" }
      : { label: "Company Unlimited Weekly", price: "$1,660/week" };

  const completeCheckout = () => {
    if (!currentUser) { navigate("/login?redirect=/pricing"); return; }
    updateSubscription("company");
    navigate("/training");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-yellow-400 bg-slate-900 p-8 shadow-xl">

        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-yellow-400">Checkout</p>
        <h1 className="mt-3 text-4xl font-black">{plan.label}</h1>
        <p className="mt-4 text-slate-300">Unlimited team and warehouse operations access.</p>

        <div className="mt-8 space-y-3 text-slate-300">
          <p>• Everything in Professional Single</p>
          <p>• Trainer Dashboard</p>
          <p>• Supervisor Dashboard</p>
          <p>• Unlimited company users</p>
          <p>• Unlimited training and operations access</p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-400">Plan Price</p>
          <p className="mt-2 text-3xl font-black">{plan.price}</p>
        </div>

        <p className="mt-5 text-sm text-red-300">
          Users & Access and Owner controls remain private to owner only.
        </p>

        {!currentUser && (
          <p className="mt-4 text-sm text-amber-400">
            You need to be signed in to subscribe.{" "}
            <button onClick={() => navigate("/login?redirect=/checkout/company?billing=" + billing)} className="underline font-bold">
              Sign in
            </button>
          </p>
        )}

        <button
          onClick={completeCheckout}
          disabled={!currentUser}
          className="mt-8 w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Complete Company Subscription
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
