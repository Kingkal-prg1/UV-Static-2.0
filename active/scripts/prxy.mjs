// active/scripts/prxy.mjs
// Final production core – removes registerSW dependency entirely (Dec 2025 best practice)
// Many modern UV-Static forks register the SW directly in tabs.mjs or index.html – no separate module needed
// This eliminates import errors if register-sw.mjs is missing/broken

import * as BareMux from "../prxy/baremux/index.mjs";

import { rAlert } from "./utils.mjs";

// Root-relative worker path (required for BareMux URL validation)
const connection = new BareMux.BareMuxConnection("/UV-Static-2.0/active/prxy/baremux/worker.js");

// Elite backends – Mercury primary for speed/stealth
const WISP_PRIMARY = "wss://wisp.mercurywork.shop/";
const WISP_BACKUP  = "wss://wisp.titaniumnetwork.dev/";
const BARE_FALLBACK = "https://uv.bypass.tio.gg/bare/";

/**
 * URL resolver with robust search fallback
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
 * Transport chain – prioritized, self-healing
 */
async function configureTransport() {
  const transports = [
    { path: "../prxy/epoxy/index.mjs",       args: [{ wisp: WISP_PRIMARY }], name: "Epoxy (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_PRIMARY }], name: "Libcurl (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_BACKUP }],  name: "Libcurl (TN WISP)" },
    { path: "../prxy/baremod/bare-module.mjs", args: [BARE_FALLBACK],       name: "Bare HTTP (fallback)" },
  ];

  for (const t of transports) {
    try {
      if ((await connection.getTransport()) === t.path) return;
      await connection.setTransport(t.path, t.args);
      console.log(`Transport: ${t.name} ✅`);
      rAlert(`Backend: ${t.name.split(' ')[0]} ✓`);
      return;
    } catch (err) {
      console.warn(`Failed ${t.name}:`, err.message);
    }
  }

  throw new Error("No backend available");
}

/**
 * Main proxy function – ONLY handles transport + encoding (SW registration moved elsewhere)
 */
export async function getUV(input) {
  const targetUrl = search(input);

  try {
    await configureTransport();
  } catch (err) {
    rAlert(`Backend failed:<br>${err.message}`);
    throw err;
  }

  // Service Worker is now assumed pre-registered (common in UV-Static forks)
  rAlert("Ready ✓");

  return __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
}
