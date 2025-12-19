// active/scripts/prxy.mjs
// Ultraviolet proxy core – resilient transport chain (Dec 2025 ready)
// Hardcoded relative paths for static import safety & performance

import * as BareMux from "../prxy/baremux/index.mjs";
import { registerSW } from "../prxy/register-sw.mjs"; // Harmless if missing in modern setups

import { rAlert } from "./utils.mjs";

// Worker is in the same prxy folder
const connection = new BareMux.BareMuxConnection("../prxy/baremux/worker.js");

// Stable public backends (2025)
const WISP_PRIMARY = "wss://wisp.mercurywork.shop/";     // MercuryWorkshop – fastest & most reliable
const WISP_BACKUP  = "wss://wisp.titaniumnetwork.dev/";  // Solid secondary
const BARE_FALLBACK = "https://uv.bypass.tio.gg/bare/";  // Always-up public Bare v3

/**
 * Smart URL resolver (DuckDuckGo search fallback)
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
 * Prioritized transport chain with user feedback
 */
async function configureTransport() {
  const transports = [
    { path: "../prxy/epoxy/index.mjs",       args: [{ wisp: WISP_PRIMARY }], name: "Epoxy (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_PRIMARY }], name: "Libcurl (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_BACKUP }],  name: "Libcurl (TN WISP backup)" },
    { path: "../prxy/baremod/bare-module.mjs", args: [BARE_FALLBACK],       name: "Bare HTTP (public)" }, // Adjust filename if different in your fork
  ];

  for (const t of transports) {
    try {
      if ((await connection.getTransport()) === t.path) {
        console.log(`Transport already active: ${t.name}`);
        return true;
      }

      await connection.setTransport(t.path, t.args);
      console.log(`Connected via ${t.name} ✅`);
      rAlert(`Backend: ${t.name.split(' ')[0]} ✓`);
      return true;
    } catch (err) {
      console.warn(`Failed ${t.name}:`, err.message);
    }
  }

  throw new Error("All backends unreachable – check network");
}

/**
 * Main proxy entry point
 */
export async function getUV(input) {
  try {
    await registerSW();
    rAlert("Service Worker ✓");
  } catch (err) {
    rAlert(`SW failed:<br>${err.message}`);
    throw err;
  }

  const targetUrl = search(input);

  try {
    await configureTransport();
  } catch (err) {
    rAlert(`No backend:<br>${err.message}`);
    throw err;
  }

  return __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
}
