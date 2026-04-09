import { useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useWarehouseStore } from "@/lib/warehouseStore";
import { DEFAULT_WAREHOUSES, SYSTEM_TYPE_LABEL, FEATURE_LABEL, getWarehouseBySlug } from "@/data/warehouses";
import { useAuthStore } from "@/lib/authStore";

export default function WarehouseEntryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { setWarehouseBySlug, customWarehouses } = useWarehouseStore();
  const { currentUser } = useAuthStore();

  const allWarehouses = [...DEFAULT_WAREHOUSES, ...customWarehouses];
  const warehouse = getWarehouseBySlug(slug, allWarehouses);

  useEffect(() => {
    if (warehouse) {
      setWarehouseBySlug(warehouse.slug);
    }
  }, [warehouse, setWarehouseBySlug]);

  if (!warehouse) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🏭</div>
          <h1 className="text-3xl font-black text-white">Warehouse Not Found</h1>
          <p className="mt-4 text-slate-400">
            The warehouse link <span className="text-yellow-400 font-mono">/{slug}</span> does not
            exist or is no longer active. Contact your warehouse administrator for the correct link.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!warehouse.isActive || !warehouse.isSubscribed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-black text-white">Warehouse Inactive</h1>
          <p className="mt-4 text-slate-400">
            This warehouse account is currently inactive. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const isES3 = warehouse.systemType === "es3";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400/10 border border-yellow-400/30 px-4 py-2 mb-6">
            <span className="text-yellow-400 font-bold text-sm">
              {isES3 ? "🎙️ ES3 Voice Workflow" : "🏭 Standard Warehouse"}
            </span>
          </div>
          <h1 className="text-4xl font-black text-white">{warehouse.name}</h1>
          <p className="mt-3 text-slate-400">
            {SYSTEM_TYPE_LABEL[warehouse.systemType]} · {warehouse.allowedFeatures.length} features enabled
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-4">
            Features included in this warehouse
          </p>
          <ul className="space-y-3">
            {warehouse.allowedFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-slate-300">
                <span className="text-yellow-400 text-sm">✓</span>
                <span className="text-sm">{FEATURE_LABEL[feature]}</span>
              </li>
            ))}
          </ul>

          {!isES3 && (
            <div className="mt-5 rounded-xl bg-slate-800/60 border border-slate-700 p-4">
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">NOVA Trainer</span> is not included — this warehouse uses the standard workflow without ES3 voice direction.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {currentUser ? (
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-yellow-300 transition"
            >
              Enter {warehouse.name}
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(`/login?warehouse=${warehouse.slug}`)}
                className="w-full rounded-2xl bg-yellow-400 px-6 py-4 text-lg font-bold text-slate-950 hover:bg-yellow-300 transition"
              >
                Sign In to {warehouse.name}
              </button>
              <p className="text-center text-sm text-slate-500">
                Have an invite? <Link href={`/invite/`} className="text-yellow-400 hover:underline">Use your invite link</Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Your data is private and isolated to this warehouse account.{" "}
          <Link href="/privacy" className="text-slate-500 hover:text-yellow-400 transition">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
