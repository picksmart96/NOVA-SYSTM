import { Activity, Smartphone, Monitor, Chrome, ExternalLink, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import QRCodeLib from "qrcode";
import { useAuthStore } from "@/lib/authStore";

const APP_URL      = "https://nova-warehouse-control.replit.app";
const IOS_URL      = "https://apps.apple.com/app/picksmart-nova";
const ANDROID_URL  = "https://play.google.com/store/apps/details?id=com.picksmartacademy.nova";

export default function DownloadPage() {
  const [, navigate]    = useLocation();
  const { currentUser } = useAuthStore();
  const [qrSrc, setQrSrc] = useState("");

  const params    = new URLSearchParams(window.location.search);
  const isWelcome = params.get("welcome") === "1";

  useEffect(() => {
    QRCodeLib.toDataURL(APP_URL, { width: 200, margin: 2, color: { dark: "#0d1118", light: "#f5c200" } })
      .then(setQrSrc)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-yellow-400 text-slate-950 p-2 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tight">
            PickSmart <span className="text-yellow-400">NOVA</span>
          </span>
        </div>

        {/* Welcome banner */}
        {isWelcome && (
          <div className="mb-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
            <p className="text-green-400 text-xs font-bold uppercase tracking-wide mb-1">Step 2 of 2 — You're almost in!</p>
            <div className="flex gap-2 mb-3">
              <div className="h-1.5 flex-1 rounded-full bg-green-500" />
              <div className="h-1.5 flex-1 rounded-full bg-green-500" />
            </div>
            <h2 className="text-xl font-black text-white mb-1">
              Account created{currentUser ? `, ${currentUser.fullName.split(" ")[0]}` : ""}!
            </h2>
            <p className="text-slate-300 text-sm">
              Your subscription is active. Download the app below or open the web version — then sign in with your username and password.
            </p>
          </div>
        )}

        {!isWelcome && (
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black mb-3">Get PickSmart NOVA</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Access the full NOVA voice-directed warehouse training platform on any device.
            </p>
          </div>
        )}

        {/* Credentials reminder */}
        {isWelcome && currentUser && (
          <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-5">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide mb-3">Your sign-in credentials</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-2.5">
                <span className="text-slate-400 text-sm">Username</span>
                <span className="text-white font-bold font-mono">{currentUser.username}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-2.5">
                <span className="text-slate-400 text-sm">Password</span>
                <span className="text-slate-300 text-sm">Your chosen password</span>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-3">
              Save these — you'll use them to sign in on any device, including the mobile app.
            </p>
          </div>
        )}

        {/* Download options */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">

          {/* iOS */}
          <a
            href={IOS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-700 bg-slate-900 p-6 hover:border-yellow-400/50 hover:bg-slate-800 transition group"
          >
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-7 w-7 text-yellow-400" />
              <span className="text-xs font-bold text-slate-500 bg-slate-800 rounded-full px-2.5 py-1">iOS</span>
            </div>
            <h2 className="text-lg font-bold mb-1 group-hover:text-yellow-400 transition">iPhone / iPad</h2>
            <p className="text-slate-400 text-sm mb-4">
              Download from the App Store for the full native NOVA voice experience.
            </p>
            <span className="inline-flex items-center gap-2 text-yellow-400 font-bold text-sm">
              App Store <ExternalLink className="h-4 w-4" />
            </span>
          </a>

          {/* Android */}
          <a
            href={ANDROID_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-slate-700 bg-slate-900 p-6 hover:border-yellow-400/50 hover:bg-slate-800 transition group"
          >
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="h-7 w-7 text-green-400" />
              <span className="text-xs font-bold text-green-700 bg-green-900/40 rounded-full px-2.5 py-1">Android</span>
            </div>
            <h2 className="text-lg font-bold mb-1 group-hover:text-yellow-400 transition">Android</h2>
            <p className="text-slate-400 text-sm mb-4">
              Download from Google Play for the full native NOVA voice experience on your Android device.
            </p>
            <span className="inline-flex items-center gap-2 text-green-400 font-bold text-sm">
              Google Play <ExternalLink className="h-4 w-4" />
            </span>
          </a>

          {/* Web App */}
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-yellow-400/40 bg-slate-900 p-6 hover:border-yellow-400 hover:bg-slate-800 transition group"
          >
            <Chrome className="h-7 w-7 text-yellow-400 mb-4" />
            <h2 className="text-lg font-bold mb-1 group-hover:text-yellow-400 transition">Web Browser</h2>
            <p className="text-slate-400 text-sm mb-4">
              Open in Chrome on any computer or phone. Full NOVA voice coaching included — no install required.
            </p>
            <span className="inline-flex items-center gap-2 text-yellow-400 font-bold text-sm">
              Open Now <ExternalLink className="h-4 w-4" />
            </span>
          </a>

          {/* Desktop PWA */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <Monitor className="h-7 w-7 text-yellow-400 mb-4" />
            <h2 className="text-lg font-bold mb-1">Install on Desktop</h2>
            <p className="text-slate-400 text-sm mb-4">
              Open the web app in Chrome, then click the install icon (⬇) in the address bar — works on Windows and Mac.
            </p>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-slate-950 font-bold text-sm hover:bg-yellow-300 transition"
            >
              Open in Chrome <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* QR Code */}
        {qrSrc && (
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center mb-8">
            <QrCode className="h-6 w-6 text-yellow-400 mx-auto mb-3" />
            <h2 className="font-bold text-lg mb-2">Scan to open on your phone</h2>
            <p className="text-slate-400 text-sm mb-6">Point your phone camera at this code to open the app instantly.</p>
            <img src={qrSrc} alt="App QR code" className="mx-auto rounded-xl border border-slate-700" width={160} height={160} />
            <p className="text-xs text-slate-600 mt-4 font-mono">{APP_URL}</p>
          </div>
        )}

        {/* How to sign in */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 mb-8">
          <h2 className="font-bold text-white mb-4">How to sign in</h2>
          <ol className="space-y-3 text-slate-300 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-black text-xs flex items-center justify-center shrink-0">1</span>
              Open the app or go to <span className="font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded ml-1">{APP_URL}</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-black text-xs flex items-center justify-center shrink-0">2</span>
              Tap <strong>Sign In</strong> and enter your username and password
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 font-black text-xs flex items-center justify-center shrink-0">3</span>
              You're in — NOVA will guide you from there!
            </li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/login")}
            className="flex-1 rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-slate-950 hover:bg-yellow-300 transition text-center"
          >
            Sign in now →
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 rounded-2xl border border-slate-700 px-6 py-4 font-bold text-slate-400 hover:text-white hover:border-slate-500 transition text-center"
          >
            Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}
