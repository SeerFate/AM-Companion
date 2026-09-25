"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    const native = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (native?.isNativePlatform?.()) return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* install still works from the manifest if registration retries later */
    });
  }, []);

  return null;
}
