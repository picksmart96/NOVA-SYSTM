import { Activity, Smartphone, Monitor, Chrome, ExternalLink, QrCode } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import QRCodeLib from "qrcode";

const APP_URL = "https://nova-warehouse-control.replit.app";
const IOS_URL  = "https://apps.apple.com/app/picksmart-nova"; // replace when live on App Store

export default function DownloadPage() {
  const [qrSrc, setQrSrc] = useState("");

  useEffect(() => {
    QRCodeLib.toDataURL(APP_URL, { width: 200, margin: 2, color: { dark: "#0d1118", light: "#f5c200" } })
      .then(setQrSrc)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-3">Get PickSmart NOVA</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Access the full ES3 voice-directed warehouse training platform on any device.
          </p>
        </div>

        {/* Options grid */}
        <div className="grid gap-4 sm:grid-cols-2 mb-10">

          {/* iOS App */}
          <a
            href={IOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-700 bg-slate-900 p-6 hover:border-yellow-400/50 hover:bg-slate-800 transition group"
          >
            <Smartphone className="h-8 w-8 text-yellow-400 mb-4" />
            <h2 className="text-lg font-bold mb-1 group-hover:text-yellow-400 transition">iPhone / iPad</h2>
            <p className="text-slate-400 text-sm mb-4">
              Download from the App Store for the full native voice experience with ES3.
            </p>
            <span className="inline-flex items-center gap-2 text-yellow-400 font-bold text-sm">
              App Store <ExternalLink className="h-4 w-4" />
            </span>
          </a>

          {/* Web App */}
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-700 bg-slate-900 p-6 hover:border-yellow-400/50 hover:bg-slate-800 transition group"
          >
            <Chrome className="h-8 w-8 text-yellow-400 mb-4" />
            <h2 className="text-lg font-bold mb-1 group-hover:text-yellow-400 transition">Web Browser</h2>
            <p className="text-slate-400 text-sm mb-4">
              Use Chrome on any computer or Android device. Full NOVA Help voice coaching included.
            </p>
            <span className="inline-flex items-center gap-2 text-yellow-400 font-bold text-sm">
              Open Now <ExternalLink className="h-4 w-4" />
            </span>
          </a>

          {/* Desktop PWA */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 sm:col-span-2">
            <Monitor className="h-8 w-8 text-yellow-400 mb-4" />
            <h2 className="text-lg font-bold mb-1">Install on Desktop (Windows / Mac)</h2>
            <p className="text-slate-400 text-sm mb-4">
              Open <span className="text-white font-mono text-xs bg-slate-800 px-2 py-0.5 rounded">{APP_URL}</span> in Chrome, then click the install icon (⬇) in the address bar to install as a desktop app. Works offline for training modules.
            </p>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-slate-950 font-bold text-sm hover:bg-yellow-300 transition"
            >
              Open in Chrome <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* QR Code */}
        {qrSrc && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center mb-8">
            <QrCode className="h-6 w-6 text-yellow-400 mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-2">Open on your phone</h2>
            <p className="text-slate-400 text-sm mb-6">Scan this QR code with your phone camera to open the web app instantly.</p>
            <img
              src={qrSrc}
              alt="App QR code"
              className="mx-auto rounded-xl border border-slate-700"
              width={160}
              height={160}
            />
            <p className="text-xs text-slate-600 mt-4 font-mono">{APP_URL}</p>
          </div>
        )}

        {/* Back */}
        <div className="text-center">
          <Link href="/login">
            <a className="text-slate-500 hover:text-white text-sm transition">← Back to Sign In</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
