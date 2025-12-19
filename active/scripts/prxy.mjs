// active/scripts/register-sw.mjs
// BareMux-integrated Ultraviolet Service Worker registration (2025 production-grade)
// Handles correct scope and path for subfolder deployments

import * as BareMux from "../prxy/baremux/index.mjs";

// Root-relative paths – matches your GitHub Pages deployment (/UV-Static-2.0/active/)
const UV_BUNDLE = "/UV-Static-2.0/active/uv/uv.bundle.js";
const UV_CONFIG = "/UV-Static-2.0/active/uv/uv.config.js";
const UV_HANDLER = "/UV-Static-2.0/active/uv/uv.handler.js";
const UV_SW = "/UV-Static-2.0/active/uv/uv.sw.js"; // This is the actual SW script (404'ing currently)

/**
 * Registers the Ultraviolet SW with BareMux integration
 * Throws descriptive errors for debugging
 */
export async function registerSW() {
  if (!navigator.serviceWorker) {
    throw new Error("Service Workers not supported in this browser");
  }

  // BareMux setup – must happen before UV registration
  const bareConnection = new BareMux.BareMuxConnection("/UV-Static-2.0/active/prxy/baremux/worker.js");

  // Register the actual UV service worker (scope defaults to its directory)
  const registration = await navigator.serviceWorker.register(UV_SW, {
    scope: "/UV-Static-2.0/active/uv/", // Explicit scope to match __uv$config.prefix if needed
  });

  // Integrate BareMux transports into the registered worker
  await BareMux.registerRemoteListener(registration.active || registration.installing || registration.waiting);

  console.log("Ultraviolet Service Worker registered successfully ✅", registration);
  return registration;
}
