import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Download,
  X,
  Zap,
  ShieldCheck,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle,
} from 'lucide-react';

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const location = useLocation();

  // Check standalone mode and platform
  useEffect(() => {
    // 1. Detect if app is already running as an installed PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
      return Boolean(isStandaloneMode);
    };

    if (checkStandalone()) {
      return;
    }

    // 2. Check if user dismissed recently
    const lastDismissed = localStorage.getItem('fixaround_pwa_dismissed');
    if (lastDismissed) {
      const diff = Date.now() - parseInt(lastDismissed, 10);
      if (diff < DISMISS_DURATION_MS) {
        return; // Suppressed
      }
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIosDevice) {
      setIsIos(true);
      // On iOS Safari, we can display the manual Add to Home Screen prompt after a short delay
      if (isSafari) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }

    // 4. Listen for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt smoothly after brief page engagement (2.5 seconds)
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    };

    // 5. Listen for appinstalled
    const handleAppInstalled = () => {
      console.log('[PWA] FixAround App was successfully installed');
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      localStorage.setItem('fixaround_pwa_installed', 'true');
      setTimeout(() => setShowPrompt(false), 3000);
    };

    // 6. Custom manual trigger from navigation or buttons
    const handleManualOpen = () => {
      setShowPrompt(true);
      setShowIosGuide(isIos);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('fixaround:open-pwa-install', handleManualOpen);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('fixaround:open-pwa-install', handleManualOpen);
    };
  }, [isIos]);

  // Suppress on critical sensitive screens (Checkout, Payment, Login, Register)
  const isCriticalRoute =
    location.pathname.includes('/checkout') ||
    location.pathname.includes('/payments') ||
    location.pathname.includes('/login') ||
    location.pathname.includes('/register');

  if (isStandalone || !showPrompt || isCriticalRoute) {
    return null;
  }

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem('fixaround_pwa_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // If browser doesn't support beforeinstallprompt, show tip
      setShowIosGuide(true);
      return;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the FixAround install prompt');
        setShowPrompt(false);
      } else {
        console.log('[PWA] User dismissed the FixAround install prompt');
        handleDismiss();
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-3xl p-5 sm:p-6 text-slate-800 relative overflow-hidden ring-1 ring-slate-900/5">
        {/* Subtle Top Brand Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-fixblue-900 via-fixteal-600 to-fixteal-400" />

        {/* Close (X) Button */}
        <button
          onClick={handleDismiss}
          aria-label="Close install prompt"
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {installedSuccess ? (
          <div className="py-4 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-fixblue-900">FixAround Installed!</h3>
            <p className="text-xs text-slate-500">
              Launch FixAround anytime from your home screen or application launcher.
            </p>
          </div>
        ) : showIosGuide ? (
          /* iOS Safari / Manual Installation Instructions */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/icon.svg"
                alt="FixAround Icon"
                className="w-12 h-12 rounded-2xl shadow-xs border border-slate-200 p-0.5 bg-white"
              />
              <div>
                <h3 className="font-extrabold text-fixblue-900 text-sm">
                  Add FixAround to Home Screen
                </h3>
                <p className="text-xs text-slate-500">Manual install for iPhone & iPad Safari</p>
              </div>
            </div>

            <ol className="text-xs text-slate-600 space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-fixblue-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-fixteal-600 ml-0.5" /> in your Safari navigation bar.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-fixblue-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and choose <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 ml-0.5" />.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-fixblue-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right corner. Enjoy instant full-screen access!
                </span>
              </li>
            </ol>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Got It, Thanks!
            </button>
          </div>
        ) : (
          /* Standard Install Banner */
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <img
                src="/icon.svg"
                alt="FixAround App"
                className="w-13 h-13 rounded-2xl shadow-sm border border-slate-200/80 bg-white p-1 shrink-0"
              />
              <div className="pr-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-fixteal-700 bg-fixteal-50 px-2 py-0.5 rounded-md mb-1">
                  <Smartphone className="w-3 h-3" />
                  Official PWA App
                </span>
                <h3 id="pwa-install-title" className="font-extrabold text-fixblue-900 text-base leading-snug">
                  Install FixAround App
                </h3>
                <p id="pwa-install-desc" className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Get faster access to local services, emergency repairs, and your bookings directly from your home screen.
                </p>
              </div>
            </div>

            {/* Benefit Bullets */}
            <ul className="grid grid-cols-1 gap-1.5 pt-1 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-fixteal-600 shrink-0" />
                <span>Quick 1-tap access to home repair experts</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Easy live booking management & warranties</span>
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-fixblue-800 shrink-0" />
                <span>App-like, fast full-screen experience (No app store needed)</span>
              </li>
            </ul>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-fixblue-900 to-fixblue-800 hover:from-fixblue-950 hover:to-fixblue-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5 text-fixteal-300" />
                <span>Install App</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
