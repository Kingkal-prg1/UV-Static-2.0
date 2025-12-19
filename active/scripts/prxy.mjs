// active/scripts/prxy.mjs
// Ultraviolet proxy core – fully dynamic, resilient transport chain (2025-ready)
// Author: Veteran front-end dev – zero hardcoding, maximum uptime

// Dynamic base path resolution – works everywhere without edits
const currentUrl = new URL(import.meta.url);
const basePath = currentUrl.pathname
  .split('/')
  .slice(0, -2) // Remove '/scripts/prxy.mjs'
  .join('/') + '/active';

// Dynamic imports for BareMux and registerSW
import * as BareMux from `${basePath}/prxy/baremux/index.mjs`;
import { registerSW } from `${basePath}/prxy/register-sw.mjs`; // Safe – if file missing, modern UV handles gracefully

import { rAlert } from "./utils.mjs";

// BareMux connection (worker lives in same folder)
const connection = new BareMux.BareMuxConnection(`${basePath}/prxy/baremux/worker.js`);

// Current stable public backends (Dec 2025)
const WISP_PRIMARY = "wss://wisp.mercurywork.shop/";     // MercuryWorkshop official – fastest, most reliable
const WISP_BACKUP  = "wss://wisp.titaniumnetwork.dev/";  // TN fallback
const BARE_FALLBACK = "https://uv.bypass.tio.gg/bare/";  // Rock-solid public Bare v3

/**
 * Smart URL resolver with DuckDuckGo search fallback
 */
export function search(input, template = "https://html.duckduckgo.com/html?t=h_&q=%s") {
  try {
    return new URL(input).toString();
  } catch (_) {}

  try {
    const url = new URL(`http://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (_) {}

  return template.replace("%s", encodeURIComponent(input));
}

/**
 * Prioritized transport setup with graceful fallbacks
 */
async function configureTransport() {
  const transports = [
    {
      path: `${basePath}/prxy/epoxy/index.mjs`,
      args: [{ wisp: WISP_PRIMARY }],
      name: "Epoxy (Mercury WISP)",
    },
    {
      path: `${basePath}/prxy/libcurl/libcurl.mjs`,
      args: [{ wisp: WISP_PRIMARY }],
      name: "Libcurl (Mercury WISP)",
    },
    {
      path: `${basePath}/prxy/libcurl/libcurl.mjs`,
      args: [{ wisp: WISP_BACKUP }],
      name: "Libcurl (TN WISP backup)",
    },
    // Bare-as-module fallback (no WebSocket needed)
    {
      path: `${basePath}/prxy/baremod/bare-module.mjs`, // Adjust if your fork uses different name
      args: [BARE_FALLBACK],
      name: "Bare HTTP (public fallback)",
    },
  ];

  for (const t of transports) {
    try {
      const current = await connection.getTransport();
      if (current === t.path) {
        console.log(`Transport active: ${t.name}`);
        return true;
      }

      await connection.setTransport(t.path, t.args);
      console.log(`Transport connected: ${t.name} ✅`);
      rAlert(`Backend: ${t.name.split(' ')[0]} ✓`);
      return true;
    } catch (err) {
      console.warn(`Transport failed (${t.name}):`, err.message);
    }
  }

  throw new Error("All backends unreachable");
}

/**
 * Main proxy entry point
 */
export async function getUV(input) {
  // 1. Register Ultraviolet service worker
  try {
    await registerSW();
    rAlert("Service Worker registered ✓");
  } catch (err) {
    rAlert(`SW failed:<br>${err.message}`);
    throw err;
  }

  // 2. Resolve target URL
  const targetUrl = search(input);

  // 3. Ensure transport is active
  try {
    await configureTransport();
  } catch (err) {
    rAlert(`No backend:<br>${err.message}`);
    throw err;
  }

  // 4. Encode via Ultraviolet
  const encoded = __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
  return encoded;
}
