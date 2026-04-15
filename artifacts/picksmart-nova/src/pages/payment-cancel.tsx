import { useLocation } from "wouter";

export default function PaymentCancelPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center space-y-6">

        <div className="mx-auto w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
          <span className="text-4xl">↩</span>
        </div>

        <div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.22em]">Checkout cancelled</p>
          <h1 className="mt-2 text-4xl font-black">No charge was made</h1>
          <p className="mt-4 text-slate-300 text-lg">
            You cancelled the checkout. Nothing was charged to your card. You can try again any time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/pricing")}
            className="flex-1 rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-slate-950 hover:bg-yellow-300 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 rounded-2xl border border-slate-700 px-6 py-4 font-bold text-slate-300 hover:text-white hover:border-slate-500 transition"
          >
            Go Home
          </button>
        </div>

      </div>
    </div>
  );
}
