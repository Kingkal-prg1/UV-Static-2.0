// active/scripts/register-sw.mjs
// Updated Ultraviolet Service Worker registration for your exact repo (Dec 2025)
// Points to the actual existing file: uv.sw.js (not sw.js)

import * as BareMux from "../prxy/baremux/index.mjs";

import { rAlert } from "./utils.mjs";

// Root-relative paths matching your deployment (/UV-Static-2.0/active/uv/)
const UV_SW = "/UV-Static-2.0/active/uv/uv.sw.js"; // <-- This is the correct filename (exists in your repo)

/**
 * Registers Ultraviolet SW with BareMux integration
 * Senior-dev quality: descriptive errors, clean logging
 */
export async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Workers are not supported in this browser");
  }

  try {
    // Register the actual service worker script
    const registration = await navigator.serviceWorker.register(UV_SW, {
      scope: "/UV-Static-2.0/active/uv/", // Matches standard __uv$config.prefix
    });

    // Connect BareMux to the registered worker for transport support
    const worker = registration.installing || registration.waiting || registration.active;
    if (worker) {
      await BareMux.registerRemoteListener(worker);
    } else {
      // Fallback: wait for updatefound
      registration.addEventListener("updatefound", async () => {
        const newWorker = registration.installing;
        if (newWorker) await BareMux.registerRemoteListener(newWorker);
      });
    }

    console.log("Ultraviolet Service Worker registered & BareMux linked ✅", registration);
    rAlert("Service Worker ✓");
    return registration;
  } catch (err) {
    console.error("SW registration failed:", err);
    rAlert(`SW failed:<br>${err.message}`);
    throw err;
  }
}
